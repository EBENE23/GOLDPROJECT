import { useEffect, useState } from "react";
import {
  Bell,
  Lock,
  LogOut,
  Moon,
  ShieldCheck,
  Settings,
  Sun,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import {
  applyAppTheme,
  loadUserPreferences,
  saveUserPreferences,
} from "../../utils/userPreferences";

const Parametres = () => {
  const navigate = useNavigate();
  const utilisateur = useAuthStore((state) => state.utilisateur);
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState("clair");

  useEffect(() => {
    const preferences = loadUserPreferences(utilisateur);
    setNotifications(preferences.notifications);
    setTheme(preferences.theme);
    applyAppTheme(preferences.theme);
  }, [utilisateur?.idUtilisateur]);

  const sauvegarder = () => {
    saveUserPreferences(utilisateur, {
      notifications,
      alertesCritiques: true,
      theme,
    });
    applyAppTheme(theme);
  };

  const deconnecter = () => {
    useAuthStore.getState().clearAuthentication();
    navigate("/login", { replace: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Paramètres
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Préférences de votre espace superviseur.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-green-50 p-3">
              <Bell
                size={21}
                className="text-green-700"
              />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Notifications
              </h2>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Les alertes de remplissage sont consultables depuis l'espace Alertes.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Surveillance automatique
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Actualisation périodique des données.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={notifications}
                onClick={() => setNotifications((value) => !value)}
                className={`relative h-6 w-11 rounded-full ${notifications ? "bg-green-600" : "bg-gray-300"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${notifications ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-purple-50 p-3">
              {theme === "clair" ? <Sun size={21} className="text-purple-700" /> : <Moon size={21} className="text-purple-700" />}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-gray-900">Apparence</h2>
              <p className="mt-1 text-sm leading-6 text-gray-500">Adaptez l'affichage à vos conditions de travail.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  ["clair", "Clair", Sun],
                  ["sombre", "Sombre", Moon],
                ].map(([value, label, Icon]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setTheme(value); applyAppTheme(value); }}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left ${theme === value ? "border-green-600 bg-green-50" : "border-gray-200"}`}
                  >
                    <Icon size={18} />
                    <span className="text-sm font-semibold text-gray-800">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-blue-50 p-3">
              <Lock
                size={21}
                className="text-blue-700"
              />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Sécurité
              </h2>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Votre compte est protégé par une authentification avec jeton JWT.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck
                size={20}
                className="text-green-600"
              />

              <div>
                <p className="text-sm font-medium text-gray-800">
                  Authentification active
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Les ressources superviseur nécessitent une authentification.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-gray-100 p-3">
              <Settings
                size={21}
                className="text-gray-700"
              />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Fonctionnement de la supervision
              </h2>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Les informations affichées dans cet espace proviennent des données enregistrées par le système SmartCityWaste.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase text-gray-400">
                Données
              </p>

              <p className="mt-2 text-sm font-medium text-gray-800">
                Mesures des bacs
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase text-gray-400">
                Surveillance
              </p>

              <p className="mt-2 text-sm font-medium text-gray-800">
                États et alertes
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase text-gray-400">
                Intervention
              </p>

              <p className="mt-2 text-sm font-medium text-gray-800">
                Suivi des collectes
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={sauvegarder} className="inline-flex items-center justify-center rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800">
          Enregistrer les préférences
        </button>
        <button type="button" onClick={deconnecter} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-50">
          <LogOut size={17} />
          Déconnexion
        </button>
      </div>
    </div>
  );
};

export default Parametres;