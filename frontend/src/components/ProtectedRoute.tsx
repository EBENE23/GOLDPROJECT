import { Navigate, Outlet, useLocation } from "react-router-dom";
import {
  getCurrentUser,
  useAuthStore,
  type UserRole,
} from "../stores/authStore";

interface ProtectedRouteProps {
  roles?: UserRole[];
}

export default function ProtectedRoute({
  roles,
}: ProtectedRouteProps) {
  const location = useLocation();

  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );

  const utilisateur = getCurrentUser();

  if (!isAuthenticated || !utilisateur) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  const roleUtilisateur = utilisateur.role;

  if (
    roles &&
    roles.length > 0 &&
    !roles.includes(roleUtilisateur)
  ) {
    switch (roleUtilisateur) {
      case "ADMINISTRATEUR":
        return <Navigate to="/admin" replace />;

      case "SUPERVISEUR":
        return <Navigate to="/superviseur" replace />;

      case "AGENT_COLLECTE":
        return <Navigate to="/agent" replace />;

      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
}