const express = require("express");

const {
  mettreAJourPositionMission,
  consulterTableauAgent,
  consulterMissionsAgent,
  consulterMissionAgent,
  consulterLocalisationMission,
  consulterLocalisationBacsAgent
} = require("../controllers/agentController");

const {
  verifierToken,
  verifierRoleAgent
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(verifierToken);

router.use(verifierRoleAgent);

router.get(
  "/dashboard",
  consulterTableauAgent
);

router.get(
  "/localisation",
  consulterLocalisationBacsAgent
);

router.get(
  "/missions",
  consulterMissionsAgent
);

router.put(
  "/missions/:id/position",
  mettreAJourPositionMission
);

router.get(
  "/missions/:id/localisation",
  consulterLocalisationMission
);

router.get(
  "/missions/:id",
  consulterMissionAgent
);

module.exports = router;