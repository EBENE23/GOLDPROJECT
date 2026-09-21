import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  MapPin,
  RefreshCw,
  Send,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";

import {
  creerIncidentAgent,
  listerIncidentsAgent,
} from "../../services/incidentService";

import {
  listerMissionsAgent,
} from "../../services/agentService";

import type {
  FormEvent,
} from "react";

import type {
  IncidentAgent,
} from "../../services/incidentService";

import type {
  AgentMission,
} from "../../services/agentService";

const Signalements = () => {
  const [incidents, setIncidents] = useState<
    IncidentAgent[]
  >([]);

  const [missions, setMissions] = useState<
    AgentMission[]
  >([]);

  const [idMission, setIdMission] = useState("");

  const [description, setDescription] =
    useState("");

  const [latitude, setLatitude] =
    useState("");

  const [longitude, setLongitude] =
    useState("");

  const [chargement, setChargement] =
    useState(true);

  const [envoi, setEnvoi] =
    useState(false);

  const [erreur, setErreur] =
    useState("");

  const chargerDonnees = async () => {
    try {
      setChargement(true);
      setErreur("");

      const [
        incidentsResult,
        missionsResult,
      ] = await Promise.all([
        listerIncidentsAgent(),
        listerMissionsAgent(),
      ]);

      setIncidents(incidentsResult);
      setMissions(missionsResult.missions);
    } catch (error) {
      console.error(
        "Erreur chargement signalements :",
        error
      );

      setErreur(
        "Impossible de charger les signalements."
      );
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  const missionsActives = useMemo(
    () =>
      missions.filter(
        (mission) =>
          mission.statut === "AFFECTEE" ||
          mission.statut === "EN_COURS" ||
          mission.statut === "SUSPENDUE"
      ),
    [missions]
  );

  const formatDate = (date?: string) => {
    if (!date) {
      return "Date inconnue";
    }

    const valeur = new Date(date);

    if (Number.isNaN(valeur.getTime())) {
      return "Date inconnue";
    }

    return valeur.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const obtenirNomMission = (
    id: number
  ) => {
    const mission = missions.find(
      (item) =>
        item.idMission === id
    );

    if (!mission) {
      return `Mission #${id}`;
    }

    const reference =
      mission.intervention?.bac?.reference;

    return reference
      ? `Mission #${id} — ${reference}`
      : `Mission #${id}`;
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!idMission) {
      toast.error(
        "Veuillez sélectionner une mission."
      );
      return;
    }

    if (!description.trim()) {
      toast.error(
        "Veuillez décrire le problème rencontré."
      );
      return;
    }

    const latitudeValue =
      latitude.trim()
        ? Number(latitude)
        : null;

    const longitudeValue =
      longitude.trim()
        ? Number(longitude)
        : null;

    if (
      latitudeValue !== null &&
      Number.isNaN(latitudeValue)
    ) {
      toast.error(
        "La latitude saisie est invalide."
      );
      return;
    }

    if (
      longitudeValue !== null &&
      Number.isNaN(longitudeValue)
    ) {
      toast.error(
        "La longitude saisie est invalide."
      );
      return;
    }

    try {
      setEnvoi(true);

      await creerIncidentAgent(
        Number(idMission),
        {
          description:
            description.trim(),
          latitude: latitudeValue,
          longitude: longitudeValue,
        }
      );

      toast.success(
        "Signalement envoyé au superviseur."
      );

      setDescription("");
      setLatitude("");
      setLongitude("");
      setIdMission("");

      await chargerDonnees();
    } catch (error: any) {
      console.error(
        "Erreur création signalement :",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Impossible d'enregistrer le signalement."
      );
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Signalements
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Signalez un problème rencontré pendant une mission de collecte.
          </p>
        </div>

        <button
          type="button"
          onClick={chargerDonnees}
          disabled={chargement}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={17}
            className={
              chargement
                ? "animate-spin"
                : ""
            }
          />

          Actualiser
        </button>
      </div>

      {erreur && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <XCircle
              size={20}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <p className="text-sm font-medium text-red-800">
              {erreur}
            </p>
          </div>

          <button
            type="button"
            onClick={chargerDonnees}
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                <AlertTriangle size={21} />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Nouveau signalement
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Transmettez un problème au superviseur.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 p-5 sm:p-6"
          >
            <div>
              <label
                htmlFor="mission"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Mission concernée
              </label>

              <select
                id="mission"
                value={idMission}
                onChange={(event) =>
                  setIdMission(
                    event.target.value
                  )
                }
                disabled={
                  envoi ||
                  missionsActives.length === 0
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="">
                  Sélectionner une mission
                </option>

                {missionsActives.map(
                  (mission) => (
                    <option
                      key={
                        mission.idMission
                      }
                      value={
                        mission.idMission
                      }
                    >
                      {obtenirNomMission(
                        mission.idMission
                      )}
                    </option>
                  )
                )}
              </select>

              {missionsActives.length ===
                0 && (
                <p className="mt-2 text-xs text-gray-500">
                  Aucune mission active n'est disponible pour effectuer un signalement.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Description du problème
              </label>

              <textarea
                id="description"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                rows={6}
                maxLength={2000}
                placeholder="Décrivez précisément le problème rencontré..."
                disabled={envoi}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
              />

              <div className="mt-1 text-right text-xs text-gray-400">
                {description.length}/2000
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2">
                <MapPin
                  size={17}
                  className="text-gray-500"
                />

                <p className="text-sm font-semibold text-gray-700">
                  Localisation
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="latitude"
                    className="mb-2 block text-xs font-medium text-gray-500"
                  >
                    Latitude
                  </label>

                  <input
                    id="latitude"
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(event) =>
                      setLatitude(
                        event.target.value
                      )
                    }
                    placeholder="Ex. 3.8667000"
                    disabled={envoi}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="longitude"
                    className="mb-2 block text-xs font-medium text-gray-500"
                  >
                    Longitude
                  </label>

                  <input
                    id="longitude"
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(event) =>
                      setLongitude(
                        event.target.value
                      )
                    }
                    placeholder="Ex. 11.5167000"
                    disabled={envoi}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <p className="mt-2 text-xs text-gray-400">
                Les coordonnées sont facultatives.
              </p>
            </div>

            <button
              type="submit"
              disabled={
                envoi ||
                missionsActives.length ===
                  0
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {envoi ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Envoyer le signalement
                </>
              )}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
                <ClipboardList size={21} />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Mes signalements
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Historique des problèmes signalés.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {chargement ? (
              <div className="flex min-h-60 flex-col items-center justify-center gap-3 text-gray-500">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-green-700" />

                <p className="text-sm">
                  Chargement des signalements...
                </p>
              </div>
            ) : incidents.length ===
              0 ? (
              <div className="flex min-h-60 flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                  <ClipboardList size={25} />
                </div>

                <h3 className="mt-4 font-semibold text-gray-800">
                  Aucun signalement
                </h3>

                <p className="mt-1 max-w-sm text-sm leading-5 text-gray-500">
                  Vous n'avez encore signalé aucun problème.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {incidents.map(
                  (incident) => (
                    <article
                      key={
                        incident.idIncident
                      }
                      className="rounded-xl border border-gray-200 p-4 transition hover:border-gray-300"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {incident.statut ===
                            "TRAITE" ? (
                              <CheckCircle2
                                size={18}
                                className="shrink-0 text-green-600"
                              />
                            ) : (
                              <AlertTriangle
                                size={18}
                                className="shrink-0 text-orange-600"
                              />
                            )}

                            <span
                              className={[
                                "rounded-full px-2.5 py-1 text-xs font-semibold",
                                incident.statut ===
                                "TRAITE"
                                  ? "bg-green-50 text-green-700"
                                  : "bg-orange-50 text-orange-700",
                              ].join(" ")}
                            >
                              {incident.statut ===
                              "TRAITE"
                                ? "Traité"
                                : "Ouvert"}
                            </span>
                          </div>

                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                            {
                              incident.description
                            }
                          </p>
                        </div>

                        <p className="shrink-0 text-xs text-gray-400">
                          {formatDate(
                            incident.dateCreation
                          )}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-3 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                        <span>
                          {obtenirNomMission(
                            incident.id_mission
                          )}
                        </span>

                        {incident.latitude !==
                          null &&
                          incident.latitude !==
                            undefined &&
                          incident.longitude !==
                            null &&
                          incident.longitude !==
                            undefined && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin
                                size={14}
                              />
                              {
                                incident.latitude
                              }
                              ,{" "}
                              {
                                incident.longitude
                              }
                            </span>
                          )}
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Signalements;