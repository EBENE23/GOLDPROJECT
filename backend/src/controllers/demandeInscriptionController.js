const bcrypt = require("bcryptjs");
const { DemandeInscription, Utilisateur, Zone } = require("../models");
const { validerPhotoProfil } = require("../utils/photoProfil");
const { occupationDesZones, verifierPlaceDansZone } = require("../services/zoneRegles");

const creerDemandeInscription = async (req, res) => {
  try {
    const {
      nom,
      prenom,
      email,
      motDePasse,
      telephone,
      roleDemande,
      photoProfil
    } = req.body;

    if (!nom || !prenom || !email || !motDePasse || !roleDemande) {
      return res.status(400).json({
        message: "Les champs obligatoires sont requis."
      });
    }

    // Le formulaire vérifie déjà cette règle côté navigateur : elle est refaite
    // ici pour qu'un appel direct à l'API ne puisse pas la contourner.
    if (String(motDePasse).length < 8) {
      return res.status(400).json({
        message: "Le mot de passe doit contenir au moins 8 caractères."
      });
    }

    if (!["SUPERVISEUR", "AGENT_COLLECTE"].includes(roleDemande)) {
      return res.status(400).json({
        message: "Le rôle demandé est invalide."
      });
    }

    const { photo, erreur: erreurPhoto } = validerPhotoProfil(photoProfil);

    if (erreurPhoto) {
      return res.status(400).json({ message: erreurPhoto });
    }

    // Normalisé pour qu'une même adresse ne puisse pas créer deux comptes en
    // ne changeant que la casse (Ex@mail.com / ex@mail.com).
    const emailNormalise = String(email).trim().toLowerCase();

    const demandeExistante = await DemandeInscription.findOne({
      where: {
        email: emailNormalise,
        statut: "EN_ATTENTE"
      }
    });

    if (demandeExistante) {
      return res.status(409).json({
        message: "Une demande d'inscription est déjà en attente pour cet email."
      });
    }

    const utilisateurExistant = await Utilisateur.findOne({
      where: { email: emailNormalise }
    });

    if (utilisateurExistant) {
      return res.status(409).json({
        message: "Un utilisateur existe déjà avec cet email."
      });
    }

    const motDePasseHash = await bcrypt.hash(motDePasse, 12);

    const demande = await DemandeInscription.create({
      nom,
      prenom,
      email: emailNormalise,
      motDePasse: motDePasseHash,
      telephone: telephone || null,
      photoProfil: photo,
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

// Occupation des zones (superviseur en place, agents x/5) pour choisir l'affectation.
const listerOccupationZones = async (req, res) => {
  try {
    return res.status(200).json({ zones: await occupationDesZones() });
  } catch (error) {
    console.error("Erreur occupation des zones :", error);

    return res.status(500).json({
      message: "Erreur lors de la récupération de l'occupation des zones."
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

    const refus = await verifierPlaceDansZone(zone, demande.roleDemande, {
      transaction
    });

    if (refus) {
      await transaction.rollback();

      return res.status(409).json({
        message: refus
      });
    }

    const utilisateur = await Utilisateur.create(
      {
        nom: demande.nom,
        prenom: demande.prenom,
        email: demande.email,
        motDePasse: demande.motDePasse,
        telephone: demande.telephone,
        photoProfil: demande.photoProfil,
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
  listerOccupationZones,
  consulterDemandeInscription,
  approuverDemandeInscription,
  refuserDemandeInscription
};