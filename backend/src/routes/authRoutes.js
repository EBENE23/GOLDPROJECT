const express = require("express");
const rateLimit = require("express-rate-limit");
const { connexion } = require("../controllers/authController");

const router = express.Router();

// Limite les tentatives de connexion pour freiner le brute-force.
const limiteConnexion = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Trop de tentatives de connexion. Réessayez dans quelques minutes.",
  },
});

router.post("/login", limiteConnexion, connexion);

module.exports = router;
