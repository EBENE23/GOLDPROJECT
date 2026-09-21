const express = require("express");

const {
  creerMission,
  listerMissions,
  consulterMission,
  demarrerMission,
  suspendreMission,
  reprendreMission,
  terminerMission,
  annulerMission
} = require("../controllers/missionController");

const {
  verifierToken,
  verifierRole
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(verifierToken);

router.get(
  "/",
  verifierRole(
    "ADMINISTRATEUR",
    "SUPERVISEUR",
    "AGENT_COLLECTE"
  ),
  listerMissions
);

router.get(
  "/:id",
  verifierRole(
    "ADMINISTRATEUR",
    "SUPERVISEUR",
    "AGENT_COLLECTE"
  ),
  consulterMission
);

router.post(
  "/",
  verifierRole("SUPERVISEUR"),
  creerMission
);

router.put(
  "/:id/demarrer",
  verifierRole("AGENT_COLLECTE"),
  demarrerMission
);

router.put(
  "/:id/suspendre",
  verifierRole("AGENT_COLLECTE"),
  suspendreMission
);

router.put(
  "/:id/reprendre",
  verifierRole("AGENT_COLLECTE"),
  reprendreMission
);

router.put(
  "/:id/terminer",
  verifierRole("AGENT_COLLECTE"),
  terminerMission
);

router.put(
  "/:id/annuler",
  verifierRole(
    "ADMINISTRATEUR",
    "SUPERVISEUR",
    "AGENT_COLLECTE"
  ),
  annulerMission
);

module.exports = router;