// Photo de profil stockée en base sous forme d'image encodée (data URL).
// Le navigateur la réduit avant l'envoi : quelques dizaines de Ko suffisent pour un avatar.
const TAILLE_MAX = 400000;
const FORMAT = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

// Retourne { photo } (valeur à enregistrer, null = aucune) ou { erreur }.
const validerPhotoProfil = (valeur) => {
  if (valeur === undefined || valeur === null || valeur === "") {
    return { photo: null };
  }

  if (typeof valeur !== "string" || !FORMAT.test(valeur)) {
    return { erreur: "La photo doit être une image JPG, PNG ou WEBP valide." };
  }

  if (valeur.length > TAILLE_MAX) {
    return { erreur: "La photo est trop volumineuse (400 Ko maximum)." };
  }

  return { photo: valeur };
};

module.exports = { validerPhotoProfil, TAILLE_MAX };
