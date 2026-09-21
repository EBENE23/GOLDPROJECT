const express = require("express");
const { verifierToken } = require("../middlewares/authMiddleware");
const { listerIncidents, creerIncident } = require("../controllers/incidentController");

const router = express.Router();
router.get("/", verifierToken, listerIncidents);
router.post("/mission/:id", verifierToken, creerIncident);
module.exports = router;
