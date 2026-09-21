// frontend/src/pages/admin/Parametres.tsx

import { useEffect, useState } from "react";
import {
  Bell,
  Database,
  Globe,
  LockKeyhole,
  Moon,
  Save,
  Settings,
  ShieldCheck,
  Sun,
  Wifi,
} from "lucide-react";
import { getCurrentUser } from "../../stores/authStore";
import {
  applyAppTheme,
  loadUserPreferences,
  saveUserPreferences,
  type AppTheme,
} from "../../utils/userPreferences";
import AvatarPicker from "../../components/AvatarPicker";
import { loadUserAvatar, saveUserAvatar } from "../../utils/userPreferences";

export default function Parametres() {
  const user = getCurrentUser();
  const [notifications, setNotifications] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [language, setLanguage] = useState("fr");
  const [theme, setTheme] = useState<AppTheme>("clair");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const preferences = loadUserPreferences(user);
    setNotifications(preferences.notifications);
    setCriticalAlerts(preferences.alertesCritiques);
    setTheme(preferences.theme);
    setAvatar(loadUserAvatar(user));
    setLanguage(localStorage.getItem(`smartcitywaste_language_${user?.idUtilisateur || "guest"}`) || "fr");
    applyAppTheme(preferences.theme);
  }, [user?.idUtilisateur]);

  const saveSettings = () => {
    saveUserPreferences(user, {
      notifications,
      alertesCritiques: criticalAlerts,
      theme,
    });
    localStorage.setItem(`smartcitywaste_language_${user?.idUtilisateur || "guest"}`, language);
    saveUserAvatar(user, avatar);
    applyAppTheme(theme);

    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  return (
    <div className="min-h-full bg-[#f7f9f8] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
            <Settings size={16} />
            Administration
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Paramètres
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Configuration générale de l'expérience d'administration.
          </p>
        </div>

        {saved && (
          <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            Les préférences ont été enregistrées.
          </div>
        )}

        <div className="space-y-5">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <AvatarPicker
              name={`${user?.prenom || ""} ${user?.nom || "Administrateur"}`}
              value={avatar}
              onChange={setAvatar}
            />
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Bell size={18} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">
                  Notifications
                </h2>
                <p className="text-xs text-slate-500">
                  Préférences relatives aux alertes administratives.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between gap-4 px-5 py-5">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Notifications administratives
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Afficher les nouvelles demandes d'inscription.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setNotifications(!notifications)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    notifications ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                      notifications ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 px-5 py-5">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Alertes critiques
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Mettre en évidence les situations nécessitant une action.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCriticalAlerts(!criticalAlerts)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    criticalAlerts ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                      criticalAlerts ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Globe size={18} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">
                  Préférences générales
                </h2>
                <p className="text-xs text-slate-500">
                  Paramètres d'affichage de la plateforme.
                </p>
              </div>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Langue de l'interface
                </label>
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 sm:max-w-sm"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Thème de l'application</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["clair", "sombre"] as AppTheme[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => { setTheme(option); applyAppTheme(option); }}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left ${theme === option ? "border-emerald-500 bg-emerald-50" : "border-slate-200"}`}
                    >
                      {option === "clair" ? <Sun size={18} /> : <Moon size={18} />}
                      <span className="text-sm font-semibold capitalize">{option}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">
                  Sécurité
                </h2>
                <p className="text-xs text-slate-500">
                  Informations relatives à la protection de la plateforme.
                </p>
              </div>
            </div>

            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <LockKeyhole size={17} className="text-emerald-600" />
                  <p className="text-sm font-bold text-slate-800">
                    Authentification
                  </p>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Accès protégé par authentification JWT.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <Wifi size={17} className="text-blue-600" />
                  <p className="text-sm font-bold text-slate-800">
                    Communication
                  </p>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Transmission IoT prévue via MQTT.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <Database size={17} className="text-violet-600" />
                  <p className="text-sm font-bold text-slate-800">
                    Base de données
                  </p>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Stockage relationnel MySQL via Sequelize.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <Settings size={17} className="text-orange-600" />
                  <p className="text-sm font-bold text-slate-800">
                    Environnement
                  </p>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Configuration applicative gérée côté serveur.
                </p>
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={saveSettings}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
            >
              <Save size={17} />
              Enregistrer les préférences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}