/** Période de filtrage : dates locales au format AAAA-MM-JJ ("" = pas de borne). */
export interface PlageDates {
  debut: string;
  fin: string;
}

export const plageVide: PlageDates = { debut: "", fin: "" };

const deuxChiffres = (n: number) => String(n).padStart(2, "0");

/** Date locale au format AAAA-MM-JJ (et non UTC, pour ne pas décaler d'un jour). */
export const versJour = (date: Date) =>
  `${date.getFullYear()}-${deuxChiffres(date.getMonth() + 1)}-${deuxChiffres(date.getDate())}`;

export const plageActive = (plage: PlageDates) => Boolean(plage.debut || plage.fin);

/** Vrai si la date (ISO, timestamp…) tombe dans la période ; une date absente est exclue si une période est active. */
export const dansPlage = (valeur: string | null | undefined, plage: PlageDates) => {
  if (!plageActive(plage)) return true;
  if (!valeur) return false;

  const date = new Date(valeur);
  if (Number.isNaN(date.getTime())) return false;

  const jour = versJour(date);

  return (!plage.debut || jour >= plage.debut) && (!plage.fin || jour <= plage.fin);
};

export const joursEnArriere = (jours: number): PlageDates => {
  const fin = new Date();
  const debut = new Date();
  debut.setDate(debut.getDate() - (jours - 1));

  return { debut: versJour(debut), fin: versJour(fin) };
};

// Les libellés (Aujourd'hui, 7 jours…) sont résolus à l'affichage via
// useTraductionPresetsPeriode() ci-dessous, pour suivre la langue choisie.
export const PRESETS_PERIODE = [
  { id: "aujourdhui", cle: "filtreDates.aujourdhui", plage: () => joursEnArriere(1) },
  { id: "7j", cle: "filtreDates.septJours", plage: () => joursEnArriere(7) },
  { id: "30j", cle: "filtreDates.trenteJours", plage: () => joursEnArriere(30) },
] as const;

type T = (chemin: string, variables?: Record<string, string | number>) => string;

/** Libellé de la période (« Toute la période », « Depuis le… », etc.), traduit et dans la bonne locale. */
export const libellePlage = (plage: PlageDates, t: T, locale = "fr-FR") => {
  if (!plageActive(plage)) return t("filtreDates.toutePeriode");

  const format = (jour: string) =>
    new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(new Date(`${jour}T00:00:00`));

  if (plage.debut && plage.fin) return plage.debut === plage.fin ? format(plage.debut) : `${format(plage.debut)} → ${format(plage.fin)}`;
  return plage.debut ? t("filtreDates.depuisLe", { date: format(plage.debut) }) : t("filtreDates.jusquAu", { date: format(plage.fin) });
};
