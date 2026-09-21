const express = require("express");

const {
  creerDemandeInscription,
  listerDemandesInscription,
  consulterDemandeInscription,
  approuverDemandeInscription,
  refuserDemandeInscription,
} = require("../controllers/demandeInscriptionController");

const { verifierToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", creerDemandeInscription);

router.use(verifierToken);

const verifierAdministrateur = (req, res, next) => {
  if (req.user?.role !== "ADMINISTRATEUR") {
    return res.status(403).json({
      message: "Accès réservé à l'administrateur.",
    });
  }

  next();
};

router.get("/", verifierAdministrateur, listerDemandesInscription);

router.get("/:id", verifierAdministrateur, consulterDemandeInscription);

router.put(
  "/:id/approuver",
  verifierAdministrateur,
  approuverDemandeInscription
);

router.put(
  "/:id/refuser",
  verifierAdministrateur,
  refuserDemandeInscription
);

module.exports = router;