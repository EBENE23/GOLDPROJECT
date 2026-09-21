import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  RefreshCw,
  Trash2,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  obtenirDonneesRapport,
  calculerStatistiquesRapport,
  obtenirInterventionsRecentes,
} from "../../services/rapportService";

import type {
  RapportBac,
  RapportIntervention,
  RapportZone,
} from "../../services/rapportService";
import { obtenirCouleurNiveauBac } from "../../utils/bacLevel";
import FiltreDates from "../../components/ui/FiltreDates";
import { dansPlage, joursEnArriere, libellePlage, type PlageDates } from "../../utils/plageDates";

const formatNumber = (value: number) =>
  new Intl.NumberFormat("fr-FR").format(value);

const formatDate = (value?: string | null) => {
  if (!value) {
    return "Date inconnue";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export default function Rapports() {
  const [bacs, setBacs] = useState<RapportBac[]>([]);
  const [interventions, setInterventions] = useState<
    RapportIntervention[]
  >([]);
  const [zones, setZones] = useState<RapportZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [periode, setPeriode] = useState<PlageDates>(() => joursEnArriere(30));
  const [error, setError] = useState("");

  const loadData = useCallback(async (manual = false) => {
    try {
      if (manual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const donnees = await obtenirDonneesRapport();

      setBacs(donnees.bacs);
      setInterventions(donnees.interventions);
      setZones(donnees.zones);
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
        (requestError instanceof Error
          ? requestError.message
          : "Impossible de charger les données du rapport.");

      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const interventionsPeriode = useMemo(() => {
    return interventions.filter((intervention) =>
      dansPlage(intervention.dateCreation, periode)
    );
  }, [interventions, periode]);

  const stats = useMemo(() => {
    return calculerStatistiquesRapport(
      bacs,
      interventionsPeriode,
      zones
    );
  }, [bacs, interventionsPeriode, zones]);

  const stateData = useMemo(
    () => [
      {
        name: "Normal",
        value: stats.bacsNormaux,
      },
      {
        name: "Alerte",
        value: stats.bacsAlerte,
      },
      {
        name: "Plein",
        value: stats.bacsPleins,
      },
    ],
    [stats]
  );

  const interventionData = useMemo(
    () => [
      {
        name: "En attente",
        value: stats.interventionsEnAttente,
      },
      {
        name: "Planifiées",
        value: stats.interventionsPlanifiees,
      },
      {
        name: "En cours",
        value: stats.interventionsEnCours,
      },
      {
        name: "Terminées",
        value: stats.interventionsTerminees,
      },
      {
        name: "Annulées",
        value: stats.interventionsAnnulees,
      },
    ],
    [stats]
  );

  const zoneData = useMemo(() => {
    return zones.map((zone) => {
      const zoneBacs = bacs.filter(
        (bac) => bac.id_zone === zone.idZone
      );

      const niveaux = zoneBacs
        .map((bac) => Number(bac.niveau_remplissage))
        .filter((niveau) => Number.isFinite(niveau));

      const moyenne =
        niveaux.length > 0
          ? niveaux.reduce(
              (total, niveau) => total + niveau,
              0
            ) / niveaux.length
          : 0;

      return {
        name: zone.nomZone,
        niveau: Number(moyenne.toFixed(1)),
        bacs: zoneBacs.length,
        color: obtenirCouleurNiveauBac(moyenne),
      };
    });
  }, [bacs, zones]);

  const interventionsRecentes = useMemo(() => {
    return obtenirInterventionsRecentes(
      interventionsPeriode,
      8
    );
  }, [interventionsPeriode]);

  const generateReport = () => {
    const dateGeneration =
      new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date());

    const contenu = [
      "SMARTCITYWASTE — RAPPORT DE SUPERVISION",
      "",
      `Date de génération : ${dateGeneration}`,
      `Période sélectionnée : ${libellePlage(periode)}`,
      "",
      "INDICATEURS GÉNÉRAUX",
      `Nombre total de zones : ${stats.totalZones}`,
      `Nombre total de bacs : ${stats.totalBacs}`,
      `Bacs normaux : ${stats.bacsNormaux}`,
      `Bacs en alerte : ${stats.bacsAlerte}`,
      `Bacs pleins : ${stats.bacsPleins}`,
      `Niveau moyen actuel des bacs : ${stats.remplissageMoyen.toFixed(
        1
      )} %`,
      "",
      "INTERVENTIONS SUR LA PÉRIODE",
      `Total : ${stats.totalInterventions}`,
      `En attente : ${stats.interventionsEnAttente}`,
      `Planifiées : ${stats.interventionsPlanifiees}`,
      `En cours : ${stats.interventionsEnCours}`,
      `Terminées : ${stats.interventionsTerminees}`,
      `Annulées : ${stats.interventionsAnnulees}`,
      "",
      "PRIORITÉS DES INTERVENTIONS",
      `Normales : ${stats.interventionsNormales}`,
      `Moyennes : ${stats.interventionsMoyennes}`,
      `Hautes : ${stats.interventionsHautes}`,
      `Critiques : ${stats.interventionsCritiques}`,
      "",
      "NIVEAU MOYEN PAR ZONE",
      ...zoneData.map(
        (zone) =>
          `${zone.name} : ${zone.niveau}% (${zone.bacs} bac(s))`
      ),
      "",
      "INTERVENTIONS RÉCENTES",
      ...interventionsRecentes.map(
        (intervention) =>
          `#${intervention.idIntervention} - Bac ${intervention.id_bac} - ${
            intervention.statut
          } - ${intervention.priorite} - ${formatDate(
            intervention.dateCreation
          )}`
      ),
    ].join("\n");

    const blob = new Blob([contenu], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `smartcitywaste-rapport-${new Date()
      .toISOString()
      .slice(0, 10)}.txt`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div>
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-sm text-slate-500 shadow-sm">
          Génération des indicateurs...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div >
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
              <BarChart3 size={16} />
              Administration
            </div>

            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Rapports & statistiques
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Analyse synthétique de l'activité de SmartCityWaste.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              title="Actualiser"
            >
              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
            </button>

            <button
              type="button"
              onClick={generateReport}
              disabled={interventionsPeriode.length === 0}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={17} />
              <span className="hidden sm:inline">
                Exporter
              </span>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <FiltreDates valeur={periode} onChange={setPeriode} libelle="Période du rapport" />
        </div>


        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">
              <p className="font-semibold">
                Impossible de charger les données
              </p>

              <p className="mt-1">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadData(true)}
              className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
            >
              Réessayer
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <Activity
              className="mb-3 text-blue-600"
              size={19}
            />

            <p className="text-xs text-slate-500">
              Bacs
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatNumber(stats.totalBacs)}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
            <CheckCircle2
              className="mb-3 text-emerald-600"
              size={19}
            />

            <p className="text-xs text-slate-500">
              Normaux
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatNumber(stats.bacsNormaux)}
            </p>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
            <AlertTriangle
              className="mb-3 text-orange-600"
              size={19}
            />

            <p className="text-xs text-slate-500">
              Alertes
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatNumber(stats.bacsAlerte)}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm">
            <Trash2
              className="mb-3 text-red-600"
              size={19}
            />

            <p className="text-xs text-slate-500">
              Pleins
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatNumber(stats.bacsPleins)}
            </p>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
            <CalendarDays
              className="mb-3 text-violet-600"
              size={19}
            />

            <p className="text-xs text-slate-500">
              Interventions
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatNumber(
                stats.totalInterventions
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
            <TrendingUp
              className="mb-3 text-blue-600"
              size={19}
            />

            <p className="text-xs text-slate-500">
              Niveau moyen
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {stats.remplissageMoyen.toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="font-bold text-slate-900">
                Niveau moyen par zone
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Comparaison du remplissage actuel des bacs.
              </p>
            </div>

            <div className="h-[300px]">
              {zoneData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  Aucune donnée de zone.
                </div>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart data={zoneData}>
                    <CartesianGrid
                      vertical={false}
                    />

                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      unit="%"
                    />

                    <Tooltip />

                    <Bar
                      dataKey="niveau"
                      radius={[
                        7,
                        7,
                        0,
                        0,
                      ]}
                    >
                      {zoneData.map((zone) => (
                        <Cell key={zone.name} fill={zone.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="font-bold text-slate-900">
                État des bacs
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Répartition selon leur niveau actuel.
              </p>
            </div>

            <div className="h-[300px]">
              {bacs.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  Aucun bac enregistré.
                </div>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>
                    <Pie
                      data={stateData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={72}
                      outerRadius={105}
                      paddingAngle={4}
                    >
                      {stateData.map(
                        (entry, index) => (
                          <Cell
                            key={`${entry.name}-${index}`}
                            fill={
                              index === 0
                                ? "#10b981"
                                : index === 1
                                  ? "#f59e0b"
                                  : "#ef4444"
                            }
                          />
                        )
                      )}
                    </Pie>

                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {stateData.map(
                (item, index) => (
                  <div
                    key={item.name}
                    className="rounded-xl bg-slate-50 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          index === 0
                            ? "bg-emerald-500"
                            : index === 1
                              ? "bg-orange-500"
                              : "bg-red-500"
                        }`}
                      />

                      <span className="text-[10px] font-semibold text-slate-500">
                        {item.name}
                      </span>
                    </div>

                    <p className="mt-1 text-lg font-bold text-slate-800">
                      {item.value}
                    </p>
                  </div>
                )
              )}
            </div>
          </section>
        </div>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="font-bold text-slate-900">
              Activité des interventions
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Interventions créées pendant les{" "}
              {libellePlage(periode)}.
            </p>
          </div>

          <div className="h-[280px]">
            {interventionsPeriode.length ===
            0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Aucune intervention sur cette période.
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart data={interventionData}>
                  <CartesianGrid
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="value"
                    radius={[
                      7,
                      7,
                      0,
                      0,
                    ]}
                    fill="#0f766e"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-bold text-slate-900">
                Interventions récentes
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Dernières opérations de la période sélectionnée.
              </p>
            </div>

            <FileText
              size={19}
              className="text-slate-400"
            />
          </div>

          <div className="divide-y divide-slate-100">
            {interventionsRecentes.length ===
            0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Aucune intervention enregistrée sur cette période.
              </div>
            ) : (
              interventionsRecentes.map(
                (item) => (
                  <div
                    key={
                      item.idIntervention
                    }
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <CalendarDays
                          size={17}
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800">
                          {item.bac
                            ?.reference ||
                            `Bac #${item.id_bac}`}
                        </p>

                        <p className="truncate text-xs text-slate-500">
                          {item.motif ||
                            "Intervention de collecte"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <div className="text-right">
                        <p className="text-xs font-medium text-slate-400">
                          {formatDate(
                            item.dateCreation
                          )}
                        </p>

                        <p className="mt-1 text-xs font-bold text-slate-700">
                          {item.priorite}
                        </p>
                      </div>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600">
                        {item.statut.replaceAll(
                          "_",
                          " "
                        )}
                      </span>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </section>
      </div>
    </div>
  );
}