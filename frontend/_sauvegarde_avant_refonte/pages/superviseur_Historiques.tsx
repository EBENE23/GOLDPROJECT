import { useCallback, useEffect, useMemo, useState } from "react";
import {
  History,
  RefreshCw,
  Search,
  TrendingUp,
} from "lucide-react";
import api from "../../services/api";

interface Bac {
  id_bac: number;
  reference: string;
  niveau_remplissage: number | string;
  etat: "NORMAL" | "ALERTE" | "PLEIN";
}

interface Mesure {
  idMesure: number;
  distance?: number | string | null;
  niveau?: number | string | null;
  pourcentage?: number | string | null;
  dateMesure?: string | null;
  qualiteMesure?: string | null;
}

interface BacsResponse {
  zone?: {
    idZone: number;
    nomZone: string;
    description?: string | null;
  };
  total?: number;
  bacs: Bac[];
}

interface MesuresResponse {
  bac?: Bac;
  total?: number;
  mesures: Mesure[];
}

const formatDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Non disponible";

export default function Historiques() {
  const [bacs, setBacs] = useState<Bac[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [mesures, setMesures] = useState<Mesure[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadBacs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<BacsResponse>(
        "/superviseur/bacs"
      );

      const available = Array.isArray(response.data?.bacs)
        ? response.data.bacs
        : [];

      setBacs(available);

      if (
        !selectedId &&
        available.length > 0
      ) {
        setSelectedId(
          String(available[0].id_bac)
        );
      }

      if (
        selectedId &&
        !available.some(
          (bac) =>
            String(bac.id_bac) === selectedId
        )
      ) {
        setSelectedId(
          available.length > 0
            ? String(available[0].id_bac)
            : ""
        );
      }
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "Impossible de charger les bacs."
      );

      setBacs([]);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  const loadHistory = useCallback(
    async (id: string) => {
      if (!id) {
        setMesures([]);
        return;
      }

      try {
        setLoadingHistory(true);
        setError("");

        const response =
          await api.get<MesuresResponse>(
            `/mesures/bac/${id}/historique`
          );

        setMesures(
          Array.isArray(response.data?.mesures)
            ? response.data.mesures
            : []
        );
      } catch (err: any) {
        console.error(err);

        setError(
          err?.response?.data?.message ||
            "Impossible de charger l'historique."
        );

        setMesures([]);
      } finally {
        setLoadingHistory(false);
      }
    },
    []
  );

  const refresh = async () => {
    try {
      setRefreshing(true);
      setError("");

      await loadBacs();

      if (selectedId) {
        await loadHistory(selectedId);
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBacs();
  }, [loadBacs]);

  useEffect(() => {
    loadHistory(selectedId);
  }, [selectedId, loadHistory]);

  const filteredBacs = useMemo(() => {
    const term = search.trim().toLowerCase();

    return bacs.filter(
      (bac) =>
        !term ||
        bac.reference
          .toLowerCase()
          .includes(term)
    );
  }, [bacs, search]);

  const selectedBac = useMemo(
    () =>
      bacs.find(
        (bac) =>
          String(bac.id_bac) === selectedId
      ),
    [bacs, selectedId]
  );

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-600">
              Supervision des données
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Historiques des bacs
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Consultez les mesures transmises par le
              système IoT.
            </p>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={
              refreshing ||
              loading ||
              loadingHistory
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
        </header>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Rechercher un bac..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto">
              {loading ? (
                <p className="p-4 text-sm text-slate-500">
                  Chargement...
                </p>
              ) : filteredBacs.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">
                  Aucun bac trouvé.
                </p>
              ) : (
                filteredBacs.map((bac) => (
                  <button
                    key={bac.id_bac}
                    type="button"
                    onClick={() =>
                      setSelectedId(
                        String(bac.id_bac)
                      )
                    }
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      selectedId ===
                      String(bac.id_bac)
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-100 hover:border-emerald-200 hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-sm font-bold text-slate-800">
                      {bac.reference}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {Math.round(
                        Number(
                          bac.niveau_remplissage
                        ) || 0
                      )}
                      % · {bac.etat}
                    </p>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  Historique IoT
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {selectedBac?.reference ||
                    "Sélectionnez un bac"}
                </h2>
              </div>

              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                <TrendingUp size={20} />
              </div>
            </div>

            {loadingHistory ? (
              <div className="p-10 text-center text-sm text-slate-500">
                Chargement des mesures...
              </div>
            ) : mesures.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                <History
                  className="mx-auto mb-2 text-slate-300"
                  size={28}
                />

                Aucune mesure disponible pour ce bac.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3">
                        Date
                      </th>

                      <th className="px-5 py-3">
                        Niveau
                      </th>

                      <th className="px-5 py-3">
                        Pourcentage
                      </th>

                      <th className="px-5 py-3">
                        Qualité
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {mesures.map((mesure) => (
                      <tr
                        key={
                          mesure.idMesure
                        }
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-3 text-slate-600">
                          {formatDate(
                            mesure.dateMesure
                          )}
                        </td>

                        <td className="px-5 py-3 font-semibold text-slate-800">
                          {mesure.niveau ??
                            "—"}
                        </td>

                        <td className="px-5 py-3 font-bold text-emerald-700">
                          {mesure.pourcentage ??
                            "—"}
                          %
                        </td>

                        <td className="px-5 py-3 text-slate-500">
                          {mesure.qualiteMesure ||
                            "Non renseignée"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}