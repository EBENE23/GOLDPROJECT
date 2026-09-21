import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
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
  obtenirLocalisationBacsAgent,
  type BacAgent,
  type LocalisationBacsAgent,
} from "../../services/agentService";
import {
  obtenirCouleurNiveauBac,
} from "../../utils/bacLevel";

const CENTRE_YAOUNDE: [number, number] = [3.848, 11.502];

const obtenirCoordonnees = (
  bac: BacAgent
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

const obtenirEtatLibelle = (
  etat: BacAgent["etat"]
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

const obtenirEtatCouleur = (
  niveau: number | string
) => {
  return obtenirCouleurNiveauBac(niveau);
};

const AjusterVueCarte = ({
  bacs,
  bacSelectionne,
}: {
  bacs: BacAgent[];
  bacSelectionne: BacAgent | null;
}) => {
  const map = useMap();

  useEffect(() => {
    if (bacSelectionne) {
      const coordonnees = obtenirCoordonnees(
        bacSelectionne
      );

      if (coordonnees) {
        map.flyTo(coordonnees, 17, {
          duration: 1.2,
        });

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
      map.setView(CENTRE_YAOUNDE, 12);
      return;
    }

    if (coordonnees.length === 1) {
      map.setView(coordonnees[0], 16);
      return;
    }

    const latitudes = coordonnees.map(
      ([latitude]) => latitude
    );

    const longitudes = coordonnees.map(
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
        padding: [40, 40],
        maxZoom: 16,
      }
    );
  }, [bacs, bacSelectionne, map]);

  return null;
};

const Localisation = () => {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const [data, setData] =
    useState<LocalisationBacsAgent | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const bacIdParam =
    searchParams.get("bac");

  const bacIdSelectionne = bacIdParam
    ? Number(bacIdParam)
    : null;

  const chargerLocalisation = async (
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
        await obtenirLocalisationBacsAgent();

      setData(resultat);

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
        "Erreur localisation agent :",
        err
      );

      const message =
        err?.response?.data?.message ||
        "Impossible de charger la localisation des bacs.";

      setError(message);

      toast.error(message, {
        autoClose: 4500,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    chargerLocalisation();

    const interval = setInterval(() => {
      chargerLocalisation(false);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const bacs = data?.bacs ?? [];

  const bacSelectionne =
    bacIdSelectionne !== null
      ? bacs.find(
          (bac) =>
            bac.id_bac === bacIdSelectionne
        ) || null
      : null;

  const mettreAJourSelectionBac = (
    idBac: number | null
  ) => {
    setSearchParams((params) => {
      const next = new URLSearchParams(
        params
      );

      if (idBac === null) {
        next.delete("bac");
      } else {
        next.set("bac", String(idBac));
      }

      return next;
    });
  };

  useEffect(() => {
    if (
      bacIdSelectionne !== null &&
      data &&
      !bacSelectionne
    ) {
      toast.error(
        "Le bac sélectionné est introuvable dans votre zone.",
        {
          autoClose: 4000,
        }
      );
    }
  }, [
    bacIdSelectionne,
    data,
    bacSelectionne,
  ]);

  const statistiques = useMemo(() => {
    return {
      total: bacs.length,

      normaux: bacs.filter(
        (bac) => bac.etat === "NORMAL"
      ).length,

      alertes: bacs.filter(
        (bac) => bac.etat === "ALERTE"
      ).length,

      critiques: bacs.filter(
        (bac) => bac.etat === "PLEIN"
      ).length,

      localises: bacs.filter(
        (bac) =>
          obtenirCoordonnees(bac) !== null
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
          {Array.from({ length: 4 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-2xl bg-gray-200"
              />
            )
          )}
        </div>

        <div className="h-[500px] animate-pulse rounded-2xl bg-gray-200" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Localisation des bacs
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Visualisation géographique de votre zone.
          </p>
        </div>

        <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <XCircle
            size={42}
            className="text-red-500"
          />

          <h2 className="mt-4 text-lg font-semibold text-red-800">
            Impossible de charger la carte
          </h2>

          <p className="mt-2 max-w-md text-sm text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              chargerLocalisation(true)
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

  if (data && !data.zone) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Localisation des bacs
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Visualisation géographique de votre zone.
          </p>
        </div>

        <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-yellow-200 bg-yellow-50 p-6 text-center">
          <MapPin
            size={42}
            className="text-yellow-600"
          />

          <h2 className="mt-4 text-lg font-semibold text-yellow-800">
            Aucune zone affectée
          </h2>

          <p className="mt-2 max-w-md text-sm text-yellow-700">
            Votre compte agent n'est actuellement affecté à aucune zone.
            La carte des bacs sera disponible après votre affectation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Localisation des bacs
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Bacs de votre zone{" "}
            <span className="font-semibold text-gray-700">
              {data?.zone?.nomZone ||
                "non renseignée"}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            chargerLocalisation(true)
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
        <div className="flex flex-col gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white p-2.5">
              <MapPin
                size={19}
                className="text-green-600"
              />
            </div>

            <div>
              <p className="text-sm font-bold text-green-900">
                Bac sélectionné :{" "}
                {bacSelectionne.reference}
              </p>

              <p className="mt-1 text-xs text-green-700">
                La carte est centrée sur sa position GPS.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              window.history.pushState(
                {},
                "",
                "/agent/localisation"
              )
            }
            className="rounded-xl border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100"
          >
            Voir tous les bacs
          </button>
        </div>
      )}

      {error && (
        <div className="flex flex-col gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-orange-800">
              Actualisation impossible
            </p>

            <p className="mt-1 text-sm text-orange-700">
              Les dernières données disponibles sont conservées.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              chargerLocalisation(true)
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
            Total
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

            <span className="text-xs font-medium text-green-700">
              Normaux
            </span>
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

            <span className="text-xs font-medium text-orange-700">
              Alertes
            </span>
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

            <span className="text-xs font-medium text-red-700">
              Critiques
            </span>
          </div>

          <p className="mt-2 text-2xl font-bold text-red-800">
            {statistiques.critiques}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                Carte des bacs
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Les marqueurs indiquent l'état actuel des bacs.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
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
              size={42}
              className="text-gray-300"
            />

            <h3 className="mt-4 font-semibold text-gray-700">
              Aucun bac dans cette zone
            </h3>

            <p className="mt-1 max-w-md text-sm text-gray-500">
              Aucun bac n'est actuellement associé à votre zone d'affectation.
            </p>
          </div>
        ) : statistiques.localises === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center bg-gray-50 p-6 text-center">
            <MapPin
              size={42}
              className="text-gray-300"
            />

            <h3 className="mt-4 font-semibold text-gray-700">
              Aucune position GPS disponible
            </h3>

            <p className="mt-1 max-w-md text-sm text-gray-500">
              Les bacs existent, mais aucune coordonnée GPS valide n'est actuellement enregistrée.
            </p>
          </div>
        ) : (
          <>
            <div className="h-[450px] w-full sm:h-[550px] lg:h-[650px]">
              <MapContainer
                center={CENTRE_YAOUNDE}
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
                  bacSelectionne={bacSelectionne}
                />

                {bacs.map((bac) => {
                  const coordonnees =
                    obtenirCoordonnees(bac);

                  if (!coordonnees) {
                    return null;
                  }

                  const niveau = Math.max(
                    0,
                    Math.min(
                      100,
                      Number(
                        bac.niveau_remplissage ||
                          0
                      )
                    )
                  );

                  const couleur =
                    obtenirEtatCouleur(
                      niveau
                    );

                  const selectionne =
                    bacSelectionne?.id_bac ===
                    bac.id_bac;

                  return (
                    <Marker
                      key={bac.id_bac}
                      position={coordonnees}
                      icon={iconeBac(niveau, selectionne)}
                      eventHandlers={{
                        click: () => mettreAJourSelectionBac(bac.id_bac),
                      }}
                    >
                      <Popup>
                        <div className="min-w-[220px]">
                          <p className="text-sm font-bold text-gray-900">
                            {bac.reference}
                          </p>

                          {selectionne && (
                            <p className="mt-1 text-xs font-semibold text-green-600">
                              Bac sélectionné
                            </p>
                          )}

                          <p className="mt-1 text-xs text-gray-500">
                            Bac #{bac.id_bac}
                          </p>

                          <div className="mt-3">
                            <p className="text-xs text-gray-500">
                              État
                            </p>

                            <p
                              className="mt-1 text-sm font-semibold"
                              style={{
                                color: couleur,
                              }}
                            >
                              {obtenirEtatLibelle(
                                bac.etat
                              )}
                            </p>
                          </div>

                          <div className="mt-3">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">
                                Remplissage
                              </span>

                              <span className="font-bold text-gray-800">
                                {niveau}%
                              </span>
                            </div>

                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${niveau}%`,
                                  backgroundColor:
                                    couleur,
                                }}
                              />
                            </div>
                          </div>

                          <div className="mt-3 space-y-1 text-xs text-gray-500">
                            <p>
                              Latitude :{" "}
                              {coordonnees[0]}
                            </p>

                            <p>
                              Longitude :{" "}
                              {coordonnees[1]}
                            </p>
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