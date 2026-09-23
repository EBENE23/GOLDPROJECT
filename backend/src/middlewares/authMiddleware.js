const jwt = require("jsonwebtoken");

const { Utilisateur } = require("../models");

const verifierToken = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        message: "Token d'authentification requis."
      });
    }

    const parties = authorization.split(" ");

    if (parties.length !== 2 || parties[0] !== "Bearer") {
      return res.status(401).json({
        message: "Format du token invalide."
      });
    }

    const token = parties[1];

    // Épingle l'algorithme accepté : un jeton signé (ou falsifié) avec un autre
    // algorithme, y compris "none", est rejeté avant toute autre vérification.
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    // Recharge l'état réel du compte : rôle, zone d'affectation et statut
    // peuvent avoir changé depuis l'émission du jeton.
    const utilisateur = await Utilisateur.findByPk(decoded.idUtilisateur, {
      attributes: ["idUtilisateur", "email", "role", "statutCompte", "id_zone"],
    });

    if (!utilisateur || utilisateur.statutCompte !== "ACTIF") {
      return res.status(401).json({
        message: "Compte inexistant ou désactivé.",
      });
    }

    req.user = {
      ...decoded,
      role: utilisateur.role,
      id_zone: utilisateur.id_zone,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token invalide ou expiré."
    });
  }
};

const verifierRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Vous n'avez pas les autorisations nécessaires."
      });
    }

    next();
  };
};

const verifierRoleAdministrateur = verifierRole("ADMINISTRATEUR");

const verifierRoleSuperviseur = verifierRole("SUPERVISEUR");

const verifierRoleAgent = verifierRole("AGENT_COLLECTE");

module.exports = {
  verifierToken,
  verifierRole,
  verifierRoleAdministrateur,
  verifierRoleSuperviseur,
  verifierRoleAgent
};