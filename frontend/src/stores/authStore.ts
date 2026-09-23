import { create } from "zustand";

export type UserRole =
  | "ADMINISTRATEUR"
  | "SUPERVISEUR"
  | "AGENT_COLLECTE";

export interface AuthUser {
  idUtilisateur: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string | null;
  photoProfil?: string | null;
  statutCompte: string;
  role: UserRole;
  dateCreation?: string;
}

// La photo (image encodée) reste en mémoire : elle est rechargée depuis l'API à chaque ouverture.
const sansPhoto = ({ photoProfil: _photo, ...reste }: AuthUser) => reste;

export const memoriserUtilisateur = (utilisateur: AuthUser) => {
  try {
    localStorage.setItem("smartcitywaste_user", JSON.stringify(sansPhoto(utilisateur)));
  } catch {
    /* stockage plein ou indisponible : la session reste valable en mémoire */
  }
};

const normalizeRole = (role: string): UserRole | null => {
  const normalized = String(role || "").toUpperCase();
  if (normalized === "ADMIN" || normalized === "ADMINISTRATOR") {
    return "ADMINISTRATEUR";
  }
  if (
    normalized === "ADMINISTRATEUR" ||
    normalized === "SUPERVISEUR" ||
    normalized === "AGENT_COLLECTE"
  ) {
    return normalized;
  }
  return null;
};

interface AuthState {
  token: string | null;
  utilisateur: AuthUser | null;
  isAuthenticated: boolean;

  setAuthentication: (
    token: string,
    utilisateur: AuthUser
  ) => void;

  clearAuthentication: () => void;
}

const getStoredUser = (): AuthUser | null => {
  const storedUser = localStorage.getItem(
    "smartcitywaste_user"
  );

  if (!storedUser) {
    return null;
  }

  try {
    const user = JSON.parse(storedUser) as AuthUser;
    const role = normalizeRole(user.role);
    return role ? { ...user, role } : null;
  } catch {
    localStorage.removeItem("smartcitywaste_user");
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("smartcitywaste_token"),

  utilisateur: getStoredUser(),

  isAuthenticated:
    !!localStorage.getItem("smartcitywaste_token"),

  setAuthentication: (token, utilisateur) => {
    localStorage.setItem(
      "smartcitywaste_token",
      token
    );

    memoriserUtilisateur(utilisateur);

    set({
      token,
      utilisateur,
      isAuthenticated: true,
    });
  },

  clearAuthentication: () => {
    localStorage.removeItem("smartcitywaste_token");
    localStorage.removeItem("smartcitywaste_user");

    set({
      token: null,
      utilisateur: null,
      isAuthenticated: false,
    });
  },
}));

export const saveAuthentication = (
  token: string,
  utilisateur: AuthUser
): void => {
  const role = normalizeRole(utilisateur.role);
  if (!role) {
    throw new Error("Rôle utilisateur invalide.");
  }
  const utilisateurNormalise = { ...utilisateur, role };

  localStorage.setItem(
    "smartcitywaste_token",
    token
  );

  memoriserUtilisateur(utilisateurNormalise);

  useAuthStore.setState({
    token,
    utilisateur: utilisateurNormalise,
    isAuthenticated: true,
  });
};

export const getCurrentUser = (): AuthUser | null => {
  return useAuthStore.getState().utilisateur;
};

export const getToken = (): string | null => {
  return useAuthStore.getState().token;
};

export const logout = (): void => {
  localStorage.removeItem("smartcitywaste_token");
  localStorage.removeItem("smartcitywaste_user");

  useAuthStore.setState({
    token: null,
    utilisateur: null,
    isAuthenticated: false,
  });
};