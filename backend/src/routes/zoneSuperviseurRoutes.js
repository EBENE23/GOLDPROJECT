const express = require("express");

const {
  affecterSuperviseur,
  retirerSuperviseur,
} = require("../controllers/zoneSuperviseurController");

const {
  verifierToken,
  verifierRoleAdministrateur,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(verifierToken);

router.put(
  "/:id/superviseur",
  verifierRoleAdministrateur,
  affecterSuperviseur
);

router.delete(
  "/:id/superviseur",
  verifierRoleAdministrateur,
  retirerSuperviseur
);

module.exports = router;
