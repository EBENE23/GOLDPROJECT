const express = require("express");

const {
  listerUtilisateurs,
  consulterUtilisateur,
  modifierProfil,
  affecterZone,
  desactiverUtilisateur,
  supprimerUtilisateur,
} = require("../controllers/utilisateurController");

const {
  verifierToken,
  verifierRoleAdministrateur,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(verifierToken);

// L'annuaire complet est réservé à l'administrateur. Le superviseur consulte
// les agents de sa zone via GET /api/superviseur/agents.
router.get(
  "/",
  verifierRoleAdministrateur,
  listerUtilisateurs
);

// Un utilisateur peut consulter son propre compte ; les rôles de gestion, tous.
const autoriserSoiOuGestion = (req, res, next) => {
  const estGestion = req.user?.role === "ADMINISTRATEUR";
  const estSoiMeme = Number(req.user?.idUtilisateur) === Number(req.params.id);

  if (!estGestion && !estSoiMeme) {
    return res.status(403).json({
      message: "Vous n'avez pas les autorisations nécessaires.",
    });
  }

  next();
};

router.get(
  "/:id",
  autoriserSoiOuGestion,
  consulterUtilisateur
);

router.put(
  "/:id",
  modifierProfil
);

router.put(
  "/:id/zone",
  verifierRoleAdministrateur,
  affecterZone
);

router.put(
  "/:id/desactiver",
  verifierRoleAdministrateur,
  desactiverUtilisateur
);

router.delete(
  "/:id",
  verifierRoleAdministrateur,
  supprimerUtilisateur
);

module.exports = router;