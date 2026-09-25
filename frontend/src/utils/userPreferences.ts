import type { AuthUser } from "../stores/authStore";

export type AppTheme = "clair" | "sombre";
export type AppAccent = "emeraude" | "bleu" | "violet" | "orange";
export type AppTailleTexte = "petite" | "normale" | "grande";
export type AppLangue = "fr" | "en" | "it" | "es";

export const ACCENTS: AppAccent[] = ["emeraude", "bleu", "violet", "orange"];
export const TAILLES_TEXTE: AppTailleTexte[] = ["petite", "normale", "grande"];
export const LANGUES: AppLangue[] = ["fr", "en", "it", "es"];

// Taille de police appliquée à la racine (html). Comme toutes les tailles
// Tailwind sont en rem, changer cette valeur redimensionne tout le texte de
// l'application dans les mêmes proportions.
export const TAILLE_TEXTE_PX: Record<AppTailleTexte, number> = {
  petite: 13,
  normale: 14,
  grande: 16,
};

export interface UserPreferences {
  notifications: boolean;
  alertesCritiques: boolean;
  theme: AppTheme;
  accent: AppAccent;
  tailleTexte: AppTailleTexte;
  langue: AppLangue;
}

const defaultPreferences: UserPreferences = {
  notifications: true,
  alertesCritiques: true,
  theme: "clair",
  accent: "emeraude",
  tailleTexte: "normale",
  langue: "fr",
};

const CLE_APPARENCE = "smartcitywaste_apparence";

const getStorageKey = (user: Pick<AuthUser, "idUtilisateur"> | null) =>
  `smartcitywaste_preferences_${user?.idUtilisateur || "guest"}`;

export const loadUserPreferences = (
  user: Pick<AuthUser, "idUtilisateur"> | null
): UserPreferences => {
  try {
    const stored = localStorage.getItem(getStorageKey(user));
    const parsed = stored ? JSON.parse(stored) : {};

    return {
      notifications:
        typeof parsed.notifications === "boolean"
          ? parsed.notifications
          : defaultPreferences.notifications,
      alertesCritiques:
        typeof parsed.alertesCritiques === "boolean"
          ? parsed.alertesCritiques
          : defaultPreferences.alertesCritiques,
      theme: parsed.theme === "sombre" ? "sombre" : "clair",
      accent: ACCENTS.includes(parsed.accent) ? parsed.accent : "emeraude",
      tailleTexte: TAILLES_TEXTE.includes(parsed.tailleTexte) ? parsed.tailleTexte : "normale",
      langue: LANGUES.includes(parsed.langue) ? parsed.langue : "fr",
    };
  } catch {
    return { ...defaultPreferences };
  }
};

export const saveUserPreferences = (
  user: Pick<AuthUser, "idUtilisateur"> | null,
  preferences: UserPreferences
) => {
  localStorage.setItem(getStorageKey(user), JSON.stringify(preferences));
  // Dernières apparence/langue utilisées : appliquées dès l'ouverture, y compris sur la page de connexion.
  localStorage.setItem(
    CLE_APPARENCE,
    JSON.stringify({
      theme: preferences.theme,
      accent: preferences.accent,
      tailleTexte: preferences.tailleTexte,
      langue: preferences.langue,
    })
  );
};

export const applyAppearance = (
  theme: AppTheme,
  accent: AppAccent = "emeraude",
  tailleTexte: AppTailleTexte = "normale"
) => {
  const racine = document.documentElement;
  racine.dataset.theme = theme === "sombre" ? "dark" : "light";
  racine.dataset.accent = accent;
  racine.style.colorScheme = theme === "sombre" ? "dark" : "light";
  racine.style.fontSize = `${TAILLE_TEXTE_PX[tailleTexte]}px`;
};

/** Applique l'apparence mémorisée avant l'affichage, pour éviter un flash de couleurs. */
export const applyStoredAppearance = () => {
  try {
    const memorise = JSON.parse(localStorage.getItem(CLE_APPARENCE) || "{}");
    applyAppearance(
      memorise.theme === "sombre" ? "sombre" : "clair",
      ACCENTS.includes(memorise.accent) ? memorise.accent : "emeraude",
      TAILLES_TEXTE.includes(memorise.tailleTexte) ? memorise.tailleTexte : "normale"
    );
  } catch {
    applyAppearance("clair", "emeraude", "normale");
  }
};

/** Langue mémorisée (lue avant même la connexion, pour que Login/Register en profitent). */
export const loadStoredLangue = (): AppLangue => {
  try {
    const memorise = JSON.parse(localStorage.getItem(CLE_APPARENCE) || "{}");
    return LANGUES.includes(memorise.langue) ? memorise.langue : "fr";
  } catch {
    return "fr";
  }
};

export const getUserAvatarKey = (user: Pick<AuthUser, "idUtilisateur"> | null) =>
  `smartcitywaste_avatar_${user?.idUtilisateur || "guest"}`;

export const loadUserAvatar = (
  user: Pick<AuthUser, "idUtilisateur"> | null
) => localStorage.getItem(getUserAvatarKey(user));

export const saveUserAvatar = (
  user: Pick<AuthUser, "idUtilisateur"> | null,
  avatar: string | null
) => {
  const key = getUserAvatarKey(user);

  if (avatar) {
    localStorage.setItem(key, avatar);
  } else {
    localStorage.removeItem(key);
  }
};
