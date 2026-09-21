// frontend/src/pages/admin/Demandes.tsx

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Clock3,
  Eye,
  Mail,
  RefreshCw,
  Search,
  UserCheck,
  UserPlus,
  UserX,
  X,
} from "lucide-react";
import api from "../../services/api";
import FiltreDates from "../../components/ui/FiltreDates";
import { dansPlage, plageVide, type PlageDates } from "../../utils/plageDates";

type DemandeRole = "SUPERVISEUR" | "AGENT_COLLECTE";
type DemandeStatut = "EN_ATTENTE" | "APPROUVEE" | "REFUSEE";

interface DemandeInscription {
  idDemande: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string | null;
  roleDemande: DemandeRole;
  statut: DemandeStatut;
  dateDemande: string;
}

interface Zone {
  idZone: number;
  nomZone: string;
  id_superviseur?: number | null;
}

const roleLabel: Record<DemandeRole, string> = {
  SUPERVISEUR: "Superviseur",
  AGENT_COLLECTE: "Agent de collecte",
};

const statutLabel: Record<DemandeStatut, string> = {
  EN_ATTENTE: "En attente",
  APPROUVEE: "Approuvée",
  REFUSEE: "Refusée",
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));

export default function Demandes() {
  const [demandes, setDemandes] = useState<DemandeInscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [periode, setPeriode] = useState<PlageDates>(plageVide);
  const [statut, setStatut] = useState<"TOUS" | DemandeStatut>("TOUS");
  const [role, setRole] = useState<"TOUS" | DemandeRole>("TOUS");
  const [selected, setSelected] = useState<DemandeInscription | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState("");

  const loadDemandes = useCallback(async (manual = false) => {
    try {
      if (manual) setRefreshing(true);
      else setLoading(true);

      const response = await api.get<
        DemandeInscription[] | { demandes?: DemandeInscription[] }
      >(
        "/demandes-inscription"
      );

      const demandesData = Array.isArray(response.data)
        ? response.data
        : response.data?.demandes || [];

      setDemandes(demandesData);
      const zonesResponse = await api.get("/zones");
      const zonesData = Array.isArray(zonesResponse.data)
        ? zonesResponse.data
        : zonesResponse.data?.zones || [];
      setZones(zonesData.filter((zone: Zone) => !zone.id_superviseur));
    } catch {
      setMessage("Impossible de charger les demandes d'inscription.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDemandes();
  }, [loadDemandes]);

  const pendingCount = useMemo(
    () => demandes.filter((item) => item.statut === "EN_ATTENTE").length,
    [demandes]
  );

  const filteredDemandes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return demandes.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        `${item.prenom} ${item.nom}`.toLowerCase().includes(normalizedSearch) ||
        item.email.toLowerCase().includes(normalizedSearch);

      const matchesStatus = statut === "TOUS" || item.statut === statut;
      const matchesRole = role === "TOUS" || item.roleDemande === role;

      return matchesSearch && matchesStatus && matchesRole && dansPlage(item.dateDemande, periode);
    });
  }, [demandes, role, search, statut, periode]);

  const handleAction = async (
    id: number,
    action: "approuver" | "refuser",
    idZone?: string
  ) => {
    try {
      setActionLoading(id);
      setMessage("");

      await api.put(
        `/demandes-inscription/${id}/${action}`,
        action === "approuver"
          ? {
              idZone: idZone ? Number(idZone) : undefined,
            }
          : undefined
      );

      setSelected(null);
      await loadDemandes(true);
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message ||
          `Impossible de ${action === "approuver" ? "approuver" : "refuser"} la demande.`
      );
    } finally {
      setActionLoading(null);
    }
  };

  const openApproval = (demande: DemandeInscription) => {
    setSelected(demande);
    setSelectedZone("");
  };

  return (
    <div>
      <div >
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
              <UserPlus size={16} />
              Administration
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Demandes d'inscription
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Consultez et traitez les demandes d'accès à la plateforme.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadDemandes(true)}
            disabled={refreshing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
            Actualiser
          </button>
        </div>

        {message && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{message}</span>
            <button type="button" onClick={() => setMessage("")}>
              <X size={17} />
            </button>
          </div>
        )}

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <UserPlus size={18} />
            </div>
            <p className="text-xs font-medium text-slate-500">Total</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {demandes.length}
            </p>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Clock3 size={18} />
            </div>
            <p className="text-xs font-medium text-slate-500">En attente</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Check size={18} />
            </div>
            <p className="text-xs font-medium text-slate-500">Approuvées</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {demandes.filter((item) => item.statut === "APPROUVEE").length}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <UserX size={18} />
            </div>
            <p className="text-xs font-medium text-slate-500">Refusées</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {demandes.filter((item) => item.statut === "REFUSEE").length}
            </p>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher par nom ou adresse email..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
              />
            </div>

            <select
              value={statut}
              onChange={(event) =>
                setStatut(event.target.value as "TOUS" | DemandeStatut)
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-emerald-400"
            >
              <option value="TOUS">Tous les statuts</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="APPROUVEE">Approuvées</option>
              <option value="REFUSEE">Refusées</option>
            </select>

            <select
              value={role}
              onChange={(event) =>
                setRole(event.target.value as "TOUS" | DemandeRole)
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-emerald-400"
            >
              <option value="TOUS">Tous les rôles</option>
              <option value="SUPERVISEUR">Superviseur</option>
              <option value="AGENT_COLLECTE">Agent de collecte</option>
            </select>
          </div>
        </div>

        <div className="mb-5">
          <FiltreDates valeur={periode} onChange={setPeriode} libelle="Demandes reçues" />
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left">
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Demandeur
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Rôle
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Date
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Statut
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-16 text-center text-sm text-slate-500"
                    >
                      Chargement des demandes...
                    </td>
                  </tr>
                ) : filteredDemandes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-16 text-center text-sm text-slate-500"
                    >
                      Aucune demande trouvée.
                    </td>
                  </tr>
                ) : (
                  filteredDemandes.map((demande) => (
                    <tr
                      key={demande.idDemande}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700">
                            {demande.prenom?.[0]}
                            {demande.nom?.[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800">
                              {demande.prenom} {demande.nom}
                            </p>
                            <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                              <Mail size={12} />
                              {demande.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {roleLabel[demande.roleDemande]}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">
                        {formatDate(demande.dateDemande)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                            demande.statut === "EN_ATTENTE"
                              ? "bg-orange-50 text-orange-700"
                              : demande.statut === "APPROUVEE"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                          }`}
                        >
                          {statutLabel[demande.statut]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openApproval(demande)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                            title="Consulter"
                          >
                            <Eye size={17} />
                          </button>

                          {demande.statut === "EN_ATTENTE" && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  openApproval(demande)
                                }
                                disabled={actionLoading === demande.idDemande}
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:opacity-50"
                                title="Approuver"
                              >
                                <Check size={17} />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleAction(demande.idDemande, "refuser")
                                }
                                disabled={actionLoading === demande.idDemande}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                                title="Refuser"
                              >
                                <X size={17} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3 md:hidden">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Chargement des demandes...
            </div>
          ) : filteredDemandes.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Aucune demande trouvée.
            </div>
          ) : (
            filteredDemandes.map((demande) => (
              <div
                key={demande.idDemande}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 font-bold text-emerald-700">
                      {demande.prenom?.[0]}
                      {demande.nom?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-800">
                        {demande.prenom} {demande.nom}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {demande.email}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      demande.statut === "EN_ATTENTE"
                        ? "bg-orange-50 text-orange-700"
                        : demande.statut === "APPROUVEE"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                    }`}
                  >
                    {statutLabel[demande.statut]}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Rôle
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {roleLabel[demande.roleDemande]}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Date
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {new Intl.DateTimeFormat("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(demande.dateDemande))}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelected(demande)}
                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
                  >
                    <Eye size={16} />
                    Consulter
                  </button>

                  {demande.statut === "EN_ATTENTE" && (
                    <>
                      <button
                        type="button"
                        onClick={() => openApproval(demande)}
                        disabled={actionLoading === demande.idDemande}
                        className="flex h-10 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white disabled:opacity-50"
                      >
                        <Check size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleAction(demande.idDemande, "refuser")
                        }
                        disabled={actionLoading === demande.idDemande}
                        className="flex h-10 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 disabled:opacity-50"
                      >
                        <X size={17} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selected && (
        <div className="anim-overlay fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="anim-feuille w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-lg font-bold text-slate-900">
                  Détail de la demande
                </p>
                <p className="text-xs text-slate-500">
                  Demande #{selected.idDemande}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              <div className="mb-5 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-lg font-bold text-emerald-700">
                  {selected.prenom?.[0]}
                  {selected.nom?.[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {selected.prenom} {selected.nom}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {roleLabel[selected.roleDemande]}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-400">Email</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {selected.email}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-400">
                    Téléphone
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {selected.telephone || "Non renseigné"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-400">
                      Statut
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {statutLabel[selected.statut]}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-400">
                      Demande
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {formatDate(selected.dateDemande)}
                    </p>
                  </div>
                </div>
              </div>

              {selected.statut === "EN_ATTENTE" && (
                <div className="mt-6 space-y-3">
                  {(selected.roleDemande === "SUPERVISEUR" || selected.roleDemande === "AGENT_COLLECTE") && (
                    <label className="block text-sm font-semibold text-slate-700">
                      Zone d'affectation
                      <select
                        value={selectedZone}
                        onChange={(event) => setSelectedZone(event.target.value)}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal"
                      >
                        <option value="">Choisir une zone disponible</option>
                        {zones.map((zone) => (
                          <option key={zone.idZone} value={zone.idZone}>
                            {zone.nomZone}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      handleAction(selected.idDemande, "refuser")
                    }
                    disabled={actionLoading === selected.idDemande}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 text-sm font-bold text-red-600 disabled:opacity-50"
                  >
                    <UserX size={17} />
                    Refuser
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleAction(selected.idDemande, "approuver", selectedZone)
                    }
                    disabled={actionLoading === selected.idDemande}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <UserCheck size={17} />
                    Approuver et activer
                  </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}