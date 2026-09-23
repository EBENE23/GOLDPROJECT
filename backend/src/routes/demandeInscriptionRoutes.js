const express = require("express");
const rateLimit = require("express-rate-limit");

const {
  creerDemandeInscription,
  listerDemandesInscription,
  listerOccupationZones,
  consulterDemandeInscription,
  approuverDemandeInscription,
  refuserDemandeInscription,
} = require("../controllers/demandeInscriptionController");

const { verifierToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// Route publique (aucune authentification) : limite le dépôt de demandes pour
// freiner le spam et l'énumération automatisée d'adresses e-mail.
const limiteInscription = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Trop de demandes d'inscription depuis cette connexion. Réessayez plus tard.",
  },
});

router.post("/", limiteInscription, creerDemandeInscription);

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

router.get("/zones/occupation", verifierAdministrateur, listerOccupationZones);

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