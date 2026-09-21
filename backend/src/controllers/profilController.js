const bcrypt = require("bcrypt");
const { Utilisateur } = require("../models");

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

const modifierProfil = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findByPk(
      req.utilisateur.idUtilisateur
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
      utilisateur.photoProfil = photoProfil || null;
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
      req.utilisateur.idUtilisateur
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

    utilisateur.motDePasse = await bcrypt.hash(nouveauMotDePasse, 10);
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
  modifierProfil,
  modifierMotDePasse,
};
