import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Loader2 } from "lucide-react";

import {
  obtenirCategorieNiveauBac,
  normaliserNiveauBac,
  type BacLevelCategory,
} from "../../utils/bacLevel";
import { LOCALE_INTL, useTranslation } from "../../i18n";

/* ------------------------------------------------------------------ */
/* Métadonnées d'état d'un bac (couleurs identiques dans toute l'app)  */
/* ------------------------------------------------------------------ */

// Les couleurs ne changent pas avec la langue ; le libellé est résolu à
// l'affichage via useEtatMeta() ci-dessous.
export const etatMeta: Record<
  BacLevelCategory,
  { libelleCle: string; couleur: string; bordure: string; badge: string; fond: string }
> = {
  NORMAL: {
    libelleCle: "commun.etatNormal",
    couleur: "#16a34a",
    bordure: "border-l-green-500",
    badge: "bg-green-50 text-green-700 ring-green-600/20",
    fond: "bg-green-500",
  },
  ALERTE: {
    libelleCle: "commun.etatAlerte",
    couleur: "#f97316",
    bordure: "border-l-orange-500",
    badge: "bg-orange-50 text-orange-700 ring-orange-600/20",
    fond: "bg-orange-500",
  },
  PLEIN: {
    libelleCle: "commun.etatCritique",
    couleur: "#dc2626",
    bordure: "border-l-red-500",
    badge: "bg-red-50 text-red-700 ring-red-600/20",
    fond: "bg-red-500",
  },
};

/* ------------------------------------------------------------------ */
/* Structure                                                           */
/* ------------------------------------------------------------------ */

export function PageHeader({
  titre,
  description,
  actions,
}: {
  titre: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{titre}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Card({
  children,
  className = "",
  severite,
}: {
  children: ReactNode;
  className?: string;
  // Bord gauche coloré selon la gravité, comme sur les maquettes.
  severite?: BacLevelCategory;
}) {
  return (
    <section
      className={`anim-carte rounded-2xl border border-slate-100 bg-white shadow-sm ${
        severite ? `border-l-4 ${etatMeta[severite].bordure}` : ""
      } ${className}`}
    >
      {children}
    </section>
  );
}

export function SectionTitle({
  icone: Icone,
  titre,
  sousTitre,
  droite,
}: {
  icone?: LucideIcon;
  titre: string;
  sousTitre?: string;
  droite?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {Icone && <Icone size={18} className="shrink-0 text-emerald-700" />}
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold text-slate-900">{titre}</h2>
          {sousTitre && <p className="text-xs text-slate-500">{sousTitre}</p>}
        </div>
      </div>
      {droite}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Indicateurs                                                         */
/* ------------------------------------------------------------------ */

const teintes = {
  vert: "bg-green-50 text-green-700",
  bleu: "bg-sky-50 text-sky-700",
  orange: "bg-orange-50 text-orange-600",
  rouge: "bg-red-50 text-red-600",
  gris: "bg-slate-100 text-slate-600",
} as const;

export type Teinte = keyof typeof teintes;

export function KpiCard({
  libelle,
  valeur,
  detail,
  icone: Icone,
  teinte = "vert",
}: {
  libelle: string;
  valeur: ReactNode;
  detail?: ReactNode;
  icone: LucideIcon;
  teinte?: Teinte;
}) {
  return (
    <div className="anim-carte rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-slate-500 sm:text-sm">{libelle}</p>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${teintes[teinte]}`}>
          <Icone size={16} />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold leading-none text-slate-900 sm:text-3xl">{valeur}</p>
      {detail && <p className="mt-2 text-xs text-slate-500">{detail}</p>}
    </div>
  );
}

/** Anneau de remplissage d'un bac (0–100 %). */
export function LevelRing({
  niveau,
  taille = 64,
  epaisseur = 7,
}: {
  niveau: number | string | null | undefined;
  taille?: number;
  epaisseur?: number;
}) {
  const valeur = normaliserNiveauBac(niveau);
  const meta = etatMeta[obtenirCategorieNiveauBac(valeur)];
  const rayon = (taille - epaisseur) / 2;
  const circonference = 2 * Math.PI * rayon;

  return (
    <div className="relative shrink-0" style={{ width: taille, height: taille }}>
      <svg width={taille} height={taille} className="-rotate-90">
        <circle cx={taille / 2} cy={taille / 2} r={rayon} fill="none" stroke="#e2e8f0" strokeWidth={epaisseur} />
        <circle
          cx={taille / 2}
          cy={taille / 2}
          r={rayon}
          fill="none"
          stroke={meta.couleur}
          strokeWidth={epaisseur}
          strokeLinecap="round"
          strokeDasharray={circonference}
          strokeDashoffset={circonference * (1 - valeur / 100)}
          style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.4s ease" }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-bold"
        style={{ color: meta.couleur, fontSize: taille * 0.24 }}
      >
        {Math.round(valeur)}%
      </span>
    </div>
  );
}

export function LevelBar({ niveau }: { niveau: number | string | null | undefined }) {
  const valeur = normaliserNiveauBac(niveau);
  const meta = etatMeta[obtenirCategorieNiveauBac(valeur)];

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full transition-all duration-700 ${meta.fond}`} style={{ width: `${valeur}%` }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pastilles                                                           */
/* ------------------------------------------------------------------ */

export function EtatBadge({ niveau, etat }: { niveau?: number | string | null; etat?: BacLevelCategory }) {
  const { t } = useTranslation();
  const categorie = etat ?? obtenirCategorieNiveauBac(niveau);
  const meta = etatMeta[categorie];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${meta.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.fond}`} />
      {t(meta.libelleCle)}
    </span>
  );
}

/** Référence technique en police monospace (ex. « #BAC-YDE1-001 »). */
export function RefPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-700">
      {children}
    </span>
  );
}

const tonsStatut = {
  vert: "bg-green-50 text-green-700 ring-green-600/20",
  bleu: "bg-sky-50 text-sky-700 ring-sky-600/20",
  orange: "bg-orange-50 text-orange-700 ring-orange-600/20",
  rouge: "bg-red-50 text-red-700 ring-red-600/20",
  gris: "bg-slate-100 text-slate-600 ring-slate-500/20",
} as const;

export function StatutBadge({ ton = "gris", children }: { ton?: keyof typeof tonsStatut; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${tonsStatut[ton]}`}
    >
      {children}
    </span>
  );
}

/** Ton du badge pour un statut d'intervention ou de mission. */
export const tonStatut = (statut?: string): keyof typeof tonsStatut => {
  switch (statut) {
    case "TERMINEE":
      return "vert";
    case "EN_COURS":
      return "bleu";
    case "PLANIFIEE":
    case "AFFECTEE":
      return "orange";
    case "ANNULEE":
      return "rouge";
    default:
      return "gris";
  }
};

const CLES_STATUT: Record<string, string> = {
  EN_ATTENTE: "commun.statutEnAttente",
  APPROUVEE: "commun.statutApprouvee",
  REFUSEE: "commun.statutRefusee",
  PLANIFIEE: "commun.statutPlanifiee",
  AFFECTEE: "commun.statutAffectee",
  EN_COURS: "commun.statutEnCours",
  TERMINEE: "commun.statutTerminee",
  ANNULEE: "commun.statutAnnulee",
  SUSPENDUE: "commun.statutSuspendue",
  ACTIF: "commun.statutActif",
  INACTIF: "commun.statutInactif",
  OUVERT: "commun.statutOuvert",
  TRAITE: "commun.statutTraite",
};

/** Traduit un code de statut technique (ex. "EN_ATTENTE") en libellé lisible dans la langue courante. */
export function useLibelleStatut() {
  const { t } = useTranslation();

  return (statut?: string) => {
    const cle = CLES_STATUT[statut ?? ""];
    return cle ? t(cle) : (statut ?? "").replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());
  };
}

/* ------------------------------------------------------------------ */
/* Filtres et boutons                                                  */
/* ------------------------------------------------------------------ */

export interface OptionFiltre<T extends string> {
  valeur: T;
  libelle: string;
  compteur?: number;
  couleur?: string;
}

export function FilterChips<T extends string>({
  options,
  valeur,
  onChange,
}: {
  options: OptionFiltre<T>[];
  valeur: T;
  onChange: (valeur: T) => void;
}) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {options.map((option) => {
        const actif = option.valeur === valeur;

        return (
          <button
            key={option.valeur}
            type="button"
            onClick={() => onChange(option.valeur)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              actif
                ? "border-emerald-800 bg-emerald-800 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {option.couleur && (
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: option.couleur }} />
            )}
            {option.libelle}
            {option.compteur !== undefined && <span className={actif ? "text-white/80" : "text-slate-400"}>({option.compteur})</span>}
          </button>
        );
      })}
    </div>
  );
}

type PropsBouton = ButtonHTMLAttributes<HTMLButtonElement> & {
  icone?: LucideIcon;
  chargement?: boolean;
  pleineLargeur?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

export function PrimaryButton({
  icone: Icone,
  chargement,
  pleineLargeur,
  children,
  className = "",
  ...rest
}: PropsBouton) {
  return (
    <button
      type="button"
      {...rest}
      disabled={rest.disabled || chargement}
      className={`${base} bg-emerald-800 text-white shadow-sm hover:bg-emerald-900 ${pleineLargeur ? "w-full" : ""} ${className}`}
    >
      {chargement ? <Loader2 size={17} className="animate-spin" /> : Icone && <Icone size={17} />}
      {children}
    </button>
  );
}

export function SecondaryButton({
  icone: Icone,
  chargement,
  pleineLargeur,
  children,
  className = "",
  ...rest
}: PropsBouton) {
  return (
    <button
      type="button"
      {...rest}
      disabled={rest.disabled || chargement}
      className={`${base} bg-indigo-50 text-indigo-700 hover:bg-indigo-100 ${pleineLargeur ? "w-full" : ""} ${className}`}
    >
      {chargement ? <Loader2 size={17} className="animate-spin" /> : Icone && <Icone size={17} />}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* États                                                               */
/* ------------------------------------------------------------------ */

/** Bloc gris pulsé : espace réservé pendant le chargement. */
export function Squelette({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />;
}

/** Écran de chargement en squelette (titre, indicateurs, cartes) au lieu d'un simple spinner. */
export function Chargement({ texte }: { texte?: string }) {
  const { t } = useTranslation();

  return (
    <div role="status" aria-live="polite" className="space-y-5">
      <span className="sr-only">{texte ?? t("commun.chargement")}</span>
      <div className="space-y-2">
        <Squelette className="h-7 w-56 max-w-full" />
        <Squelette className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Squelette key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Squelette key={i} className="h-44 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function BandeauErreur({ message, onReessayer }: { message: string; onReessayer?: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <AlertTriangle size={18} className="mt-0.5 shrink-0" />
      <p className="flex-1">{message}</p>
      {onReessayer && (
        <button type="button" onClick={onReessayer} className="font-bold underline">
          {t("commun.reessayer")}
        </button>
      )}
    </div>
  );
}

export function EtatVide({
  icone: Icone,
  titre,
  description,
}: {
  icone: LucideIcon;
  titre: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icone size={26} />
      </span>
      <p className="mt-4 font-semibold text-slate-800">{titre}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
    </div>
  );
}

/** Date/heure relative dans la langue courante (« il y a 5 min »). */
export function useDateRelative() {
  const { t, langue } = useTranslation();

  return (valeur?: string | null) => {
    if (!valeur) {
      return "—";
    }

    const date = new Date(valeur);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    const secondes = Math.round((Date.now() - date.getTime()) / 1000);

    if (secondes < 60) return t("commun.aLInstant");
    if (secondes < 3600) return t("commun.ilYAMin", { n: Math.round(secondes / 60) });
    if (secondes < 86400) return t("commun.ilYAH", { n: Math.round(secondes / 3600) });

    return new Intl.DateTimeFormat(LOCALE_INTL[langue], { dateStyle: "medium", timeStyle: "short" }).format(date);
  };
}
