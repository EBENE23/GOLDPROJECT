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

export const superviseurShell: ShellConfig = {
  roleLabel: "Superviseur",
  basePath: "/superviseur",
  navigation: [
    { label: "Dashboard", titre: "Tableau de bord", path: "/superviseur", icon: LayoutDashboard },
    { label: "Carte", titre: "Carte des bacs", path: "/superviseur/localisation", icon: MapIcon },
    { label: "Bacs", titre: "Superviser les bacs", path: "/superviseur/bacs", icon: Boxes },
    { label: "Interventions", path: "/superviseur/interventions", icon: ClipboardList },
    { label: "Suivi", titre: "Suivi des interventions", path: "/superviseur/suivi", icon: Radar },
    { label: "Agents", titre: "Agents de ma zone", path: "/superviseur/agents", icon: UserCheck },
    { label: "Alertes", path: "/superviseur/alertes", icon: AlertTriangle },
    { label: "Historiques", path: "/superviseur/historiques", icon: History },
    { label: "Statistiques", path: "/superviseur/statistiques", icon: BarChart3 },
  ],
  compte: [
    { label: "Profil", titre: "Mon profil", path: "/superviseur/profil", icon: User },
    { label: "Notifications", path: "/superviseur/notifications", icon: Bell },
    { label: "Paramètres", titre: "Préférences", path: "/superviseur/parametres", icon: Settings },
  ],
  barreInferieure: [
    "/superviseur",
    "/superviseur/localisation",
    "/superviseur/interventions",
    "/superviseur/alertes",
  ],
  cloche: { path: "/superviseur/notifications", source: "notifications" },
};

export const agentShell: ShellConfig = {
  roleLabel: "Agent de collecte",
  basePath: "/agent",
  navigation: [
    { label: "Dashboard", titre: "Tableau de bord", path: "/agent", icon: LayoutDashboard },
    { label: "Missions", titre: "Mes missions", path: "/agent/missions", icon: Truck },
    { label: "Carte", titre: "Carte des bacs", path: "/agent/localisation", icon: MapPinned },
    { label: "Historique", path: "/agent/historique", icon: History },
    { label: "Signalements", path: "/agent/signalements", icon: AlertTriangle },
  ],
  compte: [
    { label: "Notifications", path: "/agent/notifications", icon: Bell },
    { label: "Profil", titre: "Mon profil", path: "/agent/profil", icon: User },
    { label: "Paramètres", titre: "Préférences", path: "/agent/parametres", icon: Settings },
  ],
  barreInferieure: ["/agent", "/agent/missions", "/agent/localisation", "/agent/notifications"],
  cloche: { path: "/agent/notifications", source: "notifications" },
};

export const adminShell: ShellConfig = {
  roleLabel: "Administrateur",
  basePath: "/admin",
  navigation: [
    { label: "Dashboard", titre: "Vue d'ensemble", path: "/admin", icon: LayoutDashboard },
    { label: "Utilisateurs", path: "/admin/utilisateurs", icon: Users },
    { label: "Demandes", titre: "Demandes d'inscription", path: "/admin/demandes", icon: UserPlus },
    { label: "Zones", path: "/admin/zones", icon: MapPinned },
    { label: "Bacs", titre: "Bacs à déchets", path: "/admin/bacs", icon: Trash2 },
    { label: "Interventions", path: "/admin/interventions", icon: ClipboardList },
    { label: "Rapports", path: "/admin/rapports", icon: FileText },
  ],
  compte: [
    { label: "Profil", titre: "Mon profil", path: "/admin/profil", icon: User },
    { label: "Paramètres", titre: "Préférences", path: "/admin/parametres", icon: Settings },
  ],
  barreInferieure: ["/admin", "/admin/utilisateurs", "/admin/bacs", "/admin/interventions"],
  cloche: { path: "/admin/demandes", source: "demandes" },
};
