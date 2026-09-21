import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Truck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import {
  obtenirDashboardAgent,
  type AgentDashboard,
} from "../../services/agentService";

const Dashboard = () => {
  const navigate = useNavigate();

  const [data, setData] =
    useState<AgentDashboard | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const chargerDashboard = async (
    afficherSucces = false
  ) => {
    try {
      setError("");

      if (data) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const resultat =
        await obtenirDashboardAgent();

      setData(resultat);

      if (afficherSucces) {
        toast.success(
          "Tableau de bord actualisé avec succès.",
          {
            autoClose: 2500,
          }
        );
      }
    } catch (err: any) {
      console.error(
        "Erreur chargement dashboard agent :",
        err
      );

      const message =
        err?.response?.data?.message ||
        "Impossible de charger le tableau de bord.";

      setError(message);

      if (data) {
        toast.error(message, {
          autoClose: 4000,
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    chargerDashboard();

    const interval = setInterval(() => {
      chargerDashboard(false);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleActualiser = async () => {
    await chargerDashboard(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="h-7 w-48 animate-pulse rounded-lg bg-gray-200" />
            <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-gray-200" />
          </div>

          <div className="h-11 w-32 animate-pulse rounded-xl bg-gray-200" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                  <div className="h-9 w-12 animate-pulse rounded bg-gray-200" />
                </div>

                <div className="h-12 w-12 animate-pulse rounded-xl bg-gray-200" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-2xl bg-gray-200" />
          <div className="h-80 animate-pulse rounded-2xl bg-gray-200" />
        </div>

        <div className="h-28 animate-pulse rounded-2xl bg-gray-200" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Activity
              size={22}
              className="text-red-600"
            />
          </div>

          <h1 className="mt-4 text-lg font-semibold text-red-800">
            Impossible de charger le tableau de bord
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() => chargerDashboard(true)}
            disabled={loading || refreshing}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                loading || refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            Aucune donnée disponible.
          </p>

          <button
            type="button"
            onClick={() => chargerDashboard(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
          >
            <RefreshCw size={17} />

            Actualiser
          </button>
        </div>
      </div>
    );
  }

  const statistiques =
    data.statistiques;

  const cartes = [
    {
      titre: "Total missions",
      valeur:
        statistiques.totalMissions,
      icon: Truck,
      description: "Toutes vos missions",
      classeIcone:
        "bg-green-50 text-green-700",
    },
    {
      titre: "À effectuer",
      valeur:
        statistiques.missionsAffectees,
      icon: Clock3,
      description: "Missions affectées",
      classeIcone:
        "bg-blue-50 text-blue-700",
    },
    {
      titre: "En cours",
      valeur:
        statistiques.missionsEnCours,
      icon: PlayCircle,
      description: "Missions actuellement actives",
      classeIcone:
        "bg-orange-50 text-orange-700",
    },
    {
      titre: "Terminées",
      valeur:
        statistiques.missionsTerminees,
      icon: CheckCircle2,
      description: "Missions réalisées",
      classeIcone:
        "bg-emerald-50 text-emerald-700",
    },
  ];

  const missionsRecentes =
    data.missions.slice(0, 5);

  const missionsParStatut = [
    {
      name: "Affectées",
      value: statistiques.missionsAffectees,
      color: "#2563eb",
    },
    {
      name: "En cours",
      value: statistiques.missionsEnCours,
      color: "#f97316",
    },
    {
      name: "Suspendues",
      value: statistiques.missionsSuspendues,
      color: "#eab308",
    },
    {
      name: "Terminées",
      value: statistiques.missionsTerminees,
      color: "#16a34a",
    },
    {
      name: "Annulées",
      value: statistiques.missionsAnnulees,
      color: "#dc2626",
    },
  ].filter((item) => item.value > 0);

  const obtenirClasseStatut = (
    statut: string
  ) => {
    switch (statut) {
      case "AFFECTEE":
        return "bg-blue-50 text-blue-700";

      case "EN_COURS":
        return "bg-orange-50 text-orange-700";

      case "SUSPENDUE":
        return "bg-yellow-50 text-yellow-700";

      case "TERMINEE":
        return "bg-green-50 text-green-700";

      case "ANNULEE":
        return "bg-red-50 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const traduireStatut = (
    statut: string
  ) => {
    switch (statut) {
      case "AFFECTEE":
        return "Affectée";

      case "EN_COURS":
        return "En cours";

      case "SUSPENDUE":
        return "Suspendue";

      case "TERMINEE":
        return "Terminée";

      case "ANNULEE":
        return "Annulée";

      default:
        return statut;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">
            Tableau de bord
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Suivi de vos missions de collecte.
          </p>
        </div>

        <button
          type="button"
          onClick={handleActualiser}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          {refreshing
            ? "Actualisation..."
            : "Actualiser"}
        </button>
      </div>

      {error && data && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-red-800">
              Actualisation impossible
            </p>

            <p className="mt-1 text-sm text-red-700">
              Les dernières données disponibles sont affichées.
            </p>
          </div>

          <button
            type="button"
            onClick={() => chargerDashboard(true)}
            disabled={refreshing}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Réessayer
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cartes.map((carte) => {
          const Icon = carte.icon;

          return (
            <div
              key={carte.titre}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-gray-500">
                    {carte.titre}
                  </p>

                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {carte.valeur}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    {carte.description}
                  </p>
                </div>

                <div
                  className={[
                    "shrink-0 rounded-xl p-3",
                    carte.classeIcone,
                  ].join(" ")}
                >
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3">
              <Activity size={20} className="text-blue-600" />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Répartition de vos missions
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Lecture rapide de votre activité actuelle.
              </p>
            </div>
          </div>

          <div className="mt-4 h-[230px]">
            {missionsParStatut.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Aucune mission à représenter.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={missionsParStatut}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={86}
                    paddingAngle={3}
                  >
                    {missionsParStatut.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {missionsParStatut.map((item) => (
              <div key={item.name} className="rounded-xl bg-gray-50 p-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-gray-500">{item.name}</span>
                </div>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3">
              <Activity
                size={20}
                className="text-blue-600"
              />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                État de vos missions
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Vue synthétique de votre activité.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600">
                Affectées
              </span>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {statistiques.missionsAffectees}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600">
                En cours
              </span>

              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                {statistiques.missionsEnCours}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600">
                Suspendues
              </span>

              <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                {statistiques.missionsSuspendues}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600">
                Terminées
              </span>

              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                {statistiques.missionsTerminees}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600">
                Annulées
              </span>

              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                {statistiques.missionsAnnulees}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/agent/missions")
            }
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Voir toutes les missions

            <ChevronRight size={17} />
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="rounded-xl bg-green-50 p-3">
                <Truck
                  size={20}
                  className="text-green-700"
                />
              </div>

              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900">
                  Missions récentes
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Vos dernières missions affectées.
                </p>
              </div>
            </div>

            {data.missions.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  navigate("/agent/missions")
                }
                className="hidden shrink-0 text-sm font-semibold text-green-700 transition hover:text-green-800 sm:block"
              >
                Tout voir
              </button>
            )}
          </div>

          <div className="mt-6 space-y-3">
            {missionsRecentes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                <ClipboardListIcon />

                <p className="mt-3 text-sm font-semibold text-gray-700">
                  Aucune mission disponible
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Les missions qui vous seront affectées apparaîtront ici.
                </p>
              </div>
            ) : (
              missionsRecentes.map(
                (mission) => {
                  const bac =
                    mission.intervention?.bac;

                  const latitude =
                    bac?.latitude;

                  const longitude =
                    bac?.longitude;

                  const localisationDisponible =
                    latitude !== null &&
                    latitude !== undefined &&
                    latitude !== "" &&
                    longitude !== null &&
                    longitude !== undefined &&
                    longitude !== "";

                  return (
                    <button
                      key={mission.idMission}
                      type="button"
                      onClick={() =>
                        navigate(
                          `/agent/missions/${mission.idMission}`
                        )
                      }
                      className="w-full rounded-xl border border-gray-100 bg-gray-50 p-4 text-left transition hover:border-green-200 hover:bg-green-50/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800">
                            Mission #
                            {mission.idMission}
                          </p>

                          <p className="mt-1 truncate text-xs text-gray-500">
                            {bac?.reference ||
                              "Bac non renseigné"}
                          </p>
                        </div>

                        <span
                          className={[
                            "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
                            obtenirClasseStatut(
                              mission.statut
                            ),
                          ].join(" ")}
                        >
                          {traduireStatut(
                            mission.statut
                          )}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2 text-xs text-gray-500">
                          <MapPin
                            size={14}
                            className="shrink-0"
                          />

                          <span className="truncate">
                            {localisationDisponible
                              ? `${latitude}, ${longitude}`
                              : "Position indisponible"}
                          </span>
                        </div>

                        <ChevronRight
                          size={16}
                          className="shrink-0 text-gray-400"
                        />
                      </div>
                    </button>
                  );
                }
              )
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-gray-100 p-3">
            <PauseCircle
              size={20}
              className="text-gray-700"
            />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">
              Rappel
            </h2>

            <p className="mt-1 text-sm leading-6 text-gray-500">
              Une mission suspendue doit être reprise ou terminée selon la situation réelle de la collecte.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ClipboardListIcon = () => {
  return (
    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm">
      <Truck size={20} />
    </div>
  );
};

export default Dashboard;