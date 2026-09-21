import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ClipboardList,
  Eye,
  MapPin,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  listerBacsSuperviseur,
  type Bac,
} from "../../services/superviseurService";
import {
  obtenirClasseFondNiveauBac,
  SEUIL_ALERTE,
} from "../../utils/bacLevel";

const Bacs = () => {
  const navigate = useNavigate();

  const [bacs, setBacs] = useState<Bac[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bacSelectionne, setBacSelectionne] =
    useState<Bac | null>(null);

  const chargerBacs = async () => {
    try {
      setLoading(true);
      setError("");

      const resultat = await listerBacsSuperviseur();

      setBacs(resultat.bacs);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "Impossible de charger les bacs."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerBacs();
  }, []);

  const bacsFiltres = bacs.filter((bac) => {
    const recherche = search.toLowerCase().trim();

    return (
      bac.reference.toLowerCase().includes(recherche) ||
      bac.etat.toLowerCase().includes(recherche)
    );
  });

  const getEtatClasse = (etat: Bac["etat"]) => {
    if (etat === "PLEIN") {
      return "bg-red-50 text-red-700";
    }

    if (etat === "ALERTE") {
      return "bg-orange-50 text-orange-700";
    }

    return "bg-green-50 text-green-700";
  };

  const getEtatTexte = (etat: Bac["etat"]) => {
    if (etat === "PLEIN") {
      return "CRITIQUE";
    }

    return etat;
  };

  const ouvrirDetails = (bac: Bac) => {
    setBacSelectionne(bac);
  };

  const fermerDetails = () => {
    setBacSelectionne(null);
  };

  const allerAuxInterventions = () => {
    if (!bacSelectionne) {
      return;
    }

    navigate(
      `/superviseur/interventions?bac=${bacSelectionne.id_bac}`
    );

    setBacSelectionne(null);
  };

  const voirPosition = () => {
    if (!bacSelectionne) {
      return;
    }

    const positionDisponible =
      bacSelectionne.latitude !== null &&
      bacSelectionne.latitude !== undefined &&
      bacSelectionne.longitude !== null &&
      bacSelectionne.longitude !== undefined;

    if (!positionDisponible) {
      setError(
        `Aucune position GPS n'est disponible pour le bac ${bacSelectionne.reference}.`
      );

      return;
    }

    navigate(
      `/superviseur/localisation?bac=${bacSelectionne.id_bac}`
    );

    setBacSelectionne(null);
  };

  return (
    <div className="relative space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Mes bacs
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Consultez l'état des bacs de votre zone.
          </p>
        </div>

        <button
          type="button"
          onClick={chargerBacs}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />

          Actualiser
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Rechercher un bac..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100"
            />
          </div>
        </div>

        {error && (
          <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">
              Chargement des bacs...
            </div>
          ) : bacsFiltres.length === 0 ? (
            <div className="p-8 text-center">
              <Trash2
                size={30}
                className="mx-auto text-gray-300"
              />

              <p className="mt-3 text-sm text-gray-500">
                Aucun bac trouvé.
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-4">
                    Référence
                  </th>

                  <th className="px-6 py-4">
                    Remplissage
                  </th>

                  <th className="px-6 py-4">
                    État
                  </th>

                  <th className="px-6 py-4">
                    Localisation
                  </th>

                  <th className="px-6 py-4">
                    Seuil
                  </th>

                  <th className="px-6 py-4">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {bacsFiltres.map((bac) => {
                  const niveau = Math.max(
                    0,
                    Math.min(
                      100,
                      Number(bac.niveau_remplissage || 0)
                    )
                  );

                  const positionDisponible =
                    bac.latitude !== null &&
                    bac.latitude !== undefined &&
                    bac.longitude !== null &&
                    bac.longitude !== undefined;

                  return (
                    <tr
                      key={bac.id_bac}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-green-50 p-2">
                            <Trash2
                              size={17}
                              className="text-green-700"
                            />
                          </div>

                          <span className="font-semibold text-gray-800">
                            {bac.reference}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="w-40">
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="text-gray-500">
                              Niveau
                            </span>

                            <span className="font-semibold text-gray-700">
                              {niveau}%
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full ${obtenirClasseFondNiveauBac(
                                niveau
                              )}`}
                              style={{
                                width: `${niveau}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${getEtatClasse(
                            bac.etat
                          )}`}
                        >
                          {bac.etat === "NORMAL" && (
                            <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                          )}

                          {bac.etat === "ALERTE" && (
                            <AlertTriangle size={13} />
                          )}

                          {bac.etat === "PLEIN" && (
                            <AlertTriangle size={13} />
                          )}

                          {getEtatTexte(bac.etat)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {positionDisponible ? (
                          <div>
                            <p className="font-medium text-gray-700">
                              {bac.latitude}, {bac.longitude}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              Position GPS disponible
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400">
                            Non renseignée
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {SEUIL_ALERTE}%
                      </td>

                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            ouvrirDetails(bac)
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                        >
                          <Eye size={15} />
                          Détails
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {bacSelectionne && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/40 p-4">
          <button
            type="button"
            aria-label="Fermer"
            onClick={fermerDetails}
            className="absolute inset-0 cursor-default"
          />

          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-green-50 p-3">
                  <Trash2
                    size={20}
                    className="text-green-700"
                  />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {bacSelectionne.reference}
                  </h2>

                  <p className="mt-0.5 text-xs text-gray-500">
                    Informations du bac
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={fermerDetails}
                className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">
                    Remplissage
                  </p>

                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {Number(
                      bacSelectionne.niveau_remplissage ||
                        0
                    )}
                    %
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">
                    État
                  </p>

                  <span
                    className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getEtatClasse(
                      bacSelectionne.etat
                    )}`}
                  >
                    {getEtatTexte(
                      bacSelectionne.etat
                    )}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-white">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <span className="text-sm text-gray-500">
                    Zone
                  </span>

                  <span className="text-sm font-semibold text-gray-800">
                    {bacSelectionne.zone?.nomZone ||
                      "Non renseignée"}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <span className="text-sm text-gray-500">
                    Seuil d'alerte
                  </span>

                  <span className="text-sm font-semibold text-gray-800">
                    {SEUIL_ALERTE}%
                  </span>
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-500">
                    Position GPS
                  </span>

                  <span className="max-w-[190px] text-right text-xs font-medium text-gray-700">
                    {bacSelectionne.latitude !==
                      null &&
                    bacSelectionne.latitude !==
                      undefined &&
                    bacSelectionne.longitude !==
                      null &&
                    bacSelectionne.longitude !==
                      undefined
                      ? `${bacSelectionne.latitude}, ${bacSelectionne.longitude}`
                      : "Non renseignée"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={allerAuxInterventions}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  <ClipboardList size={18} />
                  Interventions
                </button>

                <button
                  type="button"
                  onClick={voirPosition}
                  disabled={
                    bacSelectionne.latitude ===
                      null ||
                    bacSelectionne.latitude ===
                      undefined ||
                    bacSelectionne.longitude ===
                      null ||
                    bacSelectionne.longitude ===
                      undefined
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <MapPin size={18} />
                  Voir la position
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bacs;