const bcrypt = require("bcrypt");
const { Utilisateur, Zone } = require("../models");
const { validerPhotoProfil } = require("../utils/photoProfil");

const attributsPublics = [
  "idUtilisateur",
  "nom",
  "prenom",
  "email",
  "telephone",
  "photoProfil",
  "statutCompte",
  "role",
  "dateCreation",
  "id_zone",
];

// Profil à jour de l'utilisateur connecté (avec sa photo).
const consulterProfil = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findByPk(req.user.idUtilisateur, {
      attributes: attributsPublics,
    });

    if (!utilisateur) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    return res.status(200).json({ utilisateur });
  } catch (error) {
    console.error("Erreur consultation profil :", error);
    return res.status(500).json({ message: "Impossible de charger le profil." });
  }
};

// Superviseur de la zone de l'agent connecté : nom, coordonnées et photo.
const consulterMonSuperviseur = async (req, res) => {
  try {
    const moi = await Utilisateur.findByPk(req.user.idUtilisateur, {
      attributes: ["idUtilisateur", "role", "id_zone"],
    });

    if (!moi?.id_zone) {
      return res.status(200).json({ superviseur: null, zone: null });
    }

    const zone = await Zone.findByPk(moi.id_zone);
    const attributsSuperviseur = ["idUtilisateur", "nom", "prenom", "email", "telephone", "photoProfil", "statutCompte"];
    // Le superviseur d'une zone est désigné par zone.id_superviseur.
    const superviseur =
      (zone?.id_superviseur &&
        (await Utilisateur.findByPk(zone.id_superviseur, { attributes: attributsSuperviseur }))) ||
      (await Utilisateur.findOne({
        where: { role: "SUPERVISEUR", id_zone: moi.id_zone },
        attributes: attributsSuperviseur,
      }));

    return res.status(200).json({
      superviseur,
      zone: zone ? { idZone: zone.idZone, nomZone: zone.nomZone } : null,
    });
  } catch (error) {
    console.error("Erreur consultation superviseur :", error);
    return res.status(500).json({ message: "Impossible de charger votre superviseur." });
  }
};

const modifierProfil = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findByPk(
      req.user.idUtilisateur
    );

    if (!utilisateur) {
      return res.status(404).json({
        message: "Utilisateur introuvable.",
      });
    }

    const { nom, prenom, email, telephone, photoProfil } = req.body;
    const emailNormalise = String(email || "").trim().toLowerCase();

    if (!String(nom || "").trim() || !String(prenom || "").trim() || !emailNormalise) {
      return res.status(400).json({
        message: "Le nom, le prénom et l'email sont obligatoires.",
      });
    }

    const emailUtilise = await Utilisateur.findOne({
      where: { email: emailNormalise },
    });

    if (
      emailUtilise &&
      emailUtilise.idUtilisateur !== utilisateur.idUtilisateur
    ) {
      return res.status(409).json({
        message: "Cette adresse email est déjà utilisée.",
      });
    }

    utilisateur.nom = String(nom).trim();
    utilisateur.prenom = String(prenom).trim();
    utilisateur.email = emailNormalise;
    utilisateur.telephone = telephone ? String(telephone).trim() : null;
    if (photoProfil !== undefined) {
      const { photo, erreur } = validerPhotoProfil(photoProfil);

      if (erreur) {
        return res.status(400).json({ message: erreur });
      }

      utilisateur.photoProfil = photo;
    }
    await utilisateur.save();

    return res.status(200).json({
      message: "Profil mis à jour avec succès.",
      utilisateur: await utilisateur.reload({
        attributes: attributsPublics,
      }),
    });
  } catch (error) {
    console.error("Erreur modification profil :", error);
    return res.status(500).json({
      message: "Impossible de mettre à jour le profil.",
    });
  }
};

const modifierMotDePasse = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findByPk(
      req.user.idUtilisateur
    );
    const { ancienMotDePasse, nouveauMotDePasse } = req.body;

    if (!utilisateur) {
      return res.status(404).json({
        message: "Utilisateur introuvable.",
      });
    }

    if (!ancienMotDePasse || !nouveauMotDePasse) {
      return res.status(400).json({
        message: "Les deux mots de passe sont obligatoires.",
      });
    }

    if (nouveauMotDePasse.length < 8) {
      return res.status(400).json({
        message: "Le nouveau mot de passe doit contenir au moins 8 caractères.",
      });
    }

    const valide = await bcrypt.compare(
      ancienMotDePasse,
      utilisateur.motDePasse
    );

    if (!valide) {
      return res.status(400).json({
        message: "L'ancien mot de passe est incorrect.",
      });
    }

    utilisateur.motDePasse = await bcrypt.hash(nouveauMotDePasse, 12);
    await utilisateur.save();

    return res.status(200).json({
      message: "Mot de passe modifié avec succès.",
    });
  } catch (error) {
    console.error("Erreur modification mot de passe :", error);
    return res.status(500).json({
      message: "Impossible de modifier le mot de passe.",
    });
  }
};

module.exports = {
  consulterProfil,
  consulterMonSuperviseur,
  modifierProfil,
  modifierMotDePasse,
};
