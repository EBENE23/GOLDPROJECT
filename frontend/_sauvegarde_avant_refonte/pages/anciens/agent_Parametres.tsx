import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  LockKeyhole,
  LogOut,
  Moon,
  ShieldCheck,
  Sun,
  UserRound,
} from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import {
  getCurrentUser,
  logout,
} from "../../stores/authStore";
import {
  applyAppTheme,
  loadUserPreferences,
  saveUserPreferences,
} from "../../utils/userPreferences";

const Parametres = () => {
  const navigate = useNavigate();
  const utilisateur = getCurrentUser();

  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState<"clair" | "sombre">("clair");
  const [sauvegarde, setSauvegarde] = useState(false);

  useEffect(() => {
    const preferences = loadUserPreferences(utilisateur);
    setNotifications(preferences.notifications);
    setTheme(preferences.theme);
    applyAppTheme(preferences.theme);
  }, [utilisateur?.idUtilisateur]);

  const sauvegarderPreferences = () => {
    setSauvegarde(true);

    saveUserPreferences(utilisateur, {
      notifications,
      alertesCritiques: true,
      theme,
    });
    applyAppTheme(theme);

    toast.success("Préférences enregistrées.", {
      autoClose: 2500,
    });

    window.setTimeout(() => {
      setSauvegarde(false);
    }, 1000);
  };

  const handleLogout = () => {
    logout();

    toast.success("Déconnexion réussie.", {
      autoClose: 2500,
    });

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Paramètres
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Gérez les préférences de votre espace agent.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-gray-100 p-5 sm:p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
                <UserRound size={20} />
              </div>

              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900">
                  Compte
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Informations de votre compte agent.
                </p>
              </div>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Nom complet
                </p>

                <p className="mt-1 truncate font-medium text-gray-800">
                  {utilisateur
                    ? `${utilisateur.prenom} ${utilisateur.nom}`
                    : "Agent"}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Adresse e-mail
                </p>

                <p className="mt-1 break-all font-medium text-gray-800">
                  {utilisateur?.email || "Non renseignée"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Rôle
                </p>

                <p className="mt-1 font-medium text-gray-800">
                  Agent de collecte
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Statut du compte
                </p>

                <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                  Actif
                </span>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-gray-100 p-5 sm:p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Bell size={20} />
              </div>

              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900">
                  Notifications
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Gérez les alertes liées à votre activité.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="min-w-0">
                <p className="font-medium text-gray-800">
                  Notifications activées
                </p>

                <p className="mt-1 text-sm leading-5 text-gray-500">
                  Recevoir les informations et alertes liées
                  aux missions de collecte.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={notifications}
                aria-label="Activer ou désactiver les notifications"
                onClick={() =>
                  setNotifications((value) => !value)
                }
                className={[
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                  notifications
                    ? "bg-green-600"
                    : "bg-gray-300",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    notifications
                      ? "translate-x-5"
                      : "translate-x-0",
                  ].join(" ")}
                />
              </button>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-gray-100 p-5 sm:p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                {theme === "clair" ? (
                  <Sun size={20} />
                ) : (
                  <Moon size={20} />
                )}
              </div>

              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900">
                  Apparence
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Choisissez l'apparence de votre espace.
                </p>
              </div>
            </div>

            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              <button
                type="button"
                onClick={() => setTheme("clair")}
                className={[
                  "flex items-center gap-3 rounded-xl border p-4 text-left transition",
                  theme === "clair"
                    ? "border-green-600 bg-green-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                ].join(" ")}
              >
                <Sun
                  size={20}
                  className={
                    theme === "clair"
                      ? "text-green-700"
                      : "text-gray-500"
                  }
                />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800">
                    Clair
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Apparence claire
                  </p>
                </div>

                {theme === "clair" && (
                  <Check
                    size={18}
                    className="shrink-0 text-green-700"
                  />
                )}
              </button>

              <button
                type="button"
                onClick={() => setTheme("sombre")}
                className={[
                  "flex items-center gap-3 rounded-xl border p-4 text-left transition",
                  theme === "sombre"
                    ? "border-green-600 bg-green-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                ].join(" ")}
              >
                <Moon
                  size={20}
                  className={
                    theme === "sombre"
                      ? "text-green-700"
                      : "text-gray-500"
                  }
                />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800">
                    Sombre
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Apparence sombre
                  </p>
                </div>

                {theme === "sombre" && (
                  <Check
                    size={18}
                    className="shrink-0 text-green-700"
                  />
                )}
              </button>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-gray-100 p-5 sm:p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                <LockKeyhole size={20} />
              </div>

              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900">
                  Sécurité
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Gérez les éléments liés à la sécurité de votre compte.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800">
                    Mot de passe
                  </p>

                  <p className="mt-1 text-sm leading-5 text-gray-500">
                    La modification du mot de passe est accessible depuis votre profil.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/agent/profil")
                  }
                  className="shrink-0 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Mon profil
                </button>
              </div>
            </div>
          </section>

          <button
            type="button"
            onClick={sauvegarderPreferences}
            disabled={sauvegarde}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sauvegarde ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Enregistrement...
              </>
            ) : (
              <>
                <Check size={18} />
                Enregistrer les préférences
              </>
            )}
          </button>
        </div>

        <div className="h-fit space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <ShieldCheck size={22} />
            </div>

            <h2 className="mt-4 font-semibold text-gray-900">
              Compte sécurisé
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Votre espace agent est protégé par une authentification sécurisée.
            </p>
          </section>

          <section className="rounded-2xl border border-red-100 bg-red-50 p-5">
            <h2 className="font-semibold text-red-900">
              Session
            </h2>

            <p className="mt-2 text-sm leading-6 text-red-700">
              Déconnectez-vous lorsque vous avez terminé votre utilisation de la plateforme.
            </p>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              <LogOut size={17} />
              Déconnexion
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Parametres;