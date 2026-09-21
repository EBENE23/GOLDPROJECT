import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  History as HistoryIcon,
  RefreshCw,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";

import { listerMissionsAgent } from "../../services/agentService";
import type { AgentMission } from "../../services/agentService";

const formaterDate = (date?: string | null) => {
  if (!date) return "Non renseignée";

  const valeur = new Date(date);

  if (Number.isNaN(valeur.getTime())) {
    return "Date invalide";
  }

  return valeur.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formaterDateHeure = (date?: string | null) => {
  if (!date) return "Non renseignée";

  const valeur = new Date(date);

  if (Number.isNaN(valeur.getTime())) {
    return "Date invalide";
  }

  return valeur.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const obtenirLibelleStatut = (statut: AgentMission["statut"]) => {
  switch (statut) {
    case "TERMINEE":
      return "Terminée";
    case "ANNULEE":
      return "Annulée";
    default:
      return statut.replaceAll("_", " ");
  }
};

export default function Historique() {
  const [missions, setMissions] = useState<AgentMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await listerMissionsAgent();

      setMissions(
        Array.isArray(response.missions) ? response.missions : []
      );
    } catch (requestError: unknown) {
      const message =
        (
          requestError as {
            response?: {
              data?: {
                message?: string;
              };
            };
          }
        )?.response?.data?.message ||
        "Impossible de charger l'historique.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const completed = useMemo(
    () =>
      missions
        .filter(
          (mission) =>
            mission.statut === "TERMINEE" ||
            mission.statut === "ANNULEE"
        )
        .sort((a, b) => {
          const dateA = new Date(
            a.dateFin || a.dateAffectation || 0
          ).getTime();

          const dateB = new Date(
            b.dateFin || b.dateAffectation || 0
          ).getTime();

          return dateB - dateA;
        }),
    [missions]
  );

  const terminer = completed.filter(
    (mission) => mission.statut === "TERMINEE"
  ).length;

  const annulees = completed.filter(
    (mission) => mission.statut === "ANNULEE"
  ).length;

  const handleRefresh = async () => {
    await load();
    toast.success("Historique actualisé.");
  };

  return (
    <div className="app-page bg-slate-50">
      <div className="app-container space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-600">
              Suivi d'activité
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Historique
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Retrouvez vos missions terminées ou annulées.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Actualiser
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <TriangleAlert size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && completed.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Missions archivées
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {completed.length}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
              <p className="text-sm text-emerald-700">
                Missions terminées
              </p>

              <p className="mt-2 text-2xl font-bold text-emerald-700">
                {terminer}
              </p>
            </div>

            <div className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
              <p className="text-sm text-red-700">
                Missions annulées
              </p>

              <p className="mt-2 text-2xl font-bold text-red-700">
                {annulees}
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-12 text-center text-sm text-slate-500 shadow-sm">
            <RefreshCw
              size={24}
              className="mx-auto mb-3 animate-spin text-slate-400"
            />
            Chargement de l'historique…
          </div>
        ) : completed.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <HistoryIcon
              className="mx-auto mb-3 text-slate-300"
              size={32}
            />

            <h2 className="font-semibold text-slate-800">
              Aucun historique
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Aucune mission terminée ou annulée pour le moment.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {completed.map((mission) => {
              const terminee = mission.statut === "TERMINEE";
              const reference =
                mission.intervention?.bac?.reference ||
                "Bac à collecter";

              const motif =
                mission.intervention?.motif ||
                "Intervention de collecte";

              return (
                <article
                  key={mission.idMission}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Mission #{mission.idMission}
                      </p>

                      <h2 className="mt-1 truncate font-bold text-slate-900">
                        {reference}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {motif}
                      </p>
                    </div>

                    {terminee ? (
                      <div className="shrink-0 rounded-full bg-emerald-50 p-2">
                        <CheckCircle2
                          size={20}
                          className="text-emerald-600"
                        />
                      </div>
                    ) : (
                      <div className="shrink-0 rounded-full bg-red-50 p-2">
                        <XCircle
                          size={20}
                          className="text-red-600"
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-400">
                        Statut
                      </p>

                      <p
                        className={`mt-1 text-sm font-bold ${
                          terminee
                            ? "text-emerald-700"
                            : "text-red-700"
                        }`}
                      >
                        {obtenirLibelleStatut(mission.statut)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-400">
                        Affectation
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {formaterDate(mission.dateAffectation)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-400">
                        Début
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {formaterDateHeure(mission.dateDebut)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-400">
                        Fin
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {formaterDateHeure(mission.dateFin)}
                      </p>
                    </div>
                  </div>

                  {mission.observation && (
                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-semibold text-slate-400">
                        Observation
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {mission.observation}
                      </p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}