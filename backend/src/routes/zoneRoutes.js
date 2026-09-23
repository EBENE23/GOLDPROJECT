const express = require("express");

const {
  listerZones,
  consulterZone,
} = require("../controllers/zoneController");

const {
  verifierToken,
  verifierRole,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(verifierToken);

// Cette liste expose l'annuaire complet (superviseurs, agents, téléphones,
// photos) et la position de tous les bacs, toutes zones confondues : réservé
// à l'administrateur. Le superviseur et l'agent ont leurs propres routes
// (/superviseur/*, /agent/*, /profil/mon-superviseur) déjà limitées à leur zone.
router.use(verifierRole("ADMINISTRATEUR"));

router.get(
  "/",
  listerZones
);

router.get(
  "/:id",
  consulterZone
);

module.exports = router;