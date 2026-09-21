const bcrypt = require("bcryptjs");
const { DemandeInscription, Utilisateur, Zone } = require("../models");

const creerDemandeInscription = async (req, res) => {
  try {
    const {
      nom,
      prenom,
      email,
      motDePasse,
      telephone,
      roleDemande
    } = req.body;

    if (!nom || !prenom || !email || !motDePasse || !roleDemande) {
      return res.status(400).json({
        message: "Les champs obligatoires sont requis."
      });
    }

    if (!["SUPERVISEUR", "AGENT_COLLECTE"].includes(roleDemande)) {
      return res.status(400).json({
        message: "Le rôle demandé est invalide."
      });
    }

    const demandeExistante = await DemandeInscription.findOne({
      where: {
        email,
        statut: "EN_ATTENTE"
      }
    });

    if (demandeExistante) {
      return res.status(409).json({
        message: "Une demande d'inscription est déjà en attente pour cet email."
      });
    }

    const utilisateurExistant = await Utilisateur.findOne({
      where: { email }
    });

    if (utilisateurExistant) {
      return res.status(409).json({
        message: "Un utilisateur existe déjà avec cet email."
      });
    }

    const motDePasseHash = await bcrypt.hash(motDePasse, 10);

    const demande = await DemandeInscription.create({
      nom,
      prenom,
      email,
      motDePasse: motDePasseHash,
      telephone: telephone || null,
      roleDemande,
      statut: "EN_ATTENTE",
      dateDemande: new Date()
    });

    return res.status(201).json({
      message: "Demande d'inscription créée avec succès.",
      demande
    });
  } catch (error) {
    console.error("Erreur création demande :", error);

    return res.status(500).json({
      message: "Erreur lors de la création de la demande."
    });
  }
};

const listerDemandesInscription = async (req, res) => {
  try {
    const demandes = await DemandeInscription.findAll({
      attributes: {
        exclude: ["motDePasse"]
      },
      order: [["dateDemande", "DESC"]]
    });

    return res.status(200).json({
      demandes
    });
  } catch (error) {
    console.error("Erreur liste demandes :", error);

    return res.status(500).json({
      message: "Erreur lors de la récupération des demandes."
    });
  }
};

const consulterDemandeInscription = async (req, res) => {
  try {
    const { id } = req.params;

    const demande = await DemandeInscription.findByPk(id, {
      attributes: {
        exclude: ["motDePasse"]
      }
    });

    if (!demande) {
      return res.status(404).json({
        message: "Demande d'inscription introuvable."
      });
    }

    return res.status(200).json({
      demande
    });
  } catch (error) {
    console.error("Erreur consultation demande :", error);

    return res.status(500).json({
      message: "Erreur lors de la consultation de la demande."
    });
  }
};

const approuverDemandeInscription = async (req, res) => {
  const transaction = await DemandeInscription.sequelize.transaction();

  try {
    const { id } = req.params;
    const { idZone } = req.body;

    if (!idZone) {
      await transaction.rollback();

      return res.status(400).json({
        message: "La zone est obligatoire pour approuver la demande."
      });
    }

    const demande = await DemandeInscription.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!demande) {
      await transaction.rollback();

      return res.status(404).json({
        message: "Demande d'inscription introuvable."
      });
    }

    if (demande.statut !== "EN_ATTENTE") {
      await transaction.rollback();

      return res.status(409).json({
        message: "Cette demande a déjà été traitée."
      });
    }

    const zone = await Zone.findByPk(idZone, {
      transaction
    });

    if (!zone) {
      await transaction.rollback();

      return res.status(404).json({
        message: "Zone introuvable."
      });
    }

    const utilisateurExistant = await Utilisateur.findOne({
      where: {
        email: demande.email
      },
      transaction
    });

    if (utilisateurExistant) {
      await transaction.rollback();

      return res.status(409).json({
        message: "Un utilisateur existe déjà avec cet email."
      });
    }

    if (
      demande.roleDemande === "SUPERVISEUR" &&
      zone.id_superviseur
    ) {
      await transaction.rollback();

      return res.status(409).json({
        message: "Cette zone possède déjà un superviseur."
      });
    }

    const utilisateur = await Utilisateur.create(
      {
        nom: demande.nom,
        prenom: demande.prenom,
        email: demande.email,
        motDePasse: demande.motDePasse,
        telephone: demande.telephone,
        statutCompte: "ACTIF",
        dateCreation: new Date(),
        role: demande.roleDemande,
        id_zone: idZone
      },
      {
        transaction
      }
    );

    if (demande.roleDemande === "SUPERVISEUR") {
      await zone.update(
        {
          id_superviseur: utilisateur.idUtilisateur
        },
        {
          transaction
        }
      );
    }

    await demande.update(
      {
        statut: "APPROUVEE",
        idUtilisateur: utilisateur.idUtilisateur
      },
      {
        transaction
      }
    );

    await transaction.commit();

    return res.status(200).json({
      message: "Demande d'inscription approuvée avec succès.",
      demande: {
        idDemande: demande.idDemande,
        statut: demande.statut,
        idUtilisateur: demande.idUtilisateur
      },
      utilisateur: {
        idUtilisateur: utilisateur.idUtilisateur,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        telephone: utilisateur.telephone,
        statutCompte: utilisateur.statutCompte,
        role: utilisateur.role,
        id_zone: utilisateur.id_zone,
        dateCreation: utilisateur.dateCreation
      },
      zone: {
        idZone: zone.idZone,
        nomZone: zone.nomZone
      }
    });
  } catch (error) {
    await transaction.rollback();

    console.error("Erreur approbation demande :", error);

    return res.status(500).json({
      message: "Erreur lors de l'approbation de la demande."
    });
  }
};

const refuserDemandeInscription = async (req, res) => {
  const transaction = await DemandeInscription.sequelize.transaction();

  try {
    const { id } = req.params;

    const demande = await DemandeInscription.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!demande) {
      await transaction.rollback();

      return res.status(404).json({
        message: "Demande d'inscription introuvable."
      });
    }

    if (demande.statut !== "EN_ATTENTE") {
      await transaction.rollback();

      return res.status(409).json({
        message: "Cette demande a déjà été traitée."
      });
    }

    await demande.update(
      {
        statut: "REFUSEE"
      },
      {
        transaction
      }
    );

    await transaction.commit();

    return res.status(200).json({
      message: "Demande d'inscription refusée avec succès.",
      demande: {
        idDemande: demande.idDemande,
        statut: demande.statut,
        idUtilisateur: demande.idUtilisateur
      }
    });
  } catch (error) {
    await transaction.rollback();

    console.error("Erreur refus demande :", error);

    return res.status(500).json({
      message: "Erreur lors du refus de la demande."
    });
  }
};

module.exports = {
  creerDemandeInscription,
  listerDemandesInscription,
  consulterDemandeInscription,
  approuverDemandeInscription,
  refuserDemandeInscription
};