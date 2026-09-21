// Seuils métier (en %), identiques à ceux du backend (mesureService).
export const SEUIL_ALERTE = 50;
export const SEUIL_PLEIN = 80;

export type BacLevelCategory = "NORMAL" | "ALERTE" | "PLEIN";

export const normaliserNiveauBac = (niveau: number | string | null | undefined) =>
  Math.max(0, Math.min(100, Number(niveau) || 0));

export const obtenirCategorieNiveauBac = (
  niveau: number | string | null | undefined
): BacLevelCategory => {
  const niveauNormalise = normaliserNiveauBac(niveau);

  if (niveauNormalise <= SEUIL_ALERTE) {
    return "NORMAL";
  }

  if (niveauNormalise <= SEUIL_PLEIN) {
    return "ALERTE";
  }

  return "PLEIN";
};

export const obtenirCouleurNiveauBac = (
  niveau: number | string | null | undefined
) => {
  switch (obtenirCategorieNiveauBac(niveau)) {
    case "NORMAL":
      return "#16a34a";
    case "ALERTE":
      return "#f97316";
    case "PLEIN":
      return "#dc2626";
  }
};

export const obtenirClasseTexteNiveauBac = (
  niveau: number | string | null | undefined
) => {
  switch (obtenirCategorieNiveauBac(niveau)) {
    case "NORMAL":
      return "text-green-600";
    case "ALERTE":
      return "text-orange-600";
    case "PLEIN":
      return "text-red-600";
  }
};

export const obtenirClasseFondNiveauBac = (
  niveau: number | string | null | undefined
) => {
  switch (obtenirCategorieNiveauBac(niveau)) {
    case "NORMAL":
      return "bg-green-600";
    case "ALERTE":
      return "bg-orange-500";
    case "PLEIN":
      return "bg-red-600";
  }
};
