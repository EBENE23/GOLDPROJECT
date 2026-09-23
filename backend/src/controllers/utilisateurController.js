const { Utilisateur, Zone } = require("../models");
const { verifierPlaceDansZone } = require("../services/zoneRegles");

const listerUtilisateurs = async (req, res) => {
  try {
    const utilisateurs = await Utilisateur.findAll({
      attributes: {
        exclude: ["motDePasse"],
      },
      include: [
        {
          model: Zone,
          as: "zoneAffectation",
          attributes: [
            "idZone",
            "nomZone",
            "description",
          ],
          required: false,
        },
      ],
      order: [
        ["idUtilisateur", "ASC"],
      ],
    });

    return res.status(200).json(
      utilisateurs
    );
  } catch (error) {
    console.error(
      "Erreur liste utilisateurs :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la récupération des utilisateurs.",
    });
  }
};

const consulterUtilisateur = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const utilisateur =
      await Utilisateur.findByPk(id, {
        attributes: {
          exclude: ["motDePasse"],
        },
        include: [
          {
            model: Zone,
            as: "zoneAffectation",
            attributes: [
              "idZone",
              "nomZone",
              "description",
            ],
            required: false,
          },
        ],
      });

    if (!utilisateur) {
      return res.status(404).json({
        message: "Utilisateur introuvable.",
      });
    }

    return res.status(200).json(
      utilisateur
    );
  } catch (error) {
    console.error(
      "Erreur consultation utilisateur :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la consultation de l'utilisateur.",
    });
  }
};

const modifierProfil = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (
      !req.user ||
      Number(req.user.idUtilisateur) !==
        Number(id)
    ) {
      return res.status(403).json({
        message:
          "Vous ne pouvez modifier que votre propre profil.",
      });
    }

    const utilisateur =
      await Utilisateur.findByPk(id);

    if (!utilisateur) {
      return res.status(404).json({
        message: "Utilisateur introuvable.",
      });
    }

    const {
      nom,
      prenom,
      telephone,
    } = req.body;

    if (
      nom !== undefined &&
      String(nom).trim() === ""
    ) {
      return res.status(400).json({
        message:
          "Le nom ne peut pas être vide.",
      });
    }

    if (
      prenom !== undefined &&
      String(prenom).trim() === ""
    ) {
      return res.status(400).json({
        message:
          "Le prénom ne peut pas être vide.",
      });
    }

    const donnees = {};

    if (nom !== undefined) {
      donnees.nom = String(nom).trim();
    }

    if (prenom !== undefined) {
      donnees.prenom =
        String(prenom).trim();
    }

    if (telephone !== undefined) {
      donnees.telephone =
        telephone === null
          ? null
          : String(telephone).trim();
    }

    await utilisateur.update(
      donnees
    );

    const utilisateurMisAJour =
      await Utilisateur.findByPk(id, {
        attributes: {
          exclude: ["motDePasse"],
        },
        include: [
          {
            model: Zone,
            as: "zoneAffectation",
            attributes: [
              "idZone",
              "nomZone",
              "description",
            ],
            required: false,
          },
        ],
      });

    return res.status(200).json({
      message:
        "Profil mis à jour avec succès.",
      utilisateur:
        utilisateurMisAJour,
    });
  } catch (error) {
    console.error(
      "Erreur modification profil :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la modification du profil.",
    });
  }
};

const affecterZone = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { id_zone } = req.body;

    if (!id_zone) {
      return res.status(400).json({
        message:
          "L'identifiant de la zone est obligatoire.",
      });
    }

    const utilisateur =
      await Utilisateur.findByPk(id);

    if (!utilisateur) {
      return res.status(404).json({
        message: "Utilisateur introuvable.",
      });
    }

    const zone =
      await Zone.findByPk(id_zone);

    if (!zone) {
      return res.status(404).json({
        message: "Zone introuvable.",
      });
    }

    if (
      utilisateur.role !==
      "AGENT_COLLECTE"
    ) {
      return res.status(400).json({
        message:
          "Seul un agent de collecte peut être affecté à une zone par cette opération.",
      });
    }

    if (Number(utilisateur.id_zone) !== Number(id_zone)) {
      const refus = await verifierPlaceDansZone(zone, "AGENT_COLLECTE", {
        exclure: utilisateur.idUtilisateur,
      });

      if (refus) {
        return res.status(409).json({ message: refus });
      }
    }

    await utilisateur.update({
      id_zone,
    });

    return res.status(200).json({
      message:
        "Agent affecté à la zone avec succès.",
      utilisateur: {
        idUtilisateur:
          utilisateur.idUtilisateur,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        telephone:
          utilisateur.telephone,
        statutCompte:
          utilisateur.statutCompte,
        role: utilisateur.role,
        id_zone:
          utilisateur.id_zone,
      },
      zone: {
        idZone: zone.idZone,
        nomZone: zone.nomZone,
        description:
          zone.description,
      },
    });
  } catch (error) {
    console.error(
      "Erreur affectation zone :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de l'affectation de la zone.",
    });
  }
};

const desactiverUtilisateur = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const utilisateur =
      await Utilisateur.findByPk(id);

    if (!utilisateur) {
      return res.status(404).json({
        message: "Utilisateur introuvable.",
      });
    }

    if (
      utilisateur.role ===
      "ADMINISTRATEUR"
    ) {
      return res.status(400).json({
        message:
          "La désactivation d'un administrateur n'est pas autorisée par cette opération.",
      });
    }

    await utilisateur.update({
      statutCompte: "INACTIF",
    });

    return res.status(200).json({
      message:
        "Compte désactivé avec succès.",
    });
  } catch (error) {
    console.error(
      "Erreur désactivation utilisateur :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la désactivation du compte.",
    });
  }
};

const supprimerUtilisateur = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const utilisateur =
      await Utilisateur.findByPk(id);

    if (!utilisateur) {
      return res.status(404).json({
        message: "Utilisateur introuvable.",
      });
    }

    if (
      utilisateur.role ===
      "ADMINISTRATEUR"
    ) {
      return res.status(400).json({
        message:
          "La suppression d'un administrateur n'est pas autorisée par cette opération.",
      });
    }

    await utilisateur.destroy();

    return res.status(200).json({
      message:
        "Utilisateur supprimé avec succès.",
    });
  } catch (error) {
    console.error(
      "Erreur suppression utilisateur :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la suppression de l'utilisateur.",
    });
  }
};

module.exports = {
  listerUtilisateurs,
  consulterUtilisateur,
  modifierProfil,
  affecterZone,
  desactiverUtilisateur,
  supprimerUtilisateur,
};