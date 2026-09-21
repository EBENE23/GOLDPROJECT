const express = require("express");

const {
  creerIntervention,
  affecterIntervention,
  listerInterventions,
  consulterIntervention,
  modifierIntervention,
  annulerIntervention,
} = require("../controllers/interventionController");

const {
  verifierToken,
  verifierRole,
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
  listerInterventions
);

router.get(
  "/:id",
  verifierRole(
    "ADMINISTRATEUR",
    "SUPERVISEUR",
    "AGENT_COLLECTE"
  ),
  consulterIntervention
);

router.post(
  "/",
  verifierRole("SUPERVISEUR"),
  creerIntervention
);

router.post(
  "/:id/affecter",
  verifierRole("SUPERVISEUR"),
  affecterIntervention
);

router.put(
  "/:id",
  verifierRole("SUPERVISEUR"),
  modifierIntervention
);

router.put(
  "/:id/annuler",
  verifierRole("SUPERVISEUR"),
  annulerIntervention
);

module.exports = router;