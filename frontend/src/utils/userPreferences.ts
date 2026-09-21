import type { AuthUser } from "../stores/authStore";

export type AppTheme = "clair" | "sombre";
export type AppAccent = "emeraude" | "bleu" | "violet" | "orange";

export const ACCENTS: AppAccent[] = ["emeraude", "bleu", "violet", "orange"];

export interface UserPreferences {
  notifications: boolean;
  alertesCritiques: boolean;
  theme: AppTheme;
  accent: AppAccent;
}

const defaultPreferences: UserPreferences = {
  notifications: true,
  alertesCritiques: true,
  theme: "clair",
  accent: "emeraude",
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
  // Dernière apparence utilisée : appliquée dès l'ouverture, y compris sur la page de connexion.
  localStorage.setItem(CLE_APPARENCE, JSON.stringify({ theme: preferences.theme, accent: preferences.accent }));
};

export const applyAppearance = (theme: AppTheme, accent: AppAccent = "emeraude") => {
  const racine = document.documentElement;
  racine.dataset.theme = theme === "sombre" ? "dark" : "light";
  racine.dataset.accent = accent;
  racine.style.colorScheme = theme === "sombre" ? "dark" : "light";
};

/** Applique l'apparence mémorisée avant l'affichage, pour éviter un flash de couleurs. */
export const applyStoredAppearance = () => {
  try {
    const memorise = JSON.parse(localStorage.getItem(CLE_APPARENCE) || "{}");
    applyAppearance(
      memorise.theme === "sombre" ? "sombre" : "clair",
      ACCENTS.includes(memorise.accent) ? memorise.accent : "emeraude"
    );
  } catch {
    applyAppearance("clair", "emeraude");
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
