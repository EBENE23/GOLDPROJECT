// frontend/src/pages/admin/Interventions.tsx

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import api from "../../services/api";
import FiltreDates from "../../components/ui/FiltreDates";
import { dansPlage, plageVide, type PlageDates } from "../../utils/plageDates";

type Priority = "NORMALE" | "MOYENNE" | "HAUTE" | "CRITIQUE";
type Status =
  | "EN_ATTENTE"
  | "PLANIFIEE"
  | "EN_COURS"
  | "TERMINEE"
  | "ANNULEE";

interface Bac {
  id_bac: number;
  reference: string;
  niveau_remplissage: number;
  etat: string;
  id_zone: number;
}

interface Intervention {
  idIntervention: number;
  dateCreation: string;
  datePrevue?: string | null;
  priorite: Priority;
  motif: string;
  statut: Status;
  id_bac: number;
  id_superviseur: number;
  Bac?: Bac;
}

interface FormData {
  id_bac: string;
  datePrevue: string;
  priorite: Priority;
  motif: string;
}

interface InterventionsResponse {
  interventions?: Intervention[];
}

interface BacsResponse {
  bacs?: Bac[];
}

const initialForm: FormData = {
  id_bac: "",
  datePrevue: "",
  priorite: "NORMALE",
  motif: "",
};

const priorityClass: Record<Priority, string> = {
  NORMALE: "bg-slate-100 text-slate-700",
  MOYENNE: "bg-blue-50 text-blue-700",
  HAUTE: "bg-orange-50 text-orange-700",
  CRITIQUE: "bg-red-50 text-red-700",
};

const statusClass: Record<Status, string> = {
  EN_ATTENTE: "bg-orange-50 text-orange-700",
  PLANIFIEE: "bg-blue-50 text-blue-700",
  EN_COURS: "bg-violet-50 text-violet-700",
  TERMINEE: "bg-emerald-50 text-emerald-700",
  ANNULEE: "bg-slate-100 text-slate-600",
};

const statusLabel: Record<Status, string> = {
  EN_ATTENTE: "En attente",
  PLANIFIEE: "Planifiée",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  ANNULEE: "Annulée",
};

const priorityLabel: Record<Priority, string> = {
  NORMALE: "Normale",
  MOYENNE: "Moyenne",
  HAUTE: "Haute",
  CRITIQUE: "Critique",
};

export default function Interventions() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [bacs, setBacs] = useState<Bac[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [periode, setPeriode] = useState<PlageDates>(plageVide);
  const [statusFilter, setStatusFilter] = useState<"TOUS" | Status>("TOUS");
  const [selected, setSelected] = useState<Intervention | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const loadData = useCallback(async (manual = false) => {
    try {
      if (manual) setRefreshing(true);
      else setLoading(true);

      const [interventionsResponse, bacsResponse] = await Promise.all([
        api.get<Intervention[] | InterventionsResponse>("/interventions"),
        api.get<Bac[] | BacsResponse>("/bacs"),
      ]);

      setInterventions(
        Array.isArray(interventionsResponse.data)
          ? interventionsResponse.data
          : interventionsResponse.data?.interventions ?? []
      );
      setBacs(
        Array.isArray(bacsResponse.data)
          ? bacsResponse.data
          : bacsResponse.data?.bacs ?? []
      );
    } catch {
      setMessage("Impossible de charger les interventions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredInterventions = useMemo(() => {
    const value = search.trim().toLowerCase();

    return interventions.filter((item) => {
      const bacReference =
        item.Bac?.reference ||
        bacs.find((bac) => bac.id_bac === item.id_bac)?.reference ||
        "";

      const matchesSearch =
        !value ||
        bacReference.toLowerCase().includes(value) ||
        item.motif.toLowerCase().includes(value);

      const matchesStatus =
        statusFilter === "TOUS" || item.statut === statusFilter;

      return matchesSearch && matchesStatus && dansPlage(item.dateCreation, periode);
    });
  }, [bacs, interventions, search, statusFilter, periode]);

  const createIntervention = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setMessage("");

      await api.post("/interventions", {
        id_bac: Number(form.id_bac),
        datePrevue: form.datePrevue || null,
        priorite: form.priorite,
        motif: form.motif.trim(),
      });

      setForm(initialForm);
      setShowCreate(false);
      await loadData(true);
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message ||
          "Impossible de créer l'intervention."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getBac = (id: number) =>
    bacs.find((bac) => bac.id_bac === id);

  return (
    <div>
      <div >
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CalendarDays size={16} />
              Administration
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Gestion des interventions
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Suivez les interventions nécessaires sur les bacs.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:border-emerald-200 hover:text-emerald-700 disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Actualiser
            </button>

            <div className="hidden items-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-500 sm:flex">
              Création depuis l'espace superviseur
            </div>
          </div>
        </div>

        {message && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
            <button type="button" onClick={() => setMessage("")}>
              <X size={17} />
            </button>
          </div>
        )}

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <CalendarDays className="mb-3 text-blue-600" size={20} />
            <p className="text-xs text-slate-500">Total</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {interventions.length}
            </p>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
            <Clock3 className="mb-3 text-orange-600" size={20} />
            <p className="text-xs text-slate-500">En attente</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {
                interventions.filter(
                  (item) =>
                    item.statut === "EN_ATTENTE" ||
                    item.statut === "PLANIFIEE"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
            <AlertTriangle className="mb-3 text-violet-600" size={20} />
            <p className="text-xs text-slate-500">En cours</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {interventions.filter((item) => item.statut === "EN_COURS").length}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
            <CheckCircle2 className="mb-3 text-emerald-600" size={20} />
            <p className="text-xs text-slate-500">Terminées</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {interventions.filter((item) => item.statut === "TERMINEE").length}
            </p>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher une intervention..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "TOUS" | Status)
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400"
            >
              <option value="TOUS">Tous les statuts</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="PLANIFIEE">Planifiées</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINEE">Terminées</option>
              <option value="ANNULEE">Annulées</option>
            </select>
          </div>
        </div>

        <div className="mb-5">
          <FiltreDates valeur={periode} onChange={setPeriode} libelle="Créées" />
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Chargement des interventions...
          </div>
        ) : filteredInterventions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Aucune intervention trouvée.
          </div>
        ) : (
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-left">
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Bac
                    </th>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Motif
                    </th>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Priorité
                    </th>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Prévue
                    </th>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Statut
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInterventions.map((item) => {
                    const bac = getBac(item.id_bac);

                    return (
                      <tr
                        key={item.idIntervention}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">
                            {bac?.reference || `Bac #${item.id_bac}`}
                          </p>
                          <p className="text-xs text-slate-400">
                            ID {item.idIntervention}
                          </p>
                        </td>
                        <td className="max-w-[280px] px-5 py-4">
                          <p className="truncate text-sm text-slate-600">
                            {item.motif}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${priorityClass[item.priorite]}`}
                          >
                            {priorityLabel[item.priorite]}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-500">
                          {item.datePrevue
                            ? new Intl.DateTimeFormat("fr-FR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }).format(new Date(item.datePrevue))
                            : "Non planifiée"}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass[item.statut]}`}
                          >
                            {statusLabel[item.statut]}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelected(item)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            <Eye size={17} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-3 md:hidden">
          {!loading &&
            filteredInterventions.map((item) => {
              const bac = getBac(item.id_bac);

              return (
                <div
                  key={item.idIntervention}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900">
                        {bac?.reference || `Bac #${item.id_bac}`}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                        {item.motif}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${priorityClass[item.priorite]}`}
                    >
                      {priorityLabel[item.priorite]}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass[item.statut]}`}
                    >
                      {statusLabel[item.statut]}
                    </span>

                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600"
                    >
                      <Eye size={15} />
                      Détails
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {showCreate && (
        <div className="anim-overlay fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="anim-feuille w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Nouvelle intervention
                </h2>
                <p className="text-xs text-slate-500">
                  Créer une intervention sur un bac.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={createIntervention} className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Bac
                </label>
                <select
                  required
                  value={form.id_bac}
                  onChange={(event) =>
                    setForm({ ...form, id_bac: event.target.value })
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
                >
                  <option value="">Sélectionner un bac</option>
                  {bacs.map((bac) => (
                    <option key={bac.id_bac} value={bac.id_bac}>
                      {bac.reference} — {Number(bac.niveau_remplissage).toFixed(
                        0
                      )}
                      %
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Priorité
                  </label>
                  <select
                    value={form.priorite}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        priorite: event.target.value as Priority,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-emerald-400"
                  >
                    <option value="NORMALE">Normale</option>
                    <option value="MOYENNE">Moyenne</option>
                    <option value="HAUTE">Haute</option>
                    <option value="CRITIQUE">Critique</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Date prévue
                  </label>
                  <input
                    type="datetime-local"
                    value={form.datePrevue}
                    onChange={(event) =>
                      setForm({ ...form, datePrevue: event.target.value })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Motif
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.motif}
                  onChange={(event) =>
                    setForm({ ...form, motif: event.target.value })
                  }
                  placeholder="Décrire le motif de l'intervention..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="h-11 w-full rounded-xl bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? "Création..." : "Créer l'intervention"}
              </button>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div className="anim-overlay fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="anim-feuille w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Intervention #{selected.idIntervention}
                </h2>
                <p className="text-xs text-slate-500">
                  Détails de l'intervention
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-slate-400">Bac concerné</p>
                <p className="mt-1 font-bold text-slate-800">
                  {getBac(selected.id_bac)?.reference ||
                    `Bac #${selected.id_bac}`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">Priorité</p>
                  <span
                    className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${priorityClass[selected.priorite]}`}
                  >
                    {priorityLabel[selected.priorite]}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">Statut</p>
                  <span
                    className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusClass[selected.statut]}`}
                  >
                    {statusLabel[selected.statut]}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 p-4">
                <p className="text-xs text-slate-400">Motif</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {selected.motif}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 p-4">
                <p className="text-xs text-slate-400">Date prévue</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {selected.datePrevue
                    ? new Intl.DateTimeFormat("fr-FR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(selected.datePrevue))
                    : "Non planifiée"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}