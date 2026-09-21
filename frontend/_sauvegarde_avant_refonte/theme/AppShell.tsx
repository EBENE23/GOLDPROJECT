import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bell, LogOut, MoreHorizontal, type LucideIcon } from "lucide-react";
import { toast } from "react-toastify";

import Modal from "../components/ui/Modal";
import api from "../services/api";
import { logout, useAuthStore } from "../stores/authStore";
import { ecouterTempsReel } from "../services/tempsReel";
import { applyAppTheme, loadUserAvatar, loadUserPreferences } from "../utils/userPreferences";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  // Titre affiché dans la barre supérieure (par défaut : label).
  titre?: string;
}

export interface ShellConfig {
  roleLabel: string;
  basePath: string;
  // Toutes les entrées du menu latéral / de la feuille « Plus ».
  navigation: NavItem[];
  // Section « Compte » (profil, paramètres…).
  compte: NavItem[];
  // Chemins (parmi navigation + compte) affichés dans la barre inférieure mobile.
  barreInferieure: string[];
  // Page ouverte par la cloche ; le compteur dépend du rôle.
  cloche: { path: string; source: "notifications" | "demandes" };
}

/** Compteur de la cloche : notifications non lues, ou demandes d'inscription en attente (admin). */
const useCompteurCloche = (source: ShellConfig["cloche"]["source"], idUtilisateur?: number) => {
  const [compteur, setCompteur] = useState(0);

  useEffect(() => {
    let actif = true;

    const charger = async () => {
      try {
        if (!loadUserPreferences({ idUtilisateur: idUtilisateur ?? 0 }).notifications) {
          if (actif) setCompteur(0);
          return;
        }

        if (source === "demandes") {
          const reponse = await api.get("/demandes-inscription");
          const liste = Array.isArray(reponse.data) ? reponse.data : reponse.data?.demandes ?? [];
          if (actif) setCompteur(liste.filter((d: { statut: string }) => d.statut === "EN_ATTENTE").length);
        } else {
          const reponse = await api.get("/notifications");
          if (actif) setCompteur(Number(reponse.data?.nonLues) || 0);
        }
      } catch {
        /* le compteur est purement informatif */
      }
    };

    charger();
    const intervalle = window.setInterval(charger, 15000);
    const desabonner = ecouterTempsReel((evenement) => {
      if (evenement.type === "notification" || evenement.type === "maj") charger();
    });

    return () => {
      actif = false;
      window.clearInterval(intervalle);
      desabonner();
    };
  }, [source, idUtilisateur]);

  return compteur;
};

const estActif = (chemin: string, item: NavItem, base: string) =>
  item.path === base ? chemin === base : chemin === item.path || chemin.startsWith(`${item.path}/`);

export default function AppShell({ config }: { config: ShellConfig }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const utilisateur = useAuthStore((state) => state.utilisateur);
  const [feuillePlus, setFeuillePlus] = useState(false);
  const avatar = loadUserAvatar(utilisateur);
  const compteur = useCompteurCloche(config.cloche.source, utilisateur?.idUtilisateur);

  useEffect(() => {
    applyAppTheme(loadUserPreferences(utilisateur).theme);
  }, [utilisateur]);

  // Toast à l'arrivée d'une nouvelle notification (mission affectée, alerte de bac…).
  const dernierIdNotification = useRef<number | null>(null);
  const cheminNotifications = config.cloche.path;
  const sourceCloche = config.cloche.source;

  useEffect(() => {
    if (sourceCloche !== "notifications") return;

    const verifier = async (annoncer: boolean) => {
      try {
        const reponse = await api.get("/notifications");
        const liste: Array<{ idNotification: number; contenu: string; lu: boolean; bac?: { etat?: string } | null }> =
          reponse.data?.notifications ?? [];
        const plusRecent = liste.reduce((max, n) => Math.max(max, n.idNotification), 0);

        if (dernierIdNotification.current === null) {
          dernierIdNotification.current = plusRecent;
          return;
        }

        const nouvelles = liste
          .filter((n) => n.idNotification > (dernierIdNotification.current ?? 0) && !n.lu)
          .reverse();
        dernierIdNotification.current = Math.max(dernierIdNotification.current, plusRecent);

        if (!annoncer || !loadUserPreferences({ idUtilisateur: utilisateur?.idUtilisateur ?? 0 }).notifications) return;

        nouvelles.forEach((n) => {
          const options = { toastId: `notif-${n.idNotification}`, onClick: () => navigate(cheminNotifications) };
          const etat = n.bac?.etat;

          if (etat === "PLEIN") toast.error(n.contenu, options);
          else if (etat === "ALERTE") toast.warning(n.contenu, options);
          else toast.info(n.contenu, options);
        });
      } catch {
        /* les toasts sont un confort : pas d'erreur affichée */
      }
    };

    void verifier(false);

    return ecouterTempsReel((evenement) => {
      if (evenement.type === "notification") void verifier(true);
    });
  }, [sourceCloche, cheminNotifications, navigate, utilisateur?.idUtilisateur]);

  // Prévient l'utilisateur (surtout l'agent sur le terrain) quand la connexion internet tombe.
  useEffect(() => {
    const perdue = () => toast.warning("Connexion internet perdue. Les données ne se mettent plus à jour.", { toastId: "hors-ligne", autoClose: false });
    const retablie = () => {
      toast.dismiss("hors-ligne");
      toast.success("Connexion rétablie.", { toastId: "en-ligne" });
    };

    window.addEventListener("offline", perdue);
    window.addEventListener("online", retablie);

    return () => {
      window.removeEventListener("offline", perdue);
      window.removeEventListener("online", retablie);
    };
  }, []);

  useEffect(() => {
    // Ferme la feuille « Plus » à chaque changement de page.
    setFeuillePlus(false); // eslint-disable-line react-hooks/set-state-in-effect
  }, [pathname]);

  const tous = useMemo(() => [...config.navigation, ...config.compte], [config]);
  const courant = useMemo(
    () =>
      [...tous]
        .sort((a, b) => b.path.length - a.path.length)
        .find((item) => estActif(pathname, item, config.basePath)),
    [tous, pathname, config.basePath]
  );
  const barre = config.barreInferieure
    .map((chemin) => tous.find((item) => item.path === chemin))
    .filter((item): item is NavItem => Boolean(item));
  const autres = tous.filter((item) => !config.barreInferieure.includes(item.path));
  const plusActif = autres.some((item) => estActif(pathname, item, config.basePath));

  const initiales = `${utilisateur?.prenom?.charAt(0) ?? ""}${utilisateur?.nom?.charAt(0) ?? ""}`.toUpperCase() || "?";
  const nomComplet = `${utilisateur?.prenom ?? ""} ${utilisateur?.nom ?? ""}`.trim();
  const titre = courant?.titre ?? courant?.label ?? config.roleLabel;

  const deconnecter = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const Avatar = ({ taille = "h-9 w-9" }: { taille?: string }) => (
    <span
      className={`relative flex ${taille} shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800`}
    >
      {avatar ? <img src={avatar} alt="Photo de profil" className="h-full w-full rounded-full object-cover" /> : initiales}
    </span>
  );

  const Cloche = () => (
    <Link
      to={config.cloche.path}
      aria-label="Notifications"
      className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100"
    >
      <Bell size={20} />
      {compteur > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
          {compteur > 99 ? "99+" : compteur}
        </span>
      )}
    </Link>
  );

  const lienLateral = (item: NavItem) => {
    const Icone = item.icon;
    const actif = estActif(pathname, item, config.basePath);

    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
          actif ? "bg-[#1f7a4d] text-white shadow-sm" : "text-white/65 hover:bg-white/10 hover:text-white"
        }`}
      >
        <Icone size={17} strokeWidth={1.9} />
        <span className="truncate">{item.label}</span>
      </NavLink>
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f7f6] text-slate-800">
      {/* ---------- Barre latérale (ordinateur) ---------- */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#10251b] text-white lg:flex">
        <Link to={config.basePath} className="flex h-[72px] shrink-0 items-center gap-3 border-b border-white/10 px-5">
          <img src="/images/logo.png" alt="SmartCityWaste" className="h-9 w-9 rounded-lg object-contain" />
          <div>
            <p className="text-sm font-bold leading-tight">
              SmartCityWaste <span className="align-super text-[9px] font-semibold text-emerald-400">IOT</span>
            </p>
            <p className="text-[11px] text-white/45">{config.roleLabel}</p>
          </div>
        </Link>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-5">
          <nav className="space-y-1">{config.navigation.map(lienLateral)}</nav>
          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/35">Compte</p>
            <nav className="space-y-1">{config.compte.map(lienLateral)}</nav>
          </div>
        </div>

        <div className="shrink-0 border-t border-white/10 p-3">
          <div className="mb-2 flex items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2.5">
            <Avatar taille="h-9 w-9" />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{nomComplet}</p>
              <p className="text-[10px] text-white/45">{config.roleLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={deconnecter}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-white/60 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut size={17} />
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        {/* ---------- Barre supérieure ---------- */}
        <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:h-[72px] lg:px-8">
            <Link to={config.basePath} className="flex min-w-0 items-center gap-3 lg:hidden">
              <img src="/images/logo.png" alt="SmartCityWaste" className="h-10 w-10 shrink-0 rounded-xl object-contain" />
              <div className="min-w-0">
                <p className="truncate text-[17px] font-bold leading-tight text-emerald-900">
                  SmartCityWaste <span className="align-super text-[9px] font-semibold text-emerald-600">IOT</span>
                </p>
                <p className="truncate text-xs text-slate-500">{titre}</p>
              </div>
            </Link>

            <div className="hidden min-w-0 lg:block">
              <p className="truncate text-lg font-bold text-slate-900">{titre}</p>
              <p className="text-xs text-slate-500">{config.roleLabel}</p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <Cloche />
              <Link to={config.compte[0]?.path ?? config.basePath} aria-label="Mon profil" className="relative">
                <Avatar />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
              </Link>
            </div>
          </div>
        </header>

        <main className="px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-7">
          <motion.div
            key={pathname}
            className="mx-auto w-full max-w-7xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* ---------- Navigation inférieure (mobile / tablette) ---------- */}
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="mx-auto flex max-w-xl items-stretch justify-around">
          {barre.map((item) => {
            const Icone = item.icon;
            const actif = estActif(pathname, item, config.basePath);

            return (
              <li key={item.path} className="flex-1">
                <NavLink
                  to={item.path}
                  className={`flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-semibold transition ${
                    actif ? "text-emerald-800" : "text-slate-500"
                  }`}
                >
                  <Icone size={22} strokeWidth={actif ? 2.4 : 1.8} />
                  <span className="max-w-full truncate">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setFeuillePlus(true)}
              className={`flex w-full flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-semibold transition ${
                plusActif ? "text-emerald-800" : "text-slate-500"
              }`}
            >
              <MoreHorizontal size={22} strokeWidth={plusActif ? 2.4 : 1.8} />
              Plus
            </button>
          </li>
        </ul>
      </nav>

      {/* ---------- Feuille « Plus » ---------- */}
      <Modal ouvert={feuillePlus} onFermer={() => setFeuillePlus(false)} largeur="sm">
        <div className="mb-4 flex items-center gap-3">
          <Avatar taille="h-11 w-11" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{nomComplet}</p>
            <p className="text-xs text-slate-500">{config.roleLabel}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {autres.map((item) => {
            const Icone = item.icon;
            const actif = estActif(pathname, item, config.basePath);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-2 rounded-2xl px-2 py-4 text-center text-xs font-semibold transition active:scale-95 ${
                  actif ? "bg-emerald-50 text-emerald-800" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icone size={22} />
                <span className="leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          onClick={deconnecter}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition active:scale-[0.98]"
        >
          <LogOut size={17} />
          Déconnexion
        </button>
      </Modal>
    </div>
  );
}
