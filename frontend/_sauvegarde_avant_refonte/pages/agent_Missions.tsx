import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  MapPin,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Search,
  Truck,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  demarrerMission,
  listerMissionsAgent,
  reprendreMission,
  suspendreMission,
  terminerMission,
  type AgentMission,
} from "../../services/agentService";


const MissionStartIcon = ({
  size = 15,
  color = "#000000",
}: {
  size?: number;
  color?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M19 9H22M19 14H22M19 19H21M16 6L15.1991 18.0129C15.129 19.065 15.0939 19.5911 14.8667 19.99C14.6666 20.3412 14.3648 20.6235 14.0011 20.7998C13.588 21 13.0607 21 12.0062 21H7.99377C6.93927 21 6.41202 21 5.99889 20.7998C5.63517 20.3412 5.33339 20.6235 5.13332 19.99C4.90607 19.5911 4.871 19.065 4.80086 18.0129L4 6M2 6H18M14 6L13.7294 5.18807C13.4671 4.40125 13.3359 4.00784 13.0927 3.71698C12.8779 3.46013 12.6021 3.26132 12.2905 3.13878C11.9376 3 11.523 3 10.6936 3H9.30643C8.47705 3 8.06236 3 7.70951 3.13878C7.39792 3.26132 7.12208 3.46013 6.90729 3.71698C6.66405 4.00784 6.53292 4.40125 6.27064 5.18807L6 6M12 10V17M8 10L7.99995 16.9998"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const MissionCompleteIcon = ({
  size = 15,
  color = "#000000",
}: {
  size?: number;
  color?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M9 14L11 16L15 12M18 6L17.1991 18.0129C17.129 19.0651 17.0939 19.5911 16.8667 19.99C16.6666 20.3412 16.3648 20.6235 16.0011 20.7998C15.588 21 15.0607 21 14.0062 21H9.99377C8.93927 21 8.41202 21 7.99889 20.7998C7.63517 20.6235 7.33339 20.3412 7.13332 19.99C6.90607 19.5911 6.871 19.065 6.80086 18.0129L6 6M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const InterventionEnCoursIcon = ({
  size = 15,
  color = "#4249a9",
}: {
  size?: number;
  color?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M10 10V13M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M10 21H9C7.34315 21 6 19.6569 6 18V6M18 6V9M14 10V10.5M17 15.5V17H18.5M21 17C21 19.2091 19.2091 21 17 21C14.7909 21 13 19.2091 13 17C13 14.7909 14.7909 13 17 13C19.2091 13 21 14.7909 21 17Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const obtenirClasseStatut = (
  statut: AgentMission["statut"]
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
      return "bg-gray-50 text-gray-700";
  }
};

const obtenirLibelleStatut = (
  statut: AgentMission["statut"]
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

const obtenirClassePriorite = (
  priorite:
    | "NORMALE"
    | "MOYENNE"
    | "HAUTE"
    | "CRITIQUE"
) => {
  switch (priorite) {
    case "CRITIQUE":
      return "bg-red-50 text-red-700";

    case "HAUTE":
      return "bg-orange-50 text-orange-700";

    case "MOYENNE":
      return "bg-yellow-50 text-yellow-700";

    case "NORMALE":
      return "bg-green-50 text-green-700";

    default:
      return "bg-gray-50 text-gray-700";
  }
};

const Missions = () => {
  const navigate = useNavigate();

  const [missions, setMissions] = useState<
    AgentMission[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState<number | null>(null);

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState("");

  const chargerMissions = async () => {
    try {
      setLoading(true);
      setError("");

      const resultat =
        await listerMissionsAgent();

      setMissions(
        Array.isArray(resultat.missions)
          ? resultat.missions
          : []
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "Impossible de charger les missions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerMissions();

    const interval = setInterval(
      chargerMissions,
      15000
    );

    return () =>
      clearInterval(interval);
  }, []);

  const executerAction = async (
    id: number,
    action:
      | "demarrer"
      | "suspendre"
      | "reprendre"
      | "terminer"
  ) => {
    try {
      setActionLoading(id);
      setError("");

      if (action === "demarrer") {
        await demarrerMission(id);
      }

      if (action === "suspendre") {
        await suspendreMission(id);
      }

      if (action === "reprendre") {
        await reprendreMission(id);
      }

      if (action === "terminer") {
        await terminerMission(id);
      }

      await chargerMissions();
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "L'opération n'a pas pu être effectuée."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const missionsFiltrees =
    missions.filter((mission) => {
      const recherche =
        search.trim().toLowerCase();

      if (!recherche) {
        return true;
      }

      const reference =
        mission.intervention?.bac
          ?.reference || "";

      const motif =
        mission.intervention?.motif || "";

      const statut =
        mission.statut || "";

      const id =
        String(mission.idMission);

      return (
        reference
          .toLowerCase()
          .includes(recherche) ||
        motif
          .toLowerCase()
          .includes(recherche) ||
        statut
          .toLowerCase()
          .includes(recherche) ||
        id.includes(recherche)
      );
    });

  const confirmerAction = (
    mission: AgentMission,
    action:
      | "demarrer"
      | "suspendre"
      | "reprendre"
      | "terminer"
  ) => {
    const reference =
      mission.intervention?.bac
        ?.reference ||
      `Mission #${mission.idMission}`;

    let message = "";

    if (action === "demarrer") {
      message = `Voulez-vous démarrer la mission ${reference} ?`;
    }

    if (action === "suspendre") {
      message = `Voulez-vous suspendre la mission ${reference} ?`;
    }

    if (action === "reprendre") {
      message = `Voulez-vous reprendre la mission ${reference} ?`;
    }

    if (action === "terminer") {
      message = `Voulez-vous terminer la mission ${reference} ?`;
    }

    if (window.confirm(message)) {
      executerAction(
        mission.idMission,
        action
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">
            Mes missions
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Consultez et mettez à jour vos missions de collecte.
          </p>
        </div>

        <button
          type="button"
          onClick={chargerMissions}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
        >
          <RefreshCw
            size={17}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />

          Actualiser
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3">
              <Truck
                size={20}
                className="text-blue-600"
              />
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Total
              </p>

              <p className="text-2xl font-bold text-gray-900">
                {missions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3">
              <Clock3
                size={20}
                className="text-blue-600"
              />
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Affectées
              </p>

              <p className="text-2xl font-bold text-gray-900">
                {
                  missions.filter(
                    (mission) =>
                      mission.statut ===
                      "AFFECTEE"
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-50 p-3">
              <PlayCircle
                size={20}
                className="text-orange-600"
              />
            </div>

            <div>
              <p className="text-xs text-gray-500">
                En cours
              </p>

              <p className="text-2xl font-bold text-gray-900">
                {
                  missions.filter(
                    (mission) =>
                      mission.statut ===
                      "EN_COURS"
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-yellow-50 p-3">
              <PauseCircle
                size={20}
                className="text-yellow-600"
              />
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Suspendues
              </p>

              <p className="text-2xl font-bold text-gray-900">
                {
                  missions.filter(
                    (mission) =>
                      mission.statut ===
                      "SUSPENDUE"
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-50 p-3">
              <CheckCircle2
                size={20}
                className="text-green-600"
              />
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Terminées
              </p>

              <p className="text-2xl font-bold text-gray-900">
                {
                  missions.filter(
                    (mission) =>
                      mission.statut ===
                      "TERMINEE"
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <div className="relative w-full max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Rechercher une mission, un bac..."
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center p-6">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2
                size={18}
                className="animate-spin"
              />

              Chargement des missions...
            </div>
          </div>
        ) : missionsFiltrees.length ===
          0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
            <Truck
              size={42}
              className="text-gray-300"
            />

            <h2 className="mt-4 font-semibold text-gray-800">
              Aucune mission trouvée
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {search
                ? "Aucune mission ne correspond à votre recherche."
                : "Vous n'avez actuellement aucune mission affectée."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-4 font-semibold">
                    Mission
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Bac
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Priorité
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Zone
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Statut
                  </th>

                  <th className="px-5 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {missionsFiltrees.map(
                  (mission) => {
                    const bac =
                      mission
                        .intervention
                        ?.bac;

                    const intervention =
                      mission.intervention;

                    const isLoading =
                      actionLoading ===
                      mission.idMission;

                    return (
                      <tr
                        key={
                          mission.idMission
                        }
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">
                            Mission #
                            {
                              mission.idMission
                            }
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {mission.dateAffectation
                              ? new Date(
                                  mission.dateAffectation
                                ).toLocaleDateString(
                                  "fr-FR"
                                )
                              : "Date inconnue"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-800">
                            {bac?.reference ||
                              "Bac non renseigné"}
                          </p>

                          {bac?.niveau_remplissage !==
                            undefined && (
                            <p className="mt-1 text-xs text-gray-500">
                              Niveau :{" "}
                              {
                                bac.niveau_remplissage
                              }
                              %
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${obtenirClassePriorite(
                              intervention
                                ?.priorite ||
                                "NORMALE"
                            )}`}
                          >
                            {intervention
                              ?.priorite ||
                              "NORMALE"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin
                              size={15}
                              className="shrink-0 text-gray-400"
                            />

                            <span>
                              {bac?.zone
                                ?.nomZone ||
                                "Zone non renseignée"}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${obtenirClasseStatut(
                              mission.statut
                            )}`}
                          >
                            <span className="inline-flex items-center gap-1.5">
                             {intervention?.statut === "EN_COURS" && (
                               <InterventionEnCoursIcon
                                 size={15}
                                 color="#4249a9"
                               />
                             )}
                             {obtenirLibelleStatut(
                               mission.statut
                             )}
                           </span>
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/agent/missions/${mission.idMission}`
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                            >
                              <Eye
                                size={15}
                              />

                              Détails
                            </button>

                            {mission.statut ===
                              "AFFECTEE" && (
                              <button
                                type="button"
                                disabled={
                                  isLoading
                                }
                                onClick={() =>
                                  confirmerAction(
                                    mission,
                                    "demarrer"
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isLoading ? (
                                  <Loader2
                                    size={15}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <MissionStartIcon size={15} />
                                )}

                                Démarrer
                              </button>
                            )}

                            {mission.statut ===
                              "EN_COURS" && (
                              <button
                                type="button"
                                disabled={
                                  isLoading
                                }
                                onClick={() =>
                                  confirmerAction(
                                    mission,
                                    "suspendre"
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isLoading ? (
                                  <Loader2
                                    size={15}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <PauseCircle
                                    size={15}
                                  />
                                )}

                                Suspendre
                              </button>
                            )}

                            {mission.statut ===
                              "SUSPENDUE" && (
                              <button
                                type="button"
                                disabled={
                                  isLoading
                                }
                                onClick={() =>
                                  confirmerAction(
                                    mission,
                                    "reprendre"
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isLoading ? (
                                  <Loader2
                                    size={15}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <PlayCircle
                                    size={15}
                                  />
                                )}

                                Reprendre
                              </button>
                            )}

                            {(mission.statut ===
                              "EN_COURS" ||
                              mission.statut ===
                                "SUSPENDUE") && (
                              <button
                                type="button"
                                disabled={
                                  isLoading
                                }
                                onClick={() =>
                                  confirmerAction(
                                    mission,
                                    "terminer"
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isLoading ? (
                                  <Loader2
                                    size={15}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <MissionCompleteIcon size={15} />
                                )}

                                Terminer
                              </button>
                            )}

                            {mission.statut ===
                              "ANNULEE" && (
                              <span className="inline-flex items-center gap-1 text-xs text-red-600">
                                <XCircle
                                  size={15}
                                />

                                Annulée
                              </span>
                            )}

                            {mission.statut ===
                              "TERMINEE" && (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle2
                                  size={15}
                                />

                                Terminée
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Missions;