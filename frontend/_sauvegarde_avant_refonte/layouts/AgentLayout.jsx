import { useEffect, useState } from "react";
import {
  Bell,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore, logout } from "../stores/authStore";
import { listerNotificationsAgent } from "../services/notificationService";
import {
  applyAppTheme,
  loadUserAvatar,
  loadUserPreferences,
} from "../utils/userPreferences";

const AgentLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsNonLues, setNotificationsNonLues] = useState(0);

  const user = useAuthStore((state) => state.utilisateur);
  const avatar = loadUserAvatar(user);

  useEffect(() => {
    applyAppTheme(loadUserPreferences(user).theme);
  }, [user?.idUtilisateur]);

  useEffect(() => {
    let actif = true;

    const chargerCompteurNotifications = async () => {
      try {
        if (!loadUserPreferences(user).notifications) {
          if (actif) {
            setNotificationsNonLues(0);
          }
          return;
        }

        const resultat = await listerNotificationsAgent();

        if (actif) {
          setNotificationsNonLues(resultat.nonLues);
        }
      } catch (error) {
        console.error(
          "Erreur compteur notifications agent :",
          error
        );
      }
    };

    chargerCompteurNotifications();

    const interval = window.setInterval(
      chargerCompteurNotifications,
      30000
    );

    return () => {
      actif = false;
      window.clearInterval(interval);
    };
  }, []);

  const navigation = [
    {
      label: "Tableau de bord",
      path: "/agent",
      icon: LayoutDashboard,
    },
    {
      label: "Mes missions",
      path: "/agent/missions",
      icon: ClipboardList,
    },
    {
      label: "Localisation",
      path: "/agent/localisation",
      icon: MapPin,
    },
    {
      label: "Mon profil",
      path: "/agent/profil",
      icon: UserRound,
    },
    {
      label: "Paramètres",
      path: "/agent/parametres",
      icon: Settings,
    },
  ];

  const getPageTitle = () => {
    if (location.pathname === "/agent") {
      return "Tableau de bord";
    }

    if (location.pathname.startsWith("/agent/missions/")) {
      return "Détails de la mission";
    }

    if (location.pathname === "/agent/missions") {
      return "Mes missions";
    }

    if (location.pathname === "/agent/localisation") {
      return "Localisation";
    }

    if (location.pathname === "/agent/historique") {
      return "Historique";
    }

    if (location.pathname === "/agent/signalements") {
      return "Signalements";
    }

    if (location.pathname === "/agent/profil") {
      return "Mon profil";
    }

    if (location.pathname === "/agent/parametres") {
      return "Paramètres";
    }

    if (location.pathname === "/agent/notifications") {
      return "Notifications";
    }

    return "Espace agent";
  };

  const fermerMenuMobile = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const nomComplet =
    user?.prenom && user?.nom
      ? `${user.prenom} ${user.nom}`
      : user?.nom || user?.prenom || "Agent";

  const initiales =
    `${user?.prenom?.charAt(0) || ""}${user?.nom?.charAt(0) || ""}`.toUpperCase() ||
    "AG";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-white transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center border-b border-slate-800 px-5">
          <Link
            to="/agent"
            onClick={fermerMenuMobile}
            className="flex min-w-0 items-center gap-3"
          >
            <img
              src="/images/logo.png"
              alt="SmartCityWaste"
              className="h-10 w-10 shrink-0 rounded-xl object-contain"
            />

            <div className="min-w-0">
              <p className="truncate text-base font-bold tracking-tight text-white">
                SmartCityWaste
              </p>

              <p className="text-xs font-medium text-slate-400">
                Espace agent
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={fermerMenuMobile}
            className="ml-auto rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-6">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Navigation
          </p>

          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/agent"}
                  onClick={fermerMenuMobile}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-emerald-500/15 text-emerald-400 shadow-sm"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-emerald-500" />
                      )}

                      <Icon
                        size={19}
                        strokeWidth={isActive ? 2.4 : 2}
                        className={`shrink-0 transition ${
                          isActive
                            ? "text-emerald-400"
                            : "text-slate-400 group-hover:text-white"
                        }`}
                      />

                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-800 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-slate-800/80 px-3 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
              {avatar ? (
                <img src={avatar} alt="Photo de profil" className="h-full w-full rounded-full object-cover" />
              ) : initiales}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {nomComplet}
              </p>

              <p className="truncate text-xs text-slate-400">
                Agent de collecte
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={19} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={fermerMenuMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
        />
      )}

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
          <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-4">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 lg:hidden"
                aria-label="Ouvrir le menu"
              >
                <Menu size={22} />
              </button>

              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                  {getPageTitle()}
                </h1>

                <p className="hidden text-xs text-slate-500 sm:block">
                  Gestion et suivi des opérations de collecte
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              <Link
                to="/agent/notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Notifications"
              >
                <Bell size={21} strokeWidth={2} />

                {notificationsNonLues > 0 && (
                  <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {notificationsNonLues > 99
                      ? "99+"
                      : notificationsNonLues}
                  </span>
                )}
              </Link>

              <div className="h-8 w-px bg-slate-200" />

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((value) => !value)}
                  className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-100"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                    {avatar ? (
                      <img src={avatar} alt="Photo de profil" className="h-full w-full rounded-full object-cover" />
                    ) : initiales}
                  </div>

                  <div className="hidden min-w-0 text-left sm:block">
                    <p className="max-w-36 truncate text-sm font-semibold text-slate-800">
                      {nomComplet}
                    </p>

                    <p className="text-xs text-slate-500">
                      Agent de collecte
                    </p>
                  </div>

                  <ChevronDown
                    size={16}
                    className={`hidden text-slate-500 transition sm:block ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {userMenuOpen && (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setUserMenuOpen(false)}
                      aria-label="Fermer le menu utilisateur"
                    />

                    <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                      <div className="mb-1 border-b border-slate-100 px-3 py-3">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {nomComplet}
                        </p>

                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {user?.email || "Compte agent"}
                        </p>
                      </div>

                      <Link
                        to="/agent/profil"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        <UserRound size={18} />
                        Mon profil
                      </Link>

                      <Link
                        to="/agent/parametres"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        <Settings size={18} />
                        Paramètres
                      </Link>

                      <div className="my-2 border-t border-slate-100" />

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                      >
                        <LogOut size={18} />
                        Déconnexion
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-5rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AgentLayout;