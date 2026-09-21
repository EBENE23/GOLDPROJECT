import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  ClipboardList,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UserRound,
  Users,
  X,
  MapPinned,
  Trash2,
  CheckCircle2,
  Clock3,
  ShieldCheck,
} from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import api from "../services/api";
import { logout, useAuthStore } from "../stores/authStore";
import {
  applyAppTheme,
  loadUserAvatar,
  loadUserPreferences,
} from "../utils/userPreferences";

interface Demande {
  idDemande: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string | null;
  roleDemande: "SUPERVISEUR" | "AGENT_COLLECTE";
  statut: "EN_ATTENTE" | "APPROUVEE" | "REFUSEE";
  dateDemande: string;
}

const navigation = [
  {
    label: "Vue d'ensemble",
    path: "/admin",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Utilisateurs",
    path: "/admin/utilisateurs",
    icon: Users,
  },
  {
    label: "Demandes",
    path: "/admin/demandes",
    icon: ClipboardList,
  },
  {
    label: "Zones",
    path: "/admin/zones",
    icon: MapPinned,
  },
  {
    label: "Bacs à déchets",
    path: "/admin/bacs",
    icon: Trash2,
  },
  {
    label: "Interventions",
    path: "/admin/interventions",
    icon: CheckCircle2,
  },
  {
    label: "Rapports",
    path: "/admin/rapports",
    icon: FileBarChart,
  },
  {
    label: "Paramètres",
    path: "/admin/parametres",
    icon: Settings,
  },
];

function getRoleLabel(role: Demande["roleDemande"]) {
  return role === "SUPERVISEUR"
    ? "Superviseur"
    : "Agent de collecte";
}

function formatRelativeDate(date: string) {
  const created = new Date(date);
  const now = new Date();

  const diff = now.getTime() - created.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours} h`;
  if (days < 7) return `Il y a ${days} j`;

  return created.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function NotificationPanel({
  demandes,
  onClose,
}: {
  demandes: Demande[];
  onClose: () => void;
}) {
  const navigate = useNavigate();

  const handleOpenDemande = (id: number) => {
    onClose();
    navigate(`/admin/demandes?id=${id}`);
  };

  return (
    <div className="absolute right-0 top-14 z-50 w-[360px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Notifications
          </h3>

          <p className="mt-0.5 text-xs text-slate-500">
            Demandes d'inscription en attente
          </p>
        </div>

        <div className="flex h-8 min-w-8 items-center justify-center rounded-full bg-orange-50 px-2 text-xs font-bold text-orange-600">
          {demandes.length}
        </div>
      </div>

      {demandes.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Bell className="h-5 w-5 text-slate-400" />
          </div>

          <p className="mt-3 text-sm font-semibold text-slate-700">
            Aucune nouvelle demande
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Toutes les demandes ont été traitées.
          </p>
        </div>
      ) : (
        <>
          <div className="max-h-[380px] overflow-y-auto">
            {demandes.slice(0, 5).map((demande) => (
              <button
                key={demande.idDemande}
                type="button"
                onClick={() =>
                  handleOpenDemande(demande.idDemande)
                }
                className="flex w-full gap-3 border-b border-slate-100 px-5 py-4 text-left transition hover:bg-slate-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                  <UserRound className="h-5 w-5 text-emerald-700" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {demande.prenom} {demande.nom}
                    </p>

                    <span className="shrink-0 text-[10px] text-slate-400">
                      {formatRelativeDate(
                        demande.dateDemande
                      )}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Nouvelle demande de{" "}
                    <span className="font-semibold text-slate-700">
                      {getRoleLabel(
                        demande.roleDemande
                      )}
                    </span>
                  </p>

                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2 py-1 text-[10px] font-semibold text-orange-600">
                    <Clock3 className="h-3 w-3" />
                    En attente
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-slate-100 p-3">
            <Link
              to="/admin/demandes"
              onClick={onClose}
              className="flex h-10 items-center justify-center rounded-xl bg-slate-900 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              Voir toutes les demandes
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.utilisateur);
  const avatar = loadUserAvatar(user);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] =
    useState(false);
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loadingNotifications, setLoadingNotifications] =
    useState(false);

  const notificationRef = useRef<HTMLDivElement | null>(
    null
  );

  useEffect(() => {
    applyAppTheme(loadUserPreferences(user).theme);
  }, [user?.idUtilisateur]);

  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);

      if (!loadUserPreferences(user).notifications) {
        setDemandes([]);
        return;
      }

      const response = await api.get(
        "/demandes-inscription"
      );

      const data = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.demandes)
          ? response.data.demandes
          : [];

      const pending = data
        .filter(
          (demande: Demande) =>
            demande.statut === "EN_ATTENTE"
        )
        .sort(
          (a: Demande, b: Demande) =>
            new Date(b.dateDemande).getTime() -
            new Date(a.dateDemande).getTime()
        );

      setDemandes(pending);
    } catch (error) {
      console.error(
        "Erreur lors du chargement des notifications :",
        error
      );
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    const interval = window.setInterval(() => {
      loadNotifications();
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target as Node
        )
      ) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen
      ? "hidden"
      : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f6f8f7] text-slate-800">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[#0d2f24] text-white transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-white/10 px-5">
          <Link
            to="/admin"
            onClick={closeMobileMenu}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white">
              <img
                src="/images/logo.png"
                alt="SmartCityWaste"
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <p className="text-[15px] font-bold tracking-tight">
                SmartCityWaste
              </p>

              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-300/70">
                Administration
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={closeMobileMenu}
            className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-6">
          <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300/50">
            Menu principal
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `group flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-white !text-[#0d2f24] shadow-sm ring-1 ring-white"
                        : "text-white/65 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`h-[18px] w-[18px] ${
                          isActive
                            ? "!text-[#0d2f24]"
                            : "text-white/55 group-hover:text-white"
                        }`}
                      />

                      <span className="flex-1">
                        {item.label}
                      </span>

                      {item.path ===
                        "/admin/demandes" &&
                        demandes.length > 0 && (
                          <span
                            className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                              isActive
                                ? "bg-orange-100 text-orange-600"
                                : "bg-orange-500 text-white"
                            }`}
                          >
                            {demandes.length > 99
                              ? "99+"
                              : demandes.length}
                          </span>
                        )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="my-6 border-t border-white/10" />

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />

              <span className="text-xs font-semibold text-white">
                Espace sécurisé
              </span>
            </div>

            <p className="mt-2 text-[11px] leading-5 text-white/45">
              Accès administrateur à la supervision
              SmartCityWaste.
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-xl px-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/15">
              <UserRound className="h-4 w-4 text-emerald-300" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">
                {user
                  ? `${user.prenom} ${user.nom}`
                  : "Administrateur"}
              </p>

              <p className="truncate text-[10px] text-white/45">
                {user?.email ?? "Compte administrateur"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Déconnexion"
              className="rounded-lg p-2 text-white/45 transition hover:bg-white/10 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-30 h-[76px] border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm hover:bg-slate-50 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">
                  Administration
                </p>

                <p className="text-xs text-slate-400">
                  Supervision intelligente des bacs à
                  déchets
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div
                ref={notificationRef}
                className="relative"
              >
                <button
                  type="button"
                  onClick={() =>
                    setNotificationOpen(
                      (current) => !current
                    )
                  }
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  aria-label="Notifications"
                >
                  <Bell className="h-[19px] w-[19px]" />

                  {demandes.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-orange-500 px-1 text-[9px] font-bold text-white">
                      {demandes.length > 9
                        ? "9+"
                        : demandes.length}
                    </span>
                  )}

                  {loadingNotifications &&
                    demandes.length === 0 && (
                      <span className="absolute right-1 top-1 h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    )}
                </button>

                {notificationOpen && (
                  <NotificationPanel
                    demandes={demandes}
                    onClose={() =>
                      setNotificationOpen(false)
                    }
                  />
                )}
              </div>

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              <Link
                to="/admin/parametres"
                className="group flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-slate-50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50">
                      {avatar ? (
                        <img src={avatar} alt="Profil administrateur" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        <UserRound className="h-4 w-4 text-emerald-700" />
                      )}
                </div>

                <div className="hidden text-left md:block">
                  <p className="max-w-[140px] truncate text-xs font-semibold text-slate-800">
                    {user
                      ? `${user.prenom} ${user.nom}`
                      : "Administrateur"}
                  </p>

                  <p className="text-[10px] text-slate-400">
                    Administrateur
                  </p>
                </div>

                <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" />
              </Link>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-76px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}