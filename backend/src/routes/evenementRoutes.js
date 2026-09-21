const express = require("express");

const { verifierToken } = require("../middlewares/authMiddleware");
const { ajouterClient } = require("../services/evenementsService");

const router = express.Router();

router.use(verifierToken);

// Flux temps réel (SSE), authentifié par l'en-tête Authorization habituel.
router.get("/", (req, res) => {
  ajouterClient(req, res, req.user).catch((erreur) => {
    console.error("Erreur ouverture flux temps réel :", erreur);
    if (!res.headersSent) {
      res.status(500).json({ message: "Flux temps réel indisponible." });
    }
  });
});

module.exports = router;
