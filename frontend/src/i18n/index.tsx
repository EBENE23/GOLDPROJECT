import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import fr, { type Dictionnaire } from "./fr";
import en from "./en";
import it from "./it";
import es from "./es";
import { getCurrentUser } from "../stores/authStore";
import {
  loadStoredLangue,
  loadUserPreferences,
  saveUserPreferences,
  type AppLangue,
} from "../utils/userPreferences";

const DICTIONNAIRES: Record<AppLangue, Dictionnaire> = { fr, en, it, es };

/** Nom affiché de chaque langue, dans sa propre langue (comme le fait tout sélecteur de langue). */
export const LANGUES_INFO: { code: AppLangue; nom: string; drapeau: string }[] = [
  { code: "fr", nom: "Français", drapeau: "/images/drapeaux/fr.svg" },
  { code: "en", nom: "English", drapeau: "/images/drapeaux/en.svg" },
  { code: "it", nom: "Italiano", drapeau: "/images/drapeaux/it.svg" },
  { code: "es", nom: "Español", drapeau: "/images/drapeaux/es.svg" },
];

/** Code de locale Intl (dates, nombres) correspondant à chaque langue de l'application. */
export const LOCALE_INTL: Record<AppLangue, string> = {
  fr: "fr-FR",
  en: "en-GB",
  it: "it-IT",
  es: "es-ES",
};

// Résout un chemin en pointillés ("home.hero.titre1") dans le dictionnaire imbriqué.
function resoudre(dico: unknown, chemin: string): unknown {
  return chemin
    .split(".")
    .reduce<unknown>(
      (acc, cle) =>
        acc && typeof acc === "object" ? (acc as Record<string, unknown>)[cle] : undefined,
      dico
    );
}

interface I18nContextValue {
  langue: AppLangue;
  setLangue: (langue: AppLangue) => void;
  t: (chemin: string, variables?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/** Fournit la traduction à toute l'application. Enveloppe le routeur dans App.tsx. */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [langue, setLangueState] = useState<AppLangue>(() => {
    const utilisateur = getCurrentUser();
    return utilisateur ? loadUserPreferences(utilisateur).langue : loadStoredLangue();
  });

  useEffect(() => {
    document.documentElement.lang = langue;
  }, [langue]);

  const setLangue = (nouvelleLangue: AppLangue) => {
    setLangueState(nouvelleLangue);

    // Mémorisée comme les autres préférences (sous l'utilisateur connecté, ou
    // en tant qu'invité sur les pages publiques et de connexion).
    const utilisateur = getCurrentUser();
    const actuelles = loadUserPreferences(utilisateur);
    saveUserPreferences(utilisateur, { ...actuelles, langue: nouvelleLangue });
  };

  const t = useMemo(() => {
    const dico = DICTIONNAIRES[langue] || fr;

    return (chemin: string, variables?: Record<string, string | number>) => {
      const valeur = resoudre(dico, chemin);
      let texte =
        typeof valeur === "string" ? valeur : ((resoudre(fr, chemin) as string) ?? chemin);

      if (variables) {
        for (const [cle, val] of Object.entries(variables)) {
          texte = texte.replace(new RegExp(`\\{${cle}\\}`, "g"), String(val));
        }
      }

      return texte;
    };
  }, [langue]);

  const value = useMemo(() => ({ langue, setLangue, t }), [langue, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Accès à `t()` (traduction) et à la langue courante, depuis n'importe quel composant. */
export function useTranslation() {
  const contexte = useContext(I18nContext);

  if (!contexte) {
    throw new Error("useTranslation() doit être appelé à l'intérieur de <I18nProvider>.");
  }

  return contexte;
}

/** Raccourci quand on n'a besoin que de la langue courante et du sélecteur. */
export function useLangue() {
  const { langue, setLangue } = useTranslation();
  return { langue, setLangue };
}
