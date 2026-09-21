// Seuils métier (en %) : NORMAL <= SEUIL_ALERTE < ALERTE <= SEUIL_PLEIN < PLEIN
const SEUIL_ALERTE = 50;
const SEUIL_PLEIN = 80;

// Zone morte du capteur ultrasonique (cm) : distance minimale mesurable, ex. 25
// pour un JSN-SR04T. Le bac est considéré à 100 % quand les déchets atteignent
// cette limite. Valeur 0 (défaut) : niveau = (hauteur - distance) / hauteur.
const ZONE_MORTE_CM = Math.max(0, Number(process.env.ZONE_MORTE_CM || 0));

const calculerEtatBac = (pourcentage) => {
  const pourcentageNormalise = Math.max(
    0,
    Math.min(100, Number(pourcentage))
  );

  if (pourcentageNormalise <= SEUIL_ALERTE) {
    return "NORMAL";
  }

  if (pourcentageNormalise <= SEUIL_PLEIN) {
    return "ALERTE";
  }

  return "PLEIN";
};

const calculerRemplissage = ({
  distance,
  hauteur,
}) => {
  const distanceNumerique = Number(distance);
  const hauteurNumerique = Number(hauteur);

  if (
    Number.isNaN(distanceNumerique) ||
    Number.isNaN(hauteurNumerique) ||
    hauteurNumerique <= 0
  ) {
    throw new Error(
      "Les valeurs de distance et de hauteur sont invalides."
    );
  }

  const niveau = Math.max(
    0,
    hauteurNumerique - distanceNumerique
  );

  const hauteurUtile = hauteurNumerique - ZONE_MORTE_CM;

  if (hauteurUtile <= 0) {
    throw new Error(
      "La hauteur du bac doit être supérieure à la zone morte du capteur."
    );
  }

  const pourcentageBrut =
    (niveau / hauteurUtile) * 100;

  const pourcentage = Math.max(
    0,
    Math.min(
      100,
      Number(pourcentageBrut.toFixed(2))
    )
  );

  const etat =
    calculerEtatBac(pourcentage);

  return {
    distance: distanceNumerique,
    niveau: Number(niveau.toFixed(2)),
    pourcentage,
    etat,
  };
};

module.exports = {
  SEUIL_ALERTE,
  SEUIL_PLEIN,
  calculerEtatBac,
  calculerRemplissage,
};