import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Boxes,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Settings,
  User,
  X,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import {
  applyAppTheme,
  loadUserAvatar,
  loadUserPreferences,
} from "../utils/userPreferences";

const navigation = [
  {
    label: "Tableau de bord",
    path: "/superviseur",
    icon: LayoutDashboard,
  },
  {
    label: "Superviser les bacs",
    path: "/superviseur/bacs",
    icon: Boxes,
  },
  {
    label: "Alertes",
    path: "/superviseur/alertes",
    icon: AlertTriangle,
  },
  {
    label: "Interventions",
    path: "/superviseur/interventions",
    icon: ClipboardList,
  },
  {
    label: "Localisation",
    path: "/superviseur/localisation",
    icon: Map,
  },
  {
    label: "Historiques",
    path: "/superviseur/historiques",
    icon: History,
  },
  {
    label: "Statistiques",
    path: "/superviseur/statistiques",
    icon: BarChart3,
  },
];

const accountNavigation = [
  {
    label: "Mon profil",
    path: "/superviseur/profil",
    icon: User,
  },
  {
    label: "Paramètres",
    path: "/superviseur/parametres",
    icon: Settings,
  },
];

export default function SuperviseurLayout() {
  const navigate = useNavigate();
  const { utilisateur, clearAuthentication } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const avatar = loadUserAvatar(utilisateur);

  useEffect(() => {
    applyAppTheme(loadUserPreferences(utilisateur).theme);
  }, [utilisateur?.idUtilisateur]);

  const handleLogout = () => {
    clearAuthentication();
    navigate("/login");
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const initials = `${utilisateur?.prenom?.charAt(0) || ""}${utilisateur?.nom?.charAt(0) || ""}`;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f5f7f6]">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[238px] flex-col bg-[#10251b] text-white transition-transform duration-200 md:static md:flex md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
          <button
            type="button"
            onClick={() => navigate("/superviseur")}
            className="flex items-center gap-2.5"
          >
            <img
              src="/images/logo.png"
              alt="SmartCityWaste"
              className="h-8 w-8 rounded-lg object-contain"
            />

            <div className="text-left">
              <div className="text-[13px] font-semibold">
                SmartCityWaste
              </div>

              <div className="text-[9px] text-white/45">
                Supervision
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={closeMobileMenu}
            className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-2 px-2 text-[9px] font-semibold uppercase tracking-wider text-white/35">
            Supervision
          </div>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/superviseur"}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-medium transition ${
                      isActive
                        ? "bg-[#1f7a4d] text-white"
                        : "text-white/60 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  <Icon size={16} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="mb-2 mt-7 px-2 text-[9px] font-semibold uppercase tracking-wider text-white/35">
            Compte
          </div>

          <nav className="space-y-1">
            {accountNavigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-medium transition ${
                      isActive
                        ? "bg-[#1f7a4d] text-white"
                        : "text-white/60 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  <Icon size={16} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="shrink-0 border-t border-white/10 p-3">
          <div className="mb-2 flex items-center gap-2.5 rounded-lg bg-white/5 px-2.5 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2b9a62] text-[10px] font-semibold">
              {avatar ? (
                <img src={avatar} alt="Photo de profil" className="h-full w-full rounded-full object-cover" />
              ) : initials}
            </div>

            <div className="min-w-0">
              <div className="truncate text-[11px] font-semibold">
                {utilisateur?.prenom} {utilisateur?.nom}
              </div>

              <div className="text-[9px] text-white/40">
                Superviseur
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-[12px] text-white/55 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut size={16} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="relative flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
            >
              <Menu size={20} />
            </button>

            <div className="hidden sm:block">
              <div className="text-[13px] font-semibold text-slate-800">
                Espace superviseur
              </div>

              <div className="text-[10px] text-slate-400">
                Supervision des bacs et interventions
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/superviseur/alertes")}
              className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
            >
              <Bell size={18} strokeWidth={1.8} />

              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/superviseur/profil")}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-slate-50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e6f3eb] text-[10px] font-semibold text-[#1f7a4d]">
                {avatar ? (
                  <img src={avatar} alt="Photo de profil" className="h-full w-full rounded-full object-cover" />
                ) : initials}
              </div>

              <div className="hidden text-left md:block">
                <div className="max-w-[130px] truncate text-[11px] font-semibold text-slate-700">
                  {utilisateur?.prenom} {utilisateur?.nom}
                </div>

                <div className="text-[9px] text-slate-400">
                  Superviseur
                </div>
              </div>
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="min-h-full p-3 sm:p-5 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
