const express = require("express");
const { verifierToken } = require("../middlewares/authMiddleware");
const {
  modifierProfil,
  modifierMotDePasse,
} = require("../controllers/profilController");

const router = express.Router();

router.put("/me", verifierToken, modifierProfil);
router.put("/me/mot-de-passe", verifierToken, modifierMotDePasse);

module.exports = router;
