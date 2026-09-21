import { useEffect, useState } from "react";
import {
  AlertTriangle,
  RefreshCw,
  Trash2,
  MapPin,
} from "lucide-react";

import {
  obtenirAlertesSuperviseur,
  type Bac,
} from "../../services/superviseurService";
import { normaliserNiveauBac, SEUIL_ALERTE } from "../../utils/bacLevel";

const Alertes = () => {
  const [alertes, setAlertes] =
    useState<Bac[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const chargerAlertes = async () => {
    try {
      setLoading(true);
      setError("");

      const resultat =
        await obtenirAlertesSuperviseur();

      setAlertes(resultat.alertes);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "Impossible de charger les alertes."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerAlertes();

    const interval = setInterval(
      chargerAlertes,
      15000
    );

    return () => clearInterval(interval);
  }, []);

  const getPriorite = (
    bac: Bac
  ) => {
    const niveau = Number(
      bac.niveau_remplissage || 0
    );

    if (normaliserNiveauBac(niveau) > 80) {
      return {
        label: "Critique",
        classe:
          "bg-red-50 text-red-700 border-red-200",
      };
    }

    return {
      label: "Alerte",
      classe:
        "bg-orange-50 text-orange-700 border-orange-200",
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Alertes
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Bacs nécessitant une attention particulière.
          </p>
        </div>

        <button
          type="button"
          onClick={chargerAlertes}
          disabled={loading}
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
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total alertes
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {alertes.length}
          </p>
        </div>

        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
          <p className="text-sm text-orange-700">
            Bacs en alerte
          </p>

          <p className="mt-2 text-3xl font-bold text-orange-800">
            {
              alertes.filter(
                (bac) =>
                  bac.etat === "ALERTE"
              ).length
            }
          </p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <p className="text-sm text-red-700">
            Bacs pleins
          </p>

          <p className="mt-2 text-3xl font-bold text-red-800">
            {
              alertes.filter(
                (bac) =>
                  bac.etat === "PLEIN"
              ).length
            }
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-50 p-3">
              <AlertTriangle
                size={21}
                className="text-orange-600"
              />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Bacs à surveiller
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Les niveaux sont actualisés automatiquement.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">
            Chargement des alertes...
          </div>
        ) : alertes.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
              <Trash2
                size={25}
                className="text-green-600"
              />
            </div>

            <h3 className="mt-4 font-semibold text-gray-800">
              Aucune alerte
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Aucun bac de votre zone ne nécessite actuellement une intervention.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {alertes.map((bac) => {
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

              const priorite =
                getPriorite(bac);

              return (
                <div
                  key={bac.id_bac}
                  className="p-6 transition hover:bg-gray-50"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="rounded-xl bg-red-50 p-3">
                        <Trash2
                          size={22}
                          className="text-red-600"
                        />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {bac.reference}
                          </h3>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${priorite.classe}`}
                          >
                            {priorite.label}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span>
                            État :{" "}
                            <strong className="text-gray-700">
                              {bac.etat}
                            </strong>
                          </span>

                          <span>
                            Seuil :{" "}
                            <strong className="text-gray-700">
                              {SEUIL_ALERTE}%
                            </strong>
                          </span>
                        </div>

                        {bac.latitude &&
                          bac.longitude && (
                            <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
                              <MapPin
                                size={15}
                              />

                              <span>
                                {bac.latitude},{" "}
                                {bac.longitude}
                              </span>
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="w-full lg:w-72">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Niveau de remplissage
                        </span>

                        <span className="text-lg font-bold text-gray-900">
                          {niveau}%
                        </span>
                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-red-500 transition-all"
                          style={{
                            width: `${niveau}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Alertes;