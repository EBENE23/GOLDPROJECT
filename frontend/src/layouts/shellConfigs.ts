import {
  AlertTriangle,
  BarChart3,
  Bell,
  Boxes,
  ClipboardList,
  FileText,
  History,
  LayoutDashboard,
  Map as MapIcon,
  MapPinned,
  Radar,
  Settings,
  Trash2,
  Truck,
  User,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";

import type { ShellConfig } from "./AppShell";

// Chaque fonction reçoit `t()` (fourni par le composant qui construit la
// configuration) afin que le menu latéral, les titres de page et le libellé
// du rôle changent avec la langue choisie.
type T = (chemin: string, variables?: Record<string, string | number>) => string;

export const buildSuperviseurShell = (t: T): ShellConfig => ({
  roleLabel: t("shell.roleSuperviseur"),
  basePath: "/superviseur",
  navigation: [
    { label: t("shell.navDashboard"), titre: t("shell.titreTableauDeBord"), path: "/superviseur", icon: LayoutDashboard },
    { label: t("shell.navCarte"), titre: t("shell.titreCarteBacs"), path: "/superviseur/localisation", icon: MapIcon },
    { label: t("shell.navBacs"), titre: t("shell.titreSuperviserBacs"), path: "/superviseur/bacs", icon: Boxes },
    { label: t("shell.navInterventions"), path: "/superviseur/interventions", icon: ClipboardList },
    { label: t("shell.navSuivi"), titre: t("shell.titreSuiviInterventions"), path: "/superviseur/suivi", icon: Radar },
    { label: t("shell.navAgents"), titre: t("shell.titreAgentsZone"), path: "/superviseur/agents", icon: UserCheck },
    { label: t("shell.navAlertes"), path: "/superviseur/alertes", icon: AlertTriangle },
    { label: t("shell.navHistoriques"), path: "/superviseur/historiques", icon: History },
    { label: t("shell.navStatistiques"), path: "/superviseur/statistiques", icon: BarChart3 },
  ],
  compte: [
    { label: t("shell.navProfil"), titre: t("shell.titreMonProfil"), path: "/superviseur/profil", icon: User },
    { label: t("shell.navNotifications"), path: "/superviseur/notifications", icon: Bell },
    { label: t("shell.navParametres"), titre: t("shell.titrePreferences"), path: "/superviseur/parametres", icon: Settings },
  ],
  barreInferieure: [
    "/superviseur",
    "/superviseur/localisation",
    "/superviseur/interventions",
    "/superviseur/alertes",
  ],
  cloche: { path: "/superviseur/notifications", source: "notifications" },
});

export const buildAgentShell = (t: T): ShellConfig => ({
  roleLabel: t("shell.roleAgent"),
  basePath: "/agent",
  navigation: [
    { label: t("shell.navDashboard"), titre: t("shell.titreTableauDeBord"), path: "/agent", icon: LayoutDashboard },
    { label: t("shell.navMissions"), titre: t("shell.titreMesMissions"), path: "/agent/missions", icon: Truck },
    { label: t("shell.navCarte"), titre: t("shell.titreCarteBacs"), path: "/agent/localisation", icon: MapPinned },
    { label: t("shell.navHistorique"), path: "/agent/historique", icon: History },
    { label: t("shell.navSignalements"), path: "/agent/signalements", icon: AlertTriangle },
  ],
  compte: [
    { label: t("shell.navNotifications"), path: "/agent/notifications", icon: Bell },
    { label: t("shell.navProfil"), titre: t("shell.titreMonProfil"), path: "/agent/profil", icon: User },
    { label: t("shell.navParametres"), titre: t("shell.titrePreferences"), path: "/agent/parametres", icon: Settings },
  ],
  barreInferieure: ["/agent", "/agent/missions", "/agent/localisation", "/agent/notifications"],
  cloche: { path: "/agent/notifications", source: "notifications" },
});

export const buildAdminShell = (t: T): ShellConfig => ({
  roleLabel: t("shell.roleAdmin"),
  basePath: "/admin",
  navigation: [
    { label: t("shell.navDashboard"), titre: t("shell.titreVueEnsemble"), path: "/admin", icon: LayoutDashboard },
    { label: t("shell.navUtilisateurs"), path: "/admin/utilisateurs", icon: Users },
    { label: t("shell.navDemandes"), titre: t("shell.titreDemandesInscription"), path: "/admin/demandes", icon: UserPlus },
    { label: t("shell.navZones"), path: "/admin/zones", icon: MapPinned },
    { label: t("shell.navBacs"), titre: t("shell.titreBacsDechets"), path: "/admin/bacs", icon: Trash2 },
    { label: t("shell.navInterventions"), path: "/admin/interventions", icon: ClipboardList },
    { label: t("shell.navRapports"), path: "/admin/rapports", icon: FileText },
  ],
  compte: [
    { label: t("shell.navProfil"), titre: t("shell.titreMonProfil"), path: "/admin/profil", icon: User },
    { label: t("shell.navParametres"), titre: t("shell.titrePreferences"), path: "/admin/parametres", icon: Settings },
  ],
  barreInferieure: ["/admin", "/admin/utilisateurs", "/admin/bacs", "/admin/interventions"],
  cloche: { path: "/admin/demandes", source: "demandes" },
});
