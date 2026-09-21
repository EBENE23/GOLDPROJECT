import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Clock3,
  Loader2,
  MapPin,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Truck,
  UserRound,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import {
  consulterMissionAgent,
  demarrerMission,
  reprendreMission,
  suspendreMission,
  terminerMission,
  type AgentMission,
} from "../../services/agentService";
import { obtenirCategorieNiveauBac, obtenirClasseFondNiveauBac } from "../../utils/bacLevel";
import { useTempsReel } from "../../hooks/useTempsReel";
import { Chargement } from "../../components/ui/kit";
import { ConfirmDialog } from "../../components/ui/Modal";


const MissionStartIcon = ({
  size = 18,
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
  size = 18,
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
  size = 18,
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

const MissionDetails = () => {
  const navigate = useNavigate();

  const { id } = useParams<{
    id: string;
  }>();

  const [mission, setMission] =
    useState<AgentMission | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [observation, setObservation] =
    useState("");

  const [actionEnAttente, setActionEnAttente] =
    useState<"demarrer" | "suspendre" | "reprendre" | "terminer" | null>(null);

  const chargerMission = useCallback(async (silencieux = false) => {
    if (!id) {
      setError("Identifiant de mission invalide.");
      setLoading(false);
      return;
    }

    try {
      if (!silencieux) {
        setLoading(true);
      }
      setError("");

      const resultat =
        await consulterMissionAgent(
          Number(id)
        );

      setMission(resultat);

      if (!silencieux) {
        setObservation(
          resultat.observation || ""
        );
      }
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "Impossible de charger les détails de la mission."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Le niveau du bac change quand le capteur transmet une mesure : mise à jour en direct.
  useTempsReel(() => chargerMission(true));

  useEffect(() => {
    chargerMission();
  }, [chargerMission]);

  const executerAction = async (
    action:
      | "demarrer"
      | "suspendre"
      | "reprendre"
      | "terminer"
  ) => {
    if (!mission) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      if (action === "demarrer") {
        await demarrerMission(
          mission.idMission
        );
      }

      if (action === "suspendre") {
        await suspendreMission(
          mission.idMission,
          observation.trim() || undefined
        );
      }

      if (action === "reprendre") {
        await reprendreMission(
          mission.idMission
        );
      }

      if (action === "terminer") {
        await terminerMission(
          mission.idMission,
          observation.trim() || undefined
        );
      }

      await chargerMission(true);

      toast.success(
        {
          demarrer: "Mission démarrée. Bonne route !",
          suspendre: "Mission suspendue.",
          reprendre: "Mission reprise.",
          terminer: "Mission terminée. Bravo !",
        }[action]
      );
    } catch (err: any) {
      console.error(err);

      const message =
        err?.response?.data?.message ||
        "Impossible de mettre à jour la mission.";

      setError(message);
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const confirmerAction = (
    action:
      | "demarrer"
      | "suspendre"
      | "reprendre"
      | "terminer"
  ) => {
    if (!mission) {
      return;
    }

    setActionEnAttente(action);
  };

  if (loading) {
    return <Chargement texte="Chargement de la mission..." />;
  }

  if (error && !mission) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() =>
            navigate("/agent/missions")
          }
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={17} />

          Retour aux missions
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!mission) {
    return null;
  }

  const intervention =
    mission.intervention;

  const bac = intervention?.bac;

  const supervisor =
    intervention?.superviseur;

  const niveauRemplissage = Math.min(
    100,
    Math.max(
      0,
      Number(
        bac?.niveau_remplissage || 0
      )
    )
  );

  // Règle métier : la mission ne peut être terminée que lorsque le capteur
  // indique que le bac est revenu à l'état normal.
  const bacVide =
    !bac ||
    obtenirCategorieNiveauBac(bac.niveau_remplissage) === "NORMAL";

  const dialogues = {
    demarrer: { titre: "Démarrer la mission ?", texte: "Votre superviseur pourra suivre votre trajet.", libelle: "Démarrer" },
    suspendre: { titre: "Suspendre la mission ?", texte: "Vous pourrez la reprendre plus tard.", libelle: "Suspendre" },
    reprendre: { titre: "Reprendre la mission ?", texte: "La mission repasse en cours.", libelle: "Reprendre" },
    terminer: { titre: "Terminer la mission ?", texte: "Le bac a été vidé et la collecte est terminée.", libelle: "Terminer" },
  } as const;
  const dialogue = actionEnAttente ? dialogues[actionEnAttente] : null;

  return (
    <div className="space-y-6">
      <ConfirmDialog
        ouvert={actionEnAttente !== null}
        titre={dialogue?.titre ?? ""}
        message={dialogue?.texte ?? ""}
        libelleConfirmer={dialogue?.libelle}
        enCours={actionLoading}
        onConfirmer={async () => {
          const action = actionEnAttente;
          setActionEnAttente(null);
          if (action) await executerAction(action);
        }}
        onAnnuler={() => setActionEnAttente(null)}
      />

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <button
            type="button"
            onClick={() =>
              navigate("/agent/missions")
            }
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
          >
            <ArrowLeft size={17} />

            Retour aux missions
          </button>

          <h1 className="text-2xl font-bold text-gray-900">
            Mission #{mission.idMission}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Détails et suivi de votre mission de collecte.
          </p>
        </div>

        <button
          type="button"
          onClick={() => chargerMission()}
          disabled={
            loading ||
            actionLoading
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
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

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-green-50 p-4">
              <Truck
                size={28}
                className="text-green-700"
              />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Mission
              </p>

              <h2 className="text-xl font-bold text-gray-900">
                #{mission.idMission}
              </h2>
            </div>
          </div>

          <span
            className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-semibold ${obtenirClasseStatut(
              mission.statut
            )}`}
          >
            {obtenirLibelleStatut(
              mission.statut
            )}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">
              Date d'affectation
            </p>

            <p className="mt-2 font-semibold text-gray-800">
              {mission.dateAffectation
                ? new Date(
                    mission.dateAffectation
                  ).toLocaleString("fr-FR")
                : "Non renseignée"}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">
              Début de mission
            </p>

            <p className="mt-2 font-semibold text-gray-800">
              {mission.dateDebut
                ? new Date(
                    mission.dateDebut
                  ).toLocaleString("fr-FR")
                : "Non démarrée"}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">
              Fin de mission
            </p>

            <p className="mt-2 font-semibold text-gray-800">
              {mission.dateFin
                ? new Date(
                    mission.dateFin
                  ).toLocaleString("fr-FR")
                : "Non terminée"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-50 p-3">
              <MapPin
                size={21}
                className="text-green-700"
              />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Point de collecte
              </h2>

              <p className="text-sm text-gray-500">
                Informations sur le bac concerné.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <p className="text-xs text-gray-500">
                Référence du bac
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {bac?.reference ||
                  "Non renseignée"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Zone
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {bac?.zone?.nomZone ||
                  "Zone non renseignée"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Niveau de remplissage
              </p>

              <div className="mt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-800">
                    {Math.round(
                      niveauRemplissage
                    )}
                    %
                  </span>

                  <span className="text-xs text-gray-500">
                    État :{" "}
                    {bac?.etat ||
                      "Inconnu"}
                  </span>
                </div>

                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all ${obtenirClasseFondNiveauBac(
                      niveauRemplissage
                    )}`}
                    style={{
                      width: `${niveauRemplissage}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Coordonnées GPS
              </p>

              <p className="mt-1 font-medium text-gray-800">
                {bac?.latitude !==
                    null &&
                bac?.latitude !==
                    undefined &&
                bac?.longitude !==
                    null &&
                bac?.longitude !==
                    undefined
                  ? `${bac.latitude}, ${bac.longitude}`
                  : "Position indisponible"}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/agent/missions/${mission.idMission}/localisation`
                )
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <MapPin size={18} />

              Voir la localisation
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3">
              <Clock3
                size={21}
                className="text-blue-700"
              />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Intervention associée
              </h2>

              <p className="text-sm text-gray-500">
                Informations transmises lors de l'affectation.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <p className="text-xs text-gray-500">
                Intervention
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                #
                {intervention
                  ?.idIntervention ||
                  "Non renseignée"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Priorité
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {intervention
                  ?.priorite ||
                  "NORMALE"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Motif
              </p>

              <p className="mt-1 text-sm leading-6 text-gray-700">
                {intervention
                  ?.motif ||
                  "Aucun motif renseigné."}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Statut de l'intervention
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                <span className="inline-flex items-center gap-2">
                  {intervention?.statut === "EN_COURS" && (
                    <InterventionEnCoursIcon
                      size={18}
                      color="#4249a9"
                    />
                  )}
                  {intervention?.statut ||
                    "Non renseigné"}
                </span>
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Superviseur
              </p>

              <div className="mt-1 flex items-center gap-2">
                <UserRound
                  size={16}
                  className="text-gray-400"
                />

                <span className="font-medium text-gray-800">
                  {supervisor
                    ? `${supervisor.prenom} ${supervisor.nom}`
                    : "Non renseigné"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gray-100 p-3">
            <Clock3
              size={21}
              className="text-gray-700"
            />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">
              Actions sur la mission
            </h2>

            <p className="text-sm text-gray-500">
              Faites évoluer le statut selon l'avancement réel de la collecte.
            </p>
          </div>
        </div>

        {(mission.statut ===
          "EN_COURS" ||
          mission.statut ===
            "SUSPENDUE") && (
          <div className="mt-6">
            <label
              htmlFor="mission-observation"
              className="mb-2 block text-xs font-semibold text-gray-600"
            >
              Observation
            </label>

            <textarea
              id="mission-observation"
              value={observation}
              onChange={(event) =>
                setObservation(
                  event.target.value
                )
              }
              rows={3}
              placeholder="Ajouter une observation sur la mission..."
              disabled={actionLoading}
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 disabled:opacity-50"
            />
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {mission.statut ===
            "AFFECTEE" && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() =>
                confirmerAction(
                  "demarrer"
                )
              }
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <MissionStartIcon size={18} />
              )}

              Démarrer la mission
            </button>
          )}

          {!bacVide &&
            (mission.statut === "EN_COURS" ||
              mission.statut === "SUSPENDUE") && (
              <p className="w-full rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
                Le bac {bac?.reference} est encore rempli à{" "}
                <strong>{Math.round(niveauRemplissage)} %</strong>. Videz-le : la
                mission pourra être terminée dès que le capteur indiquera que le bac
                est revenu à l'état normal (mise à jour automatique).
              </p>
            )}

          {mission.statut ===
            "EN_COURS" && (
            <>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() =>
                  confirmerAction(
                    "suspendre"
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl bg-yellow-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <PauseCircle size={18} />
                )}

                Suspendre
              </button>

              <button
                type="button"
                disabled={actionLoading || !bacVide}
                title={
                  bacVide
                    ? undefined
                    : "Le bac n'est pas encore revenu à l'état normal."
                }
                onClick={() =>
                  confirmerAction(
                    "terminer"
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <MissionCompleteIcon size={18} />
                )}

                Terminer la mission
              </button>
            </>
          )}

          {mission.statut ===
            "SUSPENDUE" && (
            <>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() =>
                  confirmerAction(
                    "reprendre"
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <PlayCircle size={18} />
                )}

                Reprendre
              </button>

              <button
                type="button"
                disabled={actionLoading || !bacVide}
                title={
                  bacVide
                    ? undefined
                    : "Le bac n'est pas encore revenu à l'état normal."
                }
                onClick={() =>
                  confirmerAction(
                    "terminer"
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <MissionCompleteIcon size={18} />
                )}

                Terminer la mission
              </button>
            </>
          )}
        </div>
      </div>

      {mission.observation && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900">
            Dernière observation
          </h2>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            {mission.observation}
          </p>
        </div>
      )}
    </div>
  );
};

export default MissionDetails;