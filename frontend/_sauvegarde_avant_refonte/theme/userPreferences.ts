import type { AuthUser } from "../stores/authStore";

export type AppTheme = "clair" | "sombre";

export interface UserPreferences {
  notifications: boolean;
  alertesCritiques: boolean;
  theme: AppTheme;
}

const defaultPreferences: UserPreferences = {
  notifications: true,
  alertesCritiques: true,
  theme: "clair",
};

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
};

export const applyAppTheme = (theme: AppTheme) => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme === "sombre" ? "dark" : "light";
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
