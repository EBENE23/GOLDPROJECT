import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Plus,
  RefreshCw,
  UserRound,
  X,
  AlertTriangle,
} from "lucide-react";

import {
  affecterInterventionSuperviseur,
  creerInterventionSuperviseur,
  listerAgentsSuperviseur,
  listerBacsSuperviseur,
  listerInterventionsSuperviseur,
  type Agent,
  type Bac,
  type Intervention,
} from "../../services/superviseurService";

const priorityStyle: Record<string, string> = {
  NORMALE: "bg-slate-100 text-slate-700",
  MOYENNE: "bg-blue-50 text-blue-700",
  HAUTE: "bg-amber-50 text-amber-700",
  CRITIQUE: "bg-red-50 text-red-700",
};

const statusStyle: Record<string, string> = {
  EN_ATTENTE: "bg-amber-50 text-amber-700",
  PLANIFIEE: "bg-blue-50 text-blue-700",
  EN_COURS: "bg-violet-50 text-violet-700",
  TERMINEE: "bg-emerald-50 text-emerald-700",
  ANNULEE: "bg-slate-100 text-slate-600",
};

const missionStatusStyle: Record<string, string> = {
  AFFECTEE: "bg-blue-50 text-blue-700",
  EN_COURS: "bg-violet-50 text-violet-700",
  SUSPENDUE: "bg-amber-50 text-amber-700",
  TERMINEE: "bg-emerald-50 text-emerald-700",
  ANNULEE: "bg-slate-100 text-slate-600",
};

type FormState = {
  id_bac: string;
  id_agent: string;
  datePrevue: string;
  priorite:
    | "NORMALE"
    | "MOYENNE"
    | "HAUTE"
    | "CRITIQUE";
  motif: string;
};

const emptyForm: FormState = {
  id_bac: "",
  id_agent: "",
  datePrevue: "",
  priorite: "HAUTE",
  motif: "",
};

const isPriorityBin = (bac: Bac) =>
  bac.etat === "ALERTE" ||
  bac.etat === "PLEIN";

const Interventions = () => {
  const [interventions, setInterventions] =
    useState<Intervention[]>([]);

  const [bacs, setBacs] =
    useState<Bac[]>([]);

  const [agents, setAgents] =
    useState<Agent[]>([]);

  const [searchParams, setSearchParams] =
    useSearchParams();

  const [form, setForm] =
    useState<FormState>(emptyForm);

  const [showForm, setShowForm] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const loadData = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setMessage("");
        setError("");

        const [
          interventionsResponse,
          bacsResponse,
          agentsResponse,
        ] = await Promise.all([
          listerInterventionsSuperviseur(),
          listerBacsSuperviseur(),
          listerAgentsSuperviseur(),
        ]);

        setInterventions(
          interventionsResponse.interventions || []
        );

        setBacs(
          bacsResponse.bacs || []
        );

        setAgents(
          agentsResponse.agents || []
        );

      } catch (err: any) {
        console.error(err);

        setError(
          err?.response?.data?.message ||
            "Impossible de charger les interventions."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData();
  }, [loadData]);
  useEffect(() => {
    const bacId = Number(searchParams.get("bac"));
    const agentParam = searchParams.get("agent") || "";
    const ouvrir = searchParams.get("ouvrir") === "1";

    if (!ouvrir || bacs.length === 0) {
      return;
    }

    // Le bac est facultatif : la page Agents ouvre le formulaire avec un agent seul.
    const bac = Number.isInteger(bacId) && bacId > 0
      ? bacs.find((item) => item.id_bac === bacId)
      : undefined;

    if (Number.isInteger(bacId) && bacId > 0 && !bac) {
      setError("Le bac demandé est introuvable dans votre zone.");
      return;
    }

    const agentValide = agents.some(
      (agent) => String(agent.idUtilisateur) === agentParam && agent.disponible !== false
    );

    setMessage("");
    setError("");
    setForm((current) => ({
      ...current,
      id_bac: bac ? String(bac.id_bac) : current.id_bac,
      id_agent: agentValide ? agentParam : "",
      priorite: bac ? (bac.etat === "PLEIN" ? "CRITIQUE" : "HAUTE") : current.priorite,
    }));
    setShowForm(true);
    setSearchParams({}, { replace: true });
  }, [bacs, agents, searchParams, setSearchParams]);

  const priorityBins = useMemo(
    () =>
      bacs.filter(
        isPriorityBin
      ),
    [bacs]
  );

  // Agents de la zone pouvant recevoir une mission (actifs, sous la limite).
  const agentsDisponibles = useMemo(
    () => agents.filter((agent) => agent.disponible !== false),
    [agents]
  );

  const interventionsEnCours =
    useMemo(
      () =>
        interventions.filter(
          (item) =>
            item.statut ===
            "EN_COURS"
        ).length,
      [interventions]
    );

  const interventionsTerminees =
    useMemo(
      () =>
        interventions.filter(
          (item) =>
            item.statut ===
            "TERMINEE"
        ).length,
      [interventions]
    );

  const resetForm = () => {
    setForm(emptyForm);
  };

  const fermerFormulaire = () => {
    if (submitting) {
      return;
    }

    resetForm();
    setShowForm(false);
  };

  const submit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setMessage("");
      setError("");

      if (!form.id_bac) {
        setError(
          "Veuillez sélectionner un bac."
        );
        return;
      }

      if (!form.id_agent) {
        setError(
          "Veuillez sélectionner un agent."
        );
        return;
      }

      if (!form.motif.trim()) {
        setError(
          "Le motif de l'intervention est obligatoire."
        );
        return;
      }

      const interventionResponse =
        await creerInterventionSuperviseur({
          id_bac: Number(
            form.id_bac
          ),
          datePrevue:
            form.datePrevue ||
            null,
          priorite:
            form.priorite,
          motif:
            form.motif.trim(),
        });

      const idIntervention =
        interventionResponse
          ?.intervention
          ?.idIntervention;

      if (!idIntervention) {
        throw new Error(
          "L'intervention a été créée mais son identifiant est introuvable."
        );
      }

      await affecterInterventionSuperviseur(
        idIntervention,
        {
          id_agent: Number(
            form.id_agent
          ),
        }
      );

      resetForm();
      setShowForm(false);

      setMessage(
        "Intervention créée et agent affecté avec succès."
      );

      await loadData(true);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Impossible de planifier cette intervention."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getBin = (
    intervention: Intervention
  ) =>
    intervention.bac ||
    bacs.find(
      (bac) =>
        bac.id_bac ===
        intervention.id_bac
    );

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-600">
              Organisation de collecte
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Interventions
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Priorisez les bacs, affectez un agent et suivez l'exécution.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                loadData(true)
              }
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Actualiser
            </button>

            <button
              type="button"
              onClick={() => {
                setMessage("");
                setError("");
                setShowForm(true);
              }}
              disabled={
                priorityBins.length ===
                  0 ||
                agentsDisponibles.length === 0
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={18} />
              Planifier
            </button>
          </div>
        </div>

        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {message}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric
            icon={ClipboardList}
            label="Interventions"
            value={
              interventions.length
            }
          />

          <Metric
            icon={CalendarDays}
            label="Bacs prioritaires"
            value={
              priorityBins.length
            }
            tone="amber"
          />

          <Metric
            icon={ClipboardList}
            label="En cours"
            value={
              interventionsEnCours
            }
            tone="violet"
          />

          <Metric
            icon={CheckCircle2}
            label="Terminées"
            value={
              interventionsTerminees
            }
            tone="emerald"
          />
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-bold text-slate-900">
              Suivi des interventions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Chaque intervention est liée à un bac de votre zone.
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Chargement…
            </div>
          ) : interventions.length ===
            0 ? (
            <div className="p-10 text-center">
              <ClipboardList
                size={32}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                Aucune intervention
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Les interventions créées pour votre zone apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {interventions.map(
                (item) => {
                  const bac =
                    getBin(item);

                  return (
                    <article
                      key={
                        item.idIntervention
                      }
                      className="p-4 transition hover:bg-slate-50 sm:p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-900">
                              {bac?.reference ||
                                `Bac #${item.id_bac}`}
                            </h3>

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                priorityStyle[
                                  item.priorite
                                ] ||
                                priorityStyle.NORMALE
                              }`}
                            >
                              {item.priorite}
                            </span>

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                statusStyle[
                                  item.statut
                                ] ||
                                statusStyle.EN_ATTENTE
                              }`}
                            >
                              {item.statut.replaceAll(
                                "_",
                                " "
                              )}
                            </span>
                          </div>

                          <p className="mt-1 truncate text-sm text-slate-500">
                            {item.motif ||
                              "Aucun motif renseigné."}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                            {item.datePrevue && (
                              <span className="inline-flex items-center gap-1.5">
                                <CalendarDays
                                  size={14}
                                />

                                {new Date(
                                  item.datePrevue
                                ).toLocaleString(
                                  "fr-FR",
                                  {
                                    dateStyle:
                                      "short",
                                    timeStyle:
                                      "short",
                                  }
                                )}
                              </span>
                            )}

                            {item.mission?.agent ? (
                              <span className="inline-flex items-center gap-1.5">
                                <UserRound
                                  size={14}
                                />

                                {
                                  item
                                    .mission
                                    .agent
                                    .prenom
                                }{" "}
                                {
                                  item
                                    .mission
                                    .agent
                                    .nom
                                }
                              </span>
                            ) : (
                              <span className="font-medium text-amber-600">
                                Aucun agent affecté
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0">
                          {item.mission ? (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                Mission
                              </p>

                              <div className="mt-1 flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-800">
                                  #
                                  {
                                    item
                                      .mission
                                      .idMission
                                  }
                                </span>

                                <span
                                  className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                                    missionStatusStyle[
                                      item
                                        .mission
                                        .statut
                                    ] ||
                                    missionStatusStyle.AFFECTEE
                                  }`}
                                >
                                  {item.mission.statut.replaceAll(
                                    "_",
                                    " "
                                  )}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                              <UserRound
                                size={15}
                              />
                              À affecter
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-4">
          <form
            onSubmit={submit}
            className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-xl sm:rounded-3xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-5">
              <div>
                <h2 className="font-bold text-slate-900">
                  Créer une intervention
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  L'intervention sera créée puis affectée à l'agent sélectionné.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  fermerFormulaire
                }
                disabled={submitting}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <Field label="Bac prioritaire">
                <select
                  required
                  value={
                    form.id_bac
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        id_bac:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                >
                  <option value="">
                    Sélectionner un bac
                  </option>

                  {priorityBins.map(
                    (bac) => (
                      <option
                        key={
                          bac.id_bac
                        }
                        value={
                          bac.id_bac
                        }
                      >
                        {bac.reference} —{" "}
                        {
                          bac.niveau_remplissage
                        }
                        % (
                        {
                          bac.etat
                        }
                        )
                      </option>
                    )
                  )}
                </select>
              </Field>

              <Field label="Agent de collecte">
                <select
                  required
                  value={
                    form.id_agent
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        id_agent:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                >
                  <option value="">
                    Sélectionner un agent
                  </option>

                  {agents.map(
                    (agent) => (
                      <option
                        key={
                          agent.idUtilisateur
                        }
                        value={
                          agent.idUtilisateur
                        }
                        disabled={
                          agent.disponible === false
                        }
                      >
                        {agent.prenom}{" "}
                        {agent.nom}
                        {" — "}
                        {agent.disponible === false
                          ? "indisponible"
                          : `${agent.missionsActives ?? 0} mission(s) active(s)`}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Priorité">
                  <select
                    value={
                      form.priorite
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          priorite:
                            event
                              .target
                              .value as FormState["priorite"],
                        })
                      )
                    }
                  >
                    <option value="NORMALE">
                      NORMALE
                    </option>
                    <option value="MOYENNE">
                      MOYENNE
                    </option>
                    <option value="HAUTE">
                      HAUTE
                    </option>
                    <option value="CRITIQUE">
                      CRITIQUE
                    </option>
                  </select>
                </Field>

                <Field label="Date prévue">
                  <input
                    type="datetime-local"
                    value={
                      form.datePrevue
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          datePrevue:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                  />
                </Field>
              </div>

              <Field label="Motif">
                <textarea
                  required
                  rows={3}
                  value={
                    form.motif
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        motif:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  placeholder="Ex. Bac plein, collecte prioritaire."
                />
              </Field>

              <button
                type="submit"
                disabled={
                  submitting ||
                  priorityBins.length ===
                    0 ||
                  agents.length ===
                    0
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <UserRound
                  size={17}
                />

                {submitting
                  ? "Planification…"
                  : "Créer et affecter l’intervention"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Interventions;

type MetricProps = {
  icon: React.ElementType;
  label: string;
  value: number;
  tone?:
    | "slate"
    | "amber"
    | "violet"
    | "emerald";
};

function Metric({
  icon: Icon,
  label,
  value,
  tone = "slate",
}: MetricProps) {
  const tones = {
    slate:
      "bg-slate-100 text-slate-600",
    amber:
      "bg-amber-50 text-amber-700",
    violet:
      "bg-violet-50 text-violet-700",
    emerald:
      "bg-emerald-50 text-emerald-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={`mb-3 inline-flex rounded-xl p-2 ${tones[tone]}`}
      >
        <Icon size={19} />
      </div>

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

type FieldProps = {
  label: string;
  children: React.ReactNode;
};

function Field({
  label,
  children,
}: FieldProps) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      <span className="mb-1.5 block">
        {label}
      </span>

      <div className="[&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-200 [&_input]:bg-white [&_input]:px-3 [&_input]:py-2.5 [&_input]:outline-none [&_input]:transition [&_input]:focus:border-emerald-500 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-200 [&_select]:bg-white [&_select]:px-3 [&_select]:py-2.5 [&_select]:outline-none [&_select]:transition [&_select]:focus:border-emerald-500 [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-slate-200 [&_textarea]:px-3 [&_textarea]:py-2.5 [&_textarea]:outline-none [&_textarea]:transition [&_textarea]:focus:border-emerald-500">
        {children}
      </div>
    </label>
  );
}