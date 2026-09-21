const express = require("express");

const {
  suivreInterventions,
  listerAgentsZone,
  consulterTableauSuperviseur,
  listerBacsSuperviseur,
  consulterBacSuperviseur,
  consulterAlertesSuperviseur,
  consulterLocalisationBacs,
  consulterStatistiquesSuperviseur,
} = require("../controllers/superviseurController");

const {
  verifierToken,
  verifierRoleSuperviseur,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(verifierToken);
router.use(verifierRoleSuperviseur);

router.get(
  "/dashboard",
  consulterTableauSuperviseur
);

router.get(
  "/suivi",
  suivreInterventions
);

router.get(
  "/agents",
  listerAgentsZone
);

router.get(
  "/bacs",
  listerBacsSuperviseur
);

router.get(
  "/bacs/:id",
  consulterBacSuperviseur
);

router.get(
  "/alertes",
  consulterAlertesSuperviseur
);

router.get(
  "/localisation",
  consulterLocalisationBacs
);

router.get(
  "/statistiques",
  consulterStatistiquesSuperviseur
);

module.exports = router;