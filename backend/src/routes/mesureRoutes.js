const express = require("express");

const {
  listerMesures,
  consulterMesure,
  obtenirHistoriqueBac
} = require("../controllers/mesureController");

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
  listerMesures
);

router.get(
  "/bac/:id/historique",
  verifierRole(
    "ADMINISTRATEUR",
    "SUPERVISEUR",
    "AGENT_COLLECTE"
  ),
  obtenirHistoriqueBac
);

router.get(
  "/:id",
  verifierRole(
    "ADMINISTRATEUR",
    "SUPERVISEUR",
    "AGENT_COLLECTE"
  ),
  consulterMesure
);

module.exports = router;