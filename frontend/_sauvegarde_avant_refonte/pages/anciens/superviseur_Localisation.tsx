import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  MapPin,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Marker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { iconeBac } from "../../components/map/iconesCarte";
import { toast } from "react-toastify";

import {
  obtenirLocalisationBacs,
  type Bac,
} from "../../services/superviseurService";
import { obtenirCategorieNiveauBac, SEUIL_ALERTE } from "../../utils/bacLevel";

const CENTRE_YAOUNDE: [number, number] = [
  3.848,
  11.502,
];

const obtenirEtatLibelle = (
  etat: Bac["etat"]
) => {
  switch (etat) {
    case "NORMAL":
      return "Normal";

    case "ALERTE":
      return "Alerte";

    case "PLEIN":
      return "Critique";

    default:
      return "Inconnu";
  }
};

const obtenirEtatStyle = (
  niveau: number | string
) => {
  switch (obtenirCategorieNiveauBac(niveau)) {
    case "NORMAL":
      return {
        badge:
          "border-green-200 bg-green-50 text-green-700",
        marker: "#16a34a",
        remplissage: "bg-green-600",
      };

    case "ALERTE":
      return {
        badge:
          "border-orange-200 bg-orange-50 text-orange-700",
        marker: "#f97316",
        remplissage: "bg-orange-500",
      };

    case "PLEIN":
      return {
        badge:
          "border-red-200 bg-red-50 text-red-700",
        marker: "#dc2626",
        remplissage: "bg-red-600",
      };

    default:
      return {
        badge:
          "border-gray-200 bg-gray-50 text-gray-700",
        marker: "#6b7280",
        remplissage: "bg-gray-500",
      };
  }
};

const obtenirCoordonnees = (
  bac: Bac
): [number, number] | null => {
  if (
    bac.latitude === null ||
    bac.latitude === undefined ||
    bac.longitude === null ||
    bac.longitude === undefined
  ) {
    return null;
  }

  const latitude = Number(bac.latitude);
  const longitude = Number(bac.longitude);

  if (
    Number.isNaN(latitude) ||
    Number.isNaN(longitude)
  ) {
    return null;
  }

  if (
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return [latitude, longitude];
};

const AjusterVueCarte = ({
  bacs,
  bacSelectionne,
}: {
  bacs: Bac[];
  bacSelectionne: Bac | null;
}) => {
  const map = useMap();

  useEffect(() => {
    if (bacSelectionne) {
      const coordonnees =
        obtenirCoordonnees(
          bacSelectionne
        );

      if (coordonnees) {
        map.flyTo(
          coordonnees,
          17,
          {
            duration: 1.2,
          }
        );

        return;
      }
    }

    const coordonnees = bacs
      .map(obtenirCoordonnees)
      .filter(
        (
          coordonnee
        ): coordonnee is [number, number] =>
          coordonnee !== null
      );

    if (coordonnees.length === 0) {
      map.setView(
        CENTRE_YAOUNDE,
        12
      );

      return;
    }

    if (coordonnees.length === 1) {
      map.setView(
        coordonnees[0],
        16
      );

      return;
    }

    const latitudes =
      coordonnees.map(
        ([latitude]) => latitude
      );

    const longitudes =
      coordonnees.map(
        ([, longitude]) => longitude
      );

    map.fitBounds(
      [
        [
          Math.min(...latitudes),
          Math.min(...longitudes),
        ],
        [
          Math.max(...latitudes),
          Math.max(...longitudes),
        ],
      ],
      {
        padding: [50, 50],
        maxZoom: 16,
      }
    );
  }, [
    bacs,
    bacSelectionne,
    map,
  ]);

  return null;
};

const Localisation = () => {
  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  const [bacs, setBacs] =
    useState<Bac[]>([]);

  const [zoneNom, setZoneNom] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [bacSelectionne, setBacSelectionne] =
    useState<Bac | null>(null);

  const bacIdParam =
    searchParams.get("bac");

  const bacIdSelectionne =
    bacIdParam
      ? Number(bacIdParam)
      : null;

  const chargerLocalisation =
    async (
      afficherSucces = false
    ) => {
      try {
        setError("");

        if (bacs.length > 0) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const resultat =
          await obtenirLocalisationBacs();

        const listeBacs =
          Array.isArray(resultat.bacs)
            ? resultat.bacs
            : [];

        setBacs(listeBacs);

        setZoneNom(
          resultat.zone?.nomZone || ""
        );

        if (
          bacIdSelectionne !== null
        ) {
          const bac =
            listeBacs.find(
              (item) =>
                item.id_bac ===
                bacIdSelectionne
            );

          if (bac) {
            setBacSelectionne(bac);
          }
        }

        if (afficherSucces) {
          toast.success(
            "Localisation des bacs actualisée.",
            {
              autoClose: 2500,
            }
          );
        }
      } catch (err: any) {
        console.error(
          "Erreur localisation bacs :",
          err
        );

        const message =
          err?.response?.data?.message ||
          "Impossible de charger les localisations.";

        setError(message);

        toast.error(
          message,
          {
            autoClose: 4500,
          }
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

  useEffect(() => {
    chargerLocalisation();

    const interval =
      setInterval(() => {
        chargerLocalisation(false);
      }, 15000);

    return () => {
      clearInterval(interval);
    };
  }, [bacIdSelectionne]);

  useEffect(() => {
    if (
      bacIdSelectionne === null
    ) {
      setBacSelectionne(null);
      return;
    }

    if (bacs.length === 0) {
      return;
    }

    const bac =
      bacs.find(
        (item) =>
          item.id_bac ===
          bacIdSelectionne
      );

    if (bac) {
      setBacSelectionne(bac);
    } else {
      toast.error(
        "Le bac sélectionné est introuvable dans votre zone.",
        {
          autoClose: 4000,
        }
      );
    }
  }, [
    bacIdSelectionne,
    bacs,
  ]);

  const statistiques =
    useMemo(() => {
      return {
        total: bacs.length,

        normaux: bacs.filter(
          (bac) =>
            bac.etat === "NORMAL"
        ).length,

        alertes: bacs.filter(
          (bac) =>
            bac.etat === "ALERTE"
        ).length,

        critiques: bacs.filter(
          (bac) =>
            bac.etat === "PLEIN"
        ).length,

        localises: bacs.filter(
          (bac) =>
            obtenirCoordonnees(
              bac
            ) !== null
        ).length,
      };
    }, [bacs]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="h-7 w-56 animate-pulse rounded-lg bg-gray-200" />

            <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-gray-200" />
          </div>

          <div className="h-11 w-32 animate-pulse rounded-xl bg-gray-200" />
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({
            length: 4,
          }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-2xl bg-gray-200"
            />
          ))}
        </div>

        <div className="h-[500px] animate-pulse rounded-2xl bg-gray-200" />
      </div>
    );
  }

  if (
    error &&
    bacs.length === 0
  ) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Localisation des bacs
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Impossible d'afficher la carte.
          </p>
        </div>

        <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <XCircle
            size={40}
            className="text-red-500"
          />

          <h2 className="mt-4 text-lg font-semibold text-red-800">
            Erreur de chargement
          </h2>

          <p className="mt-2 max-w-md text-sm text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              chargerLocalisation(
                true
              )
            }
            disabled={refreshing}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={
                refreshing
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

  return (
    <div className="relative space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Localisation des bacs
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Supervision géographique des bacs
            {zoneNom && (
              <>
                {" "}
                de la zone{" "}
                <span className="font-semibold text-gray-700">
                  {zoneNom}
                </span>
              </>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            chargerLocalisation(
              true
            )
          }
          disabled={refreshing}
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

      {bacSelectionne && (
        <div className="flex flex-col gap-4 rounded-2xl border border-green-200 bg-green-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white p-2.5 shadow-sm">
              <MapPin
                size={20}
                className="text-green-600"
              />
            </div>

            <div>
              <p className="text-sm font-bold text-green-900">
                Bac sélectionné :{" "}
                {bacSelectionne.reference}
              </p>

              <p className="mt-1 text-xs text-green-700">
                La carte est centrée sur la position du bac.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setBacSelectionne(
                null
              );

              navigate(
                "/superviseur/localisation"
              );
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100"
          >
            Voir tous les bacs
          </button>
        </div>
      )}

      {error &&
        bacs.length > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-800">
                Actualisation partielle
              </p>

              <p className="mt-1 text-sm text-orange-700">
                Les dernières positions disponibles sont affichées.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                chargerLocalisation(
                  true
                )
              }
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-orange-700 transition hover:bg-orange-100 disabled:opacity-50"
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">
            Total des bacs
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {statistiques.total}
          </p>
        </div>

        <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2
              size={17}
              className="text-green-600"
            />

            <p className="text-xs font-medium text-green-700">
              Normaux
            </p>
          </div>

          <p className="mt-2 text-2xl font-bold text-green-800">
            {statistiques.normaux}
          </p>
        </div>

        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle
              size={17}
              className="text-orange-600"
            />

            <p className="text-xs font-medium text-orange-700">
              Alertes
            </p>
          </div>

          <p className="mt-2 text-2xl font-bold text-orange-800">
            {statistiques.alertes}
          </p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <XCircle
              size={17}
              className="text-red-600"
            />

            <p className="text-xs font-medium text-red-700">
              Critiques
            </p>
          </div>

          <p className="mt-2 text-2xl font-bold text-red-800">
            {statistiques.critiques}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-blue-50 p-3">
                <MapPin
                  size={21}
                  className="text-blue-600"
                />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Carte des bacs
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Cliquez sur un bac pour consulter ses informations et créer une intervention.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-600" />

                <span className="text-gray-600">
                  Normal
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-orange-500" />

                <span className="text-gray-600">
                  Alerte
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-600" />

                <span className="text-gray-600">
                  Critique
                </span>
              </div>
            </div>
          </div>
        </div>

        {bacs.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center bg-gray-50 p-6 text-center">
            <MapPin
              size={40}
              className="text-gray-300"
            />

            <h3 className="mt-4 font-semibold text-gray-700">
              Aucun bac disponible
            </h3>

            <p className="mt-1 max-w-md text-sm text-gray-500">
              Aucun bac n'est actuellement associé à votre zone.
            </p>
          </div>
        ) : statistiques.localises ===
          0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center bg-gray-50 p-6 text-center">
            <MapPin
              size={40}
              className="text-gray-300"
            />

            <h3 className="mt-4 font-semibold text-gray-700">
              Aucune position disponible
            </h3>

            <p className="mt-1 max-w-md text-sm text-gray-500">
              Les bacs existent, mais aucune coordonnée GPS valide n'est actuellement disponible.
            </p>
          </div>
        ) : (
          <>
            <div className="h-[450px] w-full sm:h-[550px] lg:h-[650px]">
              <MapContainer
                center={
                  CENTRE_YAOUNDE
                }
                zoom={12}
                scrollWheelZoom
                className="z-0 h-full w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <AjusterVueCarte
                  bacs={bacs}
                  bacSelectionne={
                    bacSelectionne
                  }
                />

                {bacs.map((bac) => {
                  const coordonnees =
                    obtenirCoordonnees(
                      bac
                    );

                  if (!coordonnees) {
                    return null;
                  }

                  const niveau =
                    Math.max(
                      0,
                      Math.min(
                        100,
                        Number(
                          bac.niveau_remplissage ||
                            0
                        )
                      )
                    );

                  const styleEtat =
                    obtenirEtatStyle(
                      niveau
                    );

                  const selectionne =
                    bacSelectionne?.id_bac ===
                    bac.id_bac;

                  const iconeDuBac = iconeBac(niveau, selectionne);

                  return (
                    <Marker
                      key={bac.id_bac}
                      position={
                        coordonnees
                      }
                      icon={iconeDuBac}
                      eventHandlers={{
                        click: () => {
                          setBacSelectionne(
                            bac
                          );

                          navigate(
                            `/superviseur/interventions?bac=${bac.id_bac}&ouvrir=1`
                          );
                        },
                      }}
                    >
                      <Popup>
                        <div className="min-w-[240px]">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-gray-900">
                                {bac.reference}
                              </p>

                              <p className="mt-0.5 text-xs text-gray-500">
                                Bac #{bac.id_bac}
                              </p>
                            </div>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${styleEtat.badge}`}
                            >
                              {obtenirEtatLibelle(
                                bac.etat
                              )}
                            </span>
                          </div>

                          <div className="mt-4">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">
                                Remplissage
                              </span>

                              <span className="font-bold text-gray-800">
                                {niveau}%
                              </span>
                            </div>

                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                              <div
                                className={`h-full rounded-full ${styleEtat.remplissage}`}
                                style={{
                                  width: `${niveau}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="mt-4 space-y-1.5 text-xs text-gray-500">
                            <p>
                              Zone :{" "}
                              <span className="font-medium text-gray-700">
                                {bac.zone
                                  ?.nomZone ||
                                  zoneNom ||
                                  "Non renseignée"}
                              </span>
                            </p>

                            <p>
                              Latitude :{" "}
                              {coordonnees[0]}
                            </p>

                            <p>
                              Longitude :{" "}
                              {coordonnees[1]}
                            </p>

                            <p>
                              Seuil :{" "}
                              <span className="font-medium text-gray-700">
                                {SEUIL_ALERTE}%
                              </span>
                            </p>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/superviseur/interventions?bac=${bac.id_bac}&ouvrir=1`
                                )
                              }
                              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                            >
                              <ClipboardList
                                size={15}
                              />

                              Créer une intervention
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/superviseur/interventions?bac=${bac.id_bac}`
                                )
                              }
                              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-gray-800"
                            >
                              <ClipboardList
                                size={15}
                              />

                              Voir les interventions
                            </button>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>

            <div className="border-t border-gray-200 bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                {statistiques.localises} position(s) GPS affichée(s) sur{" "}
                {statistiques.total} bac(s).
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Localisation;