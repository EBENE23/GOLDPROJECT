const express = require("express");
const { verifierToken } = require("../middlewares/authMiddleware");
const {
  consulterProfil,
  consulterMonSuperviseur,
  modifierProfil,
  modifierMotDePasse,
} = require("../controllers/profilController");

const router = express.Router();

router.get("/me", verifierToken, consulterProfil);
router.get("/mon-superviseur", verifierToken, consulterMonSuperviseur);
router.put("/me", verifierToken, modifierProfil);
router.put("/me/mot-de-passe", verifierToken, modifierMotDePasse);

module.exports = router;
