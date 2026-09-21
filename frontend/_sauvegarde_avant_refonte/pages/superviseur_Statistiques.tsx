import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  RefreshCw,
  Trash2,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  obtenirStatistiquesSuperviseur,
  type StatistiquesDetaillees,
} from "../../services/superviseurService";

const Statistiques = () => {
  const [statistiques, setStatistiques] =
    useState<StatistiquesDetaillees | null>(null);

  const [zoneNom, setZoneNom] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const chargerStatistiques = async () => {
    try {
      setLoading(true);
      setError("");

      const resultat =
        await obtenirStatistiquesSuperviseur();

      setStatistiques(
        resultat.statistiques
      );

      setZoneNom(
        resultat.zone?.nomZone || ""
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "Impossible de charger les statistiques."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerStatistiques();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-sm text-gray-500">
          Chargement des statistiques...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Statistiques
          </h1>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!statistiques) {
    return null;
  }

  const repartitionEtat = [
    {
      name: "Normaux",
      value:
        statistiques.repartitionEtat.NORMAL,
    },
    {
      name: "Alertes",
      value:
        statistiques.repartitionEtat.ALERTE,
    },
    {
      name: "Pleins",
      value:
        statistiques.repartitionEtat.PLEIN,
    },
  ];

  const repartitionInterventions = [
    {
      statut: "En attente",
      nombre:
        statistiques.repartitionInterventions
          .EN_ATTENTE,
    },
    {
      statut: "Planifiées",
      nombre:
        statistiques.repartitionInterventions
          .PLANIFIEE,
    },
    {
      statut: "En cours",
      nombre:
        statistiques.repartitionInterventions
          .EN_COURS,
    },
    {
      statut: "Terminées",
      nombre:
        statistiques.repartitionInterventions
          .TERMINEE,
    },
    {
      statut: "Annulées",
      nombre:
        statistiques.repartitionInterventions
          .ANNULEE,
    },
  ];

  const niveauxParBac =
    statistiques.parBac.map((bac) => ({
      reference: bac.reference,
      niveau: bac.niveau_actuel,
      moyenne: bac.moyenne_remplissage,
    }));

  const donneesResume = [
    {
      titre: "Bacs supervisés",
      valeur: statistiques.nombreBacs,
      icone: Trash2,
    },
    {
      titre: "Mesures enregistrées",
      valeur: statistiques.nombreMesures,
      icone: Activity,
    },
    {
      titre: "Interventions",
      valeur: statistiques.nombreInterventions,
      icone: BarChart3,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Statistiques
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Analyse des données de supervision
            {zoneNom && (
              <>
                {" "}
                de{" "}
                <span className="font-semibold text-gray-700">
                  {zoneNom}
                </span>
              </>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={chargerStatistiques}
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {donneesResume.map((element) => {
          const Icon = element.icone;

          return (
            <div
              key={element.titre}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    {element.titre}
                  </p>

                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {element.valeur}
                  </p>
                </div>

                <div className="rounded-xl bg-green-50 p-3">
                  <Icon
                    size={22}
                    className="text-green-700"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-50 p-3">
              <TrendingUp
                size={20}
                className="text-green-700"
              />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                État des bacs
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Répartition selon l'état actuel.
              </p>
            </div>
          </div>

          <div className="mt-6 h-[300px]">
            {statistiques.nombreBacs === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Aucun bac disponible.
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={repartitionEtat}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }) =>
                      `${name}: ${value}`
                    }
                  >
                    {repartitionEtat.map((item) => (
                      <Cell
                        key={item.name}
                        fill={
                          item.name === "Normaux"
                            ? "#16a34a"
                            : item.name === "Alertes"
                              ? "#f97316"
                              : "#dc2626"
                        }
                      />
                    ))}
                  </Pie>

                  <Tooltip />

                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="font-semibold text-gray-900">
              Interventions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Répartition des interventions par statut.
            </p>
          </div>

          <div className="mt-6 h-[300px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={repartitionInterventions}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="statut"
                  tick={{ fontSize: 11 }}
                />

                <YAxis
                  allowDecimals={false}
                />

                <Tooltip />

                <Legend />

                <Bar
                  dataKey="nombre"
                  name="Nombre"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="font-semibold text-gray-900">
            Niveau de remplissage par bac
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Comparaison entre le niveau actuel et la moyenne des mesures.
          </p>
        </div>

        <div className="mt-6 h-[360px]">
          {niveauxParBac.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              Aucune mesure disponible.
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={niveauxParBac}
                margin={{
                  top: 10,
                  right: 20,
                  left: 0,
                  bottom: 10,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="reference"
                  tick={{ fontSize: 11 }}
                />

                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) =>
                    `${value}%`
                  }
                />

                <Tooltip />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="niveau"
                  name="Niveau actuel"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />

                <Line
                  type="monotone"
                  dataKey="moyenne"
                  name="Moyenne"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900">
            Détail par bac
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Données calculées à partir des mesures enregistrées.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-4">
                  Bac
                </th>

                <th className="px-6 py-4">
                  État
                </th>

                <th className="px-6 py-4">
                  Niveau actuel
                </th>

                <th className="px-6 py-4">
                  Moyenne
                </th>

                <th className="px-6 py-4">
                  Mesures
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {statistiques.parBac.map(
                (bac) => (
                  <tr
                    key={bac.id_bac}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {bac.reference}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          bac.etat ===
                          "PLEIN"
                            ? "bg-red-50 text-red-700"
                            : bac.etat ===
                              "ALERTE"
                            ? "bg-orange-50 text-orange-700"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {bac.etat}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-medium text-gray-700">
                      {bac.niveau_actuel}%
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {bac.moyenne_remplissage}%
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {bac.nombre_mesures}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Statistiques;