const express = require("express");

const {
  listerZones,
  consulterZone,
} = require("../controllers/zoneController");

const {
  verifierToken,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(verifierToken);

router.get(
  "/",
  listerZones
);

router.get(
  "/:id",
  consulterZone
);

module.exports = router;