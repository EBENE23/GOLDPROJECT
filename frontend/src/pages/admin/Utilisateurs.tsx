import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  MapPin,
  MoreVertical,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  UserRound,
  UserX,
  X,
} from "lucide-react";
import api from "../../services/api";
import { useConfirmation } from "../../hooks/useConfirmation";
import { toast } from "react-toastify";

type UserRole =
  | "ADMINISTRATEUR"
  | "SUPERVISEUR"
  | "AGENT_COLLECTE";

interface Utilisateur {
  idUtilisateur: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string | null;
  statutCompte: string;
  role: UserRole;
  dateCreation?: string;
  id_zone?: number | null;
  zoneAffectation?: {
    idZone: number;
    nomZone: string;
    description?: string | null;
  } | null;
}

interface Zone {
  idZone: number;
  nomZone: string;
  description?: string | null;
}

type RoleFilter =
  | "TOUS"
  | "SUPERVISEUR"
  | "AGENT_COLLECTE";

const ITEMS_PER_PAGE = 8;

function extractArray(data: any, key: string) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.[key])) {
    return data[key];
  }

  return [];
}

function getInitials(user: Utilisateur) {
  return `${user.prenom?.charAt(0) || ""}${user.nom?.charAt(0) || ""}`.toUpperCase();
}

function getRoleLabel(role: UserRole) {
  if (role === "ADMINISTRATEUR") {
    return "Administrateur";
  }

  if (role === "SUPERVISEUR") {
    return "Superviseur";
  }

  return "Agent de collecte";
}

function getRoleClasses(role: UserRole) {
  if (role === "ADMINISTRATEUR") {
    return "bg-slate-100 text-slate-700";
  }

  if (role === "SUPERVISEUR") {
    return "bg-violet-50 text-violet-700";
  }

  return "bg-blue-50 text-blue-700";
}

function getStatusLabel(status: string) {
  if (status === "ACTIF") {
    return "Actif";
  }

  if (status === "EN_ATTENTE") {
    return "En attente";
  }

  if (status === "DESACTIVE") {
    return "Désactivé";
  }

  if (status === "INACTIF") {
    return "Inactif";
  }

  return status;
}

function getStatusClasses(status: string) {
  if (status === "ACTIF") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "EN_ATTENTE") {
    return "bg-orange-50 text-orange-600";
  }

  if (status === "INACTIF" || status === "DESACTIVE") {
    return "bg-slate-100 text-slate-500";
  }

  return "bg-slate-100 text-slate-500";
}

function formatDate(date?: string) {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Utilisateurs() {
  const { confirmer, dialogue } = useConfirmation();
  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [zoneLoading, setZoneLoading] = useState(false);

  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] =
    useState<RoleFilter>("TOUS");

  const [page, setPage] = useState(1);

  const [selectedUser, setSelectedUser] =
    useState<Utilisateur | null>(null);

  const [zoneUser, setZoneUser] =
    useState<Utilisateur | null>(null);

  const [selectedZoneId, setSelectedZoneId] =
    useState("");

  const [zoneError, setZoneError] = useState("");

  const [openMenu, setOpenMenu] =
    useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setError("");

      const response = await api.get("/utilisateurs");

      setUsers(
        extractArray(
          response.data,
          "utilisateurs"
        )
      );
    } catch (err) {
      console.error(err);
      setError(
        "Impossible de récupérer les comptes utilisateurs."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadZones = useCallback(async () => {
    try {
      const response = await api.get("/zones");

      setZones(
        extractArray(
          response.data,
          "zones"
        )
      );
    } catch (err) {
      console.error(err);
      setZoneError(
        "Impossible de récupérer les zones."
      );
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadZones();
  }, [loadUsers, loadZones]);

  useEffect(() => {
    const closeMenu = () => {
      setOpenMenu(null);
    };

    document.addEventListener(
      "click",
      closeMenu
    );

    return () => {
      document.removeEventListener(
        "click",
        closeMenu
      );
    };
  }, []);

  const stats = useMemo(() => {
    return {
      total: users.length,
      superviseurs: users.filter(
        (user) => user.role === "SUPERVISEUR"
      ).length,
      agents: users.filter(
        (user) => user.role === "AGENT_COLLECTE"
      ).length,
      actifs: users.filter(
        (user) => user.statutCompte === "ACTIF"
      ).length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const value = search.trim().toLowerCase();

    return users.filter((user) => {
      const fullName =
        `${user.prenom} ${user.nom}`.toLowerCase();

      const matchesSearch =
        !value ||
        fullName.includes(value) ||
        user.email.toLowerCase().includes(value) ||
        (user.telephone || "")
          .toLowerCase()
          .includes(value);

      const matchesRole =
        roleFilter === "TOUS" ||
        user.role === roleFilter;

      return (
        matchesSearch &&
        matchesRole
      );
    });
  }, [users, search, roleFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredUsers.length / ITEMS_PER_PAGE
    )
  );

  const paginatedUsers = filteredUsers.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const refresh = async () => {
    setRefreshing(true);

    await Promise.all([
      loadUsers(),
      loadZones(),
    ]);
  };

  const ouvrirAffectationZone = async (
    user: Utilisateur
  ) => {
    setOpenMenu(null);
    setZoneError("");

    if (user.role !== "AGENT_COLLECTE") {
      return;
    }

    setZoneUser(user);
    setSelectedZoneId(
      user.id_zone
        ? String(user.id_zone)
        : ""
    );

    if (zones.length === 0) {
      setZoneLoading(true);

      try {
        await loadZones();
      } finally {
        setZoneLoading(false);
      }
    }
  };

  const affecterZone = async () => {
    if (!zoneUser) {
      return;
    }

    if (!selectedZoneId) {
      setZoneError(
        "Veuillez sélectionner une zone."
      );
      return;
    }

    try {
      setZoneLoading(true);
      setZoneError("");

      await api.put(
        `/utilisateurs/${zoneUser.idUtilisateur}/zone`,
        {
          id_zone: Number(selectedZoneId),
        }
      );

      await loadUsers();

      setZoneUser(null);
      setSelectedZoneId("");
    } catch (err: any) {
      console.error(err);

      setZoneError(
        err?.response?.data?.message ||
          "Impossible d'affecter cet agent à la zone."
      );
    } finally {
      setZoneLoading(false);
    }
  };

  const disableUser = async (
    user: Utilisateur
  ) => {
    setOpenMenu(null);

    const confirmed = await confirmer({
      titre: "Désactiver ce compte ?",
      message: `${user.prenom} ${user.nom} ne pourra plus se connecter tant que le compte n'est pas réactivé.`,
      libelle: "Désactiver",
      danger: true,
    });

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);

      await api.put(
        `/utilisateurs/${user.idUtilisateur}/desactiver`
      );

      await loadUsers();

      if (
        selectedUser?.idUtilisateur ===
        user.idUtilisateur
      ) {
        setSelectedUser((current) =>
          current
            ? {
                ...current,
                statutCompte: "INACTIF",
              }
            : null
        );
      }
    } catch (err: any) {
      console.error(err);

      toast.error(
        err?.response?.data?.message ||
          "Impossible de désactiver ce compte."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const deleteUser = async (
    user: Utilisateur
  ) => {
    setOpenMenu(null);

    const confirmed = await confirmer({
      titre: "Supprimer ce compte ?",
      message: `Le compte de ${user.prenom} ${user.nom} sera supprimé définitivement. Cette action est irréversible.`,
      libelle: "Supprimer",
      danger: true,
    });

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);

      await api.delete(
        `/utilisateurs/${user.idUtilisateur}`
      );

      if (
        selectedUser?.idUtilisateur ===
        user.idUtilisateur
      ) {
        setSelectedUser(null);
      }

      if (
        zoneUser?.idUtilisateur ===
        user.idUtilisateur
      ) {
        setZoneUser(null);
      }

      await loadUsers();
    } catch (err: any) {
      console.error(err);

      toast.error(
        err?.response?.data?.message ||
          "Impossible de supprimer ce compte."
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-xl">
              Gestion Utilisateurs
            </h1>

            <p className="mt-1 text-[11px] text-slate-500 sm:text-sm">
              {stats.total} compte
              {stats.total > 1 ? "s" : ""} enregistré
              {stats.total > 1 ? "s" : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="hidden h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 sm:flex"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />

            Actualiser
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-600">
            {error}
          </div>
        )}

        <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <p className="text-[9px] text-slate-400 sm:text-xs">
              Comptes
            </p>

            <p className="mt-1 text-lg font-bold text-slate-900 sm:text-2xl">
              {stats.total}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <p className="text-[9px] text-slate-400 sm:text-xs">
              Superviseurs
            </p>

            <p className="mt-1 text-lg font-bold text-violet-700 sm:text-2xl">
              {stats.superviseurs}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <p className="text-[9px] text-slate-400 sm:text-xs">
              Agents
            </p>

            <p className="mt-1 text-lg font-bold text-blue-600 sm:text-2xl">
              {stats.agents}
            </p>
          </div>

          <div className="hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:block sm:p-4">
            <p className="text-xs text-slate-400">
              Actifs
            </p>

            <p className="mt-1 text-2xl font-bold text-emerald-700">
              {stats.actifs}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-3 sm:p-4">
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Rechercher un utilisateur..."
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[11px] outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 sm:h-10 sm:text-xs"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                <button
                  type="button"
                  onClick={() =>
                    setRoleFilter("TOUS")
                  }
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[9px] font-semibold transition sm:text-[10px] ${
                    roleFilter === "TOUS"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  Tous
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setRoleFilter(
                      "SUPERVISEUR"
                    )
                  }
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[9px] font-semibold transition sm:text-[10px] ${
                    roleFilter ===
                    "SUPERVISEUR"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  Superviseurs
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setRoleFilter(
                      "AGENT_COLLECTE"
                    )
                  }
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[9px] font-semibold transition sm:text-[10px] ${
                    roleFilter ===
                    "AGENT_COLLECTE"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  Agents
                </button>
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="max-h-[570px] overflow-auto">
              <table className="w-full min-w-[950px]">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Utilisateur
                    </th>

                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Rôle
                    </th>

                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Zone
                    </th>

                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Statut
                    </th>

                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Création
                    </th>

                    <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-16 text-center text-xs text-slate-400"
                      >
                        Chargement des comptes...
                      </td>
                    </tr>
                  ) : paginatedUsers.length ===
                    0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-16 text-center text-xs text-slate-400"
                      >
                        Aucun utilisateur trouvé.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map(
                      (user) => (
                        <tr
                          key={
                            user.idUtilisateur
                          }
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-700">
                                {getInitials(
                                  user
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800">
                                  {user.prenom}{" "}
                                  {user.nom}
                                </p>

                                <p className="mt-0.5 truncate text-[10px] text-slate-400">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${getRoleClasses(
                                user.role
                              )}`}
                            >
                              {getRoleLabel(
                                user.role
                              )}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-xs text-slate-500">
                            {user.zoneAffectation
                              ?.nomZone ||
                              (user.id_zone
                                ? `Zone #${user.id_zone}`
                                : "Non affectée")}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${getStatusClasses(
                                user.statutCompte
                              )}`}
                            >
                              {getStatusLabel(
                                user.statutCompte
                              )}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-xs text-slate-500">
                            {formatDate(
                              user.dateCreation
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedUser(
                                    user
                                  )
                                }
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                title="Consulter"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              {user.role ===
                                "AGENT_COLLECTE" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    ouvrirAffectationZone(
                                      user
                                    )
                                  }
                                  className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                                  title="Affecter une zone"
                                >
                                  <MapPin className="h-4 w-4" />
                                </button>
                              )}

                              {user.role !==
                                "ADMINISTRATEUR" &&
                                user.statutCompte ===
                                  "ACTIF" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      disableUser(
                                        user
                                      )
                                    }
                                    disabled={
                                      actionLoading
                                    }
                                    className="rounded-lg p-2 text-slate-400 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-50"
                                    title="Désactiver"
                                  >
                                    <UserX className="h-4 w-4" />
                                  </button>
                                )}

                              <button
                                type="button"
                                onClick={() =>
                                  deleteUser(
                                    user
                                  )
                                }
                                disabled={
                                  actionLoading
                                }
                                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2.5 p-3 md:hidden">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Chargement...
              </div>
            ) : paginatedUsers.length ===
              0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Aucun utilisateur trouvé.
              </div>
            ) : (
              paginatedUsers.map(
                (user) => (
                  <div
                    key={
                      user.idUtilisateur
                    }
                    className="relative rounded-xl border border-slate-200 bg-white p-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[9px] font-bold text-emerald-700">
                        {getInitials(user)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-bold text-slate-800">
                              {user.prenom}{" "}
                              {user.nom}
                            </p>

                            <p className="truncate text-[9px] text-slate-400">
                              {user.email}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2 py-1 text-[8px] font-semibold ${getStatusClasses(
                              user.statutCompte
                            )}`}
                          >
                            {getStatusLabel(
                              user.statutCompte
                            )}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`rounded-full px-2 py-1 text-[8px] font-semibold ${getRoleClasses(
                              user.role
                            )}`}
                          >
                            {getRoleLabel(
                              user.role
                            )}
                          </span>

                          {user.role !==
                            "ADMINISTRATEUR" && (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] text-slate-500">
                              {user.zoneAffectation
                                ?.nomZone ||
                                "Zone non affectée"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-slate-100 pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedUser(
                            user
                          )
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-500"
                        title="Consulter"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      {user.role ===
                        "AGENT_COLLECTE" && (
                        <button
                          type="button"
                          onClick={() =>
                            ouvrirAffectationZone(
                              user
                            )
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
                          title="Affecter une zone"
                        >
                          <MapPin className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {user.role !==
                        "ADMINISTRATEUR" &&
                        user.statutCompte ===
                          "ACTIF" && (
                          <button
                            type="button"
                            onClick={() =>
                              disableUser(
                                user
                              )
                            }
                            disabled={
                              actionLoading
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600 disabled:opacity-50"
                            title="Désactiver"
                          >
                            <UserX className="h-3.5 w-3.5" />
                          </button>
                        )}

                      <div className="relative">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();

                            setOpenMenu(
                              openMenu ===
                                user.idUtilisateur
                                ? null
                                : user.idUtilisateur
                            );
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-500"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>

                        {openMenu ===
                          user.idUtilisateur && (
                          <div
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                            className="absolute bottom-9 right-0 z-30 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUser(
                                  user
                                );
                                setOpenMenu(
                                  null
                                );
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[10px] text-slate-600 hover:bg-slate-50"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Consulter
                            </button>

                            {user.role ===
                              "AGENT_COLLECTE" && (
                              <button
                                type="button"
                                onClick={() =>
                                  ouvrirAffectationZone(
                                    user
                                  )
                                }
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[10px] text-blue-600 hover:bg-blue-50"
                              >
                                <MapPin className="h-3.5 w-3.5" />
                                Affecter une zone
                              </button>
                            )}

                            {user.role !==
                              "ADMINISTRATEUR" &&
                              user.statutCompte ===
                                "ACTIF" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    disableUser(
                                      user
                                    )
                                  }
                                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[10px] text-orange-600 hover:bg-orange-50"
                                >
                                  <UserX className="h-3.5 w-3.5" />
                                  Désactiver
                                </button>
                              )}

                            <button
                              type="button"
                              onClick={() =>
                                deleteUser(
                                  user
                                )
                              }
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[10px] text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-3 py-3 sm:px-5">
            <p className="text-[9px] text-slate-400 sm:text-[11px]">
              {filteredUsers.length} compte
              {filteredUsers.length > 1
                ? "s"
                : ""}
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() =>
                  setPage((current) =>
                    Math.max(
                      1,
                      current - 1
                    )
                  )
                }
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-emerald-600 px-2 text-[9px] font-bold text-white">
                {page}
              </span>

              <button
                type="button"
                disabled={
                  page >= totalPages
                }
                onClick={() =>
                  setPage((current) =>
                    Math.min(
                      totalPages,
                      current + 1
                    )
                  )
                }
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedUser && (
        <div className="anim-overlay fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/50 p-3 sm:p-4">
          <div className="anim-feuille w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Compte utilisateur
                </h2>

                <p className="mt-1 text-[9px] text-slate-400">
                  Consultation
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedUser(null)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-4 sm:p-5">
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                  {getInitials(
                    selectedUser
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">
                    {selectedUser.prenom}{" "}
                    {selectedUser.nom}
                  </p>

                  <p className="mt-1 truncate text-[10px] text-slate-400">
                    {selectedUser.email}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <Mail className="h-4 w-4 text-slate-400" />

                  <div className="min-w-0">
                    <p className="text-[9px] uppercase text-slate-400">
                      E-mail
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-700">
                      {selectedUser.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <UserRound className="h-4 w-4 text-slate-400" />

                  <div>
                    <p className="text-[9px] uppercase text-slate-400">
                      Rôle
                    </p>

                    <p className="mt-0.5 text-xs text-slate-700">
                      {getRoleLabel(
                        selectedUser.role
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <UserCheck className="h-4 w-4 text-slate-400" />

                  <div>
                    <p className="text-[9px] uppercase text-slate-400">
                      Statut
                    </p>

                    <p className="mt-0.5 text-xs text-slate-700">
                      {getStatusLabel(
                        selectedUser.statutCompte
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <UserRound className="h-4 w-4 text-slate-400" />

                  <div>
                    <p className="text-[9px] uppercase text-slate-400">
                      Téléphone
                    </p>

                    <p className="mt-0.5 text-xs text-slate-700">
                      {selectedUser.telephone ||
                        "Non renseigné"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <MapPin className="h-4 w-4 text-slate-400" />

                  <div>
                    <p className="text-[9px] uppercase text-slate-400">
                      Zone
                    </p>

                    <p className="mt-0.5 text-xs text-slate-700">
                      {selectedUser.zoneAffectation
                        ?.nomZone ||
                        "Non affectée"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <RefreshCw className="h-4 w-4 text-slate-400" />

                  <div>
                    <p className="text-[9px] uppercase text-slate-400">
                      Date de création
                    </p>

                    <p className="mt-0.5 text-xs text-slate-700">
                      {formatDate(
                        selectedUser.dateCreation
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {selectedUser.role ===
                "AGENT_COLLECTE" && (
                <button
                  type="button"
                  onClick={() =>
                    ouvrirAffectationZone(
                      selectedUser
                    )
                  }
                  className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-50 text-xs font-semibold text-blue-600"
                >
                  <MapPin className="h-4 w-4" />
                  Affecter une zone
                </button>
              )}

              {selectedUser.role !==
                "ADMINISTRATEUR" &&
                selectedUser.statutCompte ===
                  "ACTIF" && (
                  <button
                    type="button"
                    onClick={() =>
                      disableUser(
                        selectedUser
                      )
                    }
                    disabled={actionLoading}
                    className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-orange-50 text-xs font-semibold text-orange-600 disabled:opacity-50"
                  >
                    <UserX className="h-4 w-4" />
                    Désactiver le compte
                  </button>
                )}

              <button
                type="button"
                onClick={() =>
                  deleteUser(selectedUser)
                }
                disabled={actionLoading}
                className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-red-50 text-xs font-semibold text-red-600 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer le compte
              </button>
            </div>
          </div>
        </div>
      )}

      {zoneUser && (
        <div className="anim-overlay fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/50 p-3 sm:p-4">
          <div className="anim-feuille w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Affecter une zone
                </h2>

                <p className="mt-1 text-[9px] text-slate-400">
                  {zoneUser.prenom}{" "}
                  {zoneUser.nom}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setZoneUser(null);
                  setZoneError("");
                }}
                disabled={zoneLoading}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5">
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <UserRound className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800">
                      {zoneUser.prenom}{" "}
                      {zoneUser.nom}
                    </p>

                    <p className="truncate text-[10px] text-slate-400">
                      {zoneUser.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="zone-selection"
                  className="mb-1.5 block text-[10px] font-semibold text-slate-600"
                >
                  Zone d'affectation
                </label>

                <select
                  id="zone-selection"
                  value={selectedZoneId}
                  onChange={(event) =>
                    setSelectedZoneId(
                      event.target.value
                    )
                  }
                  disabled={
                    zoneLoading ||
                    zones.length === 0
                  }
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">
                    Sélectionner une zone
                  </option>

                  {zones.map((zone) => (
                    <option
                      key={zone.idZone}
                      value={zone.idZone}
                    >
                      {zone.nomZone}
                    </option>
                  ))}
                </select>
              </div>

              {zoneLoading && (
                <p className="mt-2 text-[10px] text-slate-400">
                  Chargement...
                </p>
              )}

              {zones.length === 0 &&
                !zoneLoading && (
                  <p className="mt-2 text-[10px] text-orange-600">
                    Aucune zone disponible.
                  </p>
                )}

              {zoneError && (
                <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-[10px] text-red-600">
                  {zoneError}
                </div>
              )}

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setZoneUser(null);
                    setZoneError("");
                  }}
                  disabled={zoneLoading}
                  className="flex h-10 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={affecterZone}
                  disabled={
                    zoneLoading ||
                    !selectedZoneId
                  }
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {zoneLoading && (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  )}

                  Affecter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {dialogue}
    </div>
  );
}