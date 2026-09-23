const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { Utilisateur } = require("../models");

const connexion = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
      return res.status(400).json({
        message: "Email et mot de passe requis.",
      });
    }

    const utilisateur = await Utilisateur.findOne({
      where: { email },
    });

    if (!utilisateur) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect.",
      });
    }

    if (utilisateur.statutCompte !== "ACTIF") {
      return res.status(403).json({
        message: "Votre compte n'est pas actif.",
      });
    }

    const motDePasseValide = await bcrypt.compare(
      motDePasse,
      utilisateur.motDePasse
    );

    if (!motDePasseValide) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect.",
      });
    }

    const token = jwt.sign(
      {
        idUtilisateur: utilisateur.idUtilisateur,
        email: utilisateur.email,
        role: utilisateur.role,
      },
      process.env.JWT_SECRET,
      {
        algorithm: "HS256",
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      }
    );

    return res.status(200).json({
      message: "Connexion réussie.",
      token,
      utilisateur: {
        idUtilisateur: utilisateur.idUtilisateur,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        telephone: utilisateur.telephone,
        photoProfil: utilisateur.photoProfil,
        statutCompte: utilisateur.statutCompte,
        role: utilisateur.role,
        dateCreation: utilisateur.dateCreation,
        id_zone: utilisateur.id_zone,
      },
    });
  } catch (error) {
    console.error("Erreur connexion :", error);

    return res.status(500).json({
      message: "Erreur lors de la connexion.",
    });
  }
};

module.exports = {
  connexion,
};