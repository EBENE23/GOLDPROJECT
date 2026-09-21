const express = require("express");

const {
  listerBacs,
  consulterBac,
  creerBac,
  modifierBac,
  supprimerBac,
} = require("../controllers/bacController");

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
    "SUPERVISEUR"
  ),
  listerBacs
);

router.get(
  "/:id",
  verifierRole(
    "ADMINISTRATEUR",
    "SUPERVISEUR"
  ),
  consulterBac
);

router.post(
  "/",
  verifierRole("ADMINISTRATEUR"),
  creerBac
);

router.put(
  "/:id",
  verifierRole("ADMINISTRATEUR"),
  modifierBac
);

router.delete(
  "/:id",
  verifierRole("ADMINISTRATEUR"),
  supprimerBac
);

module.exports = router;