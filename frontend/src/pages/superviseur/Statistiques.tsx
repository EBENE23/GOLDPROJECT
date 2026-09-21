import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, BarChart3, ClipboardList, Gauge, PieChart as IconePie, RefreshCw, Trash2 } from "lucide-react";

import {
  BandeauErreur,
  Card,
  Chargement,
  EtatBadge,
  EtatVide,
  KpiCard,
  LevelBar,
  PageHeader,
  RefPill,
  SecondaryButton,
  SectionTitle,
  Squelette,
  etatMeta,
} from "../../components/ui/kit";
import FiltreDates from "../../components/ui/FiltreDates";
import { useTempsReel } from "../../hooks/useTempsReel";
import {
  obtenirStatistiquesSuperviseur,
  type StatistiquesDetaillees,
} from "../../services/superviseurService";
import { plageVide, type PlageDates } from "../../utils/plageDates";

const COULEURS_INTERVENTIONS: Record<string, { libelle: string; couleur: string }> = {
  EN_ATTENTE: { libelle: "En attente", couleur: "#f97316" },
  PLANIFIEE: { libelle: "Planifiées", couleur: "#0ea5e9" },
  EN_COURS: { libelle: "En cours", couleur: "#6366f1" },
  TERMINEE: { libelle: "Terminées", couleur: "#16a34a" },
  ANNULEE: { libelle: "Annulées", couleur: "#94a3b8" },
};

const Statistiques = () => {
  const [stats, setStats] = useState<StatistiquesDetaillees | null>(null);
  const [zone, setZone] = useState("");
  const [periode, setPeriode] = useState<PlageDates>(plageVide);
  const [loading, setLoading] = useState(true);
  const [actualisation, setActualisation] = useState(false);
  const [error, setError] = useState("");

  const charger = useCallback(
    async (manuel = false) => {
      try {
        setError("");
        if (manuel) setActualisation(true);
        const reponse = await obtenirStatistiquesSuperviseur(periode);
        setStats(reponse.statistiques);
        setZone(reponse.zone?.nomZone ?? "");
      } catch (err: any) {
        setError(err?.response?.data?.message || "Impossible de charger les statistiques.");
      } finally {
        setLoading(false);
        setActualisation(false);
      }
    },
    [periode]
  );

  useEffect(() => {
    charger();
  }, [charger]);

  useTempsReel(() => charger());

  const repartitionBacs = useMemo(
    () =>
      stats
        ? (["NORMAL", "ALERTE", "PLEIN"] as const).map((etat) => ({
            nom: etatMeta[etat].libelle,
            valeur: stats.repartitionEtat[etat],
            couleur: etatMeta[etat].couleur,
          }))
        : [],
    [stats]
  );

  const interventions = useMemo(
    () =>
      stats
        ? Object.entries(COULEURS_INTERVENTIONS).map(([statut, meta]) => ({
            nom: meta.libelle,
            valeur: stats.repartitionInterventions[statut as keyof StatistiquesDetaillees["repartitionInterventions"]] ?? 0,
            couleur: meta.couleur,
          }))
        : [],
    [stats]
  );

  const moyenneGlobale = useMemo(() => {
    const avecMesures = stats?.parBac.filter((bac) => bac.nombre_mesures > 0) ?? [];
    if (avecMesures.length === 0) return null;

    return Math.round(avecMesures.reduce((total, bac) => total + bac.moyenne_remplissage, 0) / avecMesures.length);
  }, [stats]);

  if (loading) return <Chargement texte="Chargement des statistiques..." />;

  if (!stats) return <BandeauErreur message={error || "Statistiques indisponibles."} onReessayer={() => charger()} />;

  const totalInterventions = interventions.reduce((total, item) => total + item.valeur, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Données et statistiques"
        description={zone ? `Analyse de l'activité de la zone ${zone}.` : "Analyse de l'activité de votre zone."}
        actions={
          <SecondaryButton icone={RefreshCw} chargement={actualisation} onClick={() => charger(true)}>
            Actualiser
          </SecondaryButton>
        }
      />

      {error && <BandeauErreur message={error} onReessayer={() => charger()} />}

      <FiltreDates valeur={periode} onChange={setPeriode} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <KpiCard libelle="Bacs" valeur={stats.nombreBacs} icone={Trash2} teinte="bleu" />
        <KpiCard libelle="Mesures reçues" valeur={stats.nombreMesures} detail="Sur la période" icone={Activity} teinte="vert" />
        <KpiCard libelle="Remplissage moyen" valeur={moyenneGlobale === null ? "—" : `${moyenneGlobale}%`} detail="Sur la période" icone={Gauge} teinte="orange" />
        <KpiCard libelle="Interventions" valeur={stats.nombreInterventions} detail="Sur la période" icone={ClipboardList} teinte="gris" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <SectionTitle icone={IconePie} titre="État actuel des bacs" sousTitre="Situation à l'instant" />
          <div className="mt-2 flex flex-col items-center gap-2 sm:flex-row">
            <div className="h-48 w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={repartitionBacs} dataKey="valeur" nameKey="nom" innerRadius={48} outerRadius={78} paddingAngle={3}>
                    {repartitionBacs.map((entree) => (
                      <Cell key={entree.nom} fill={entree.couleur} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="w-full space-y-2 sm:w-1/2">
              {repartitionBacs.map((entree) => (
                <li key={entree.nom} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 font-medium text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entree.couleur }} />
                    {entree.nom}
                  </span>
                  <span className="font-bold text-slate-900">{entree.valeur}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionTitle icone={ClipboardList} titre="Interventions par statut" sousTitre={`${totalInterventions} sur la période`} />
          {totalInterventions === 0 ? (
            <EtatVide icone={ClipboardList} titre="Aucune intervention sur cette période" />
          ) : (
            <div className="mt-4 h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={interventions} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="nom" tick={{ fontSize: 11, fill: "#64748b" }} interval={0} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip cursor={{ fill: "rgba(148,163,184,0.12)" }} />
                  <Bar dataKey="valeur" name="Interventions" radius={[8, 8, 0, 0]}>
                    {interventions.map((entree) => (
                      <Cell key={entree.nom} fill={entree.couleur} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <section className="space-y-3">
        <SectionTitle icone={BarChart3} titre="Détail par bac" sousTitre="Niveau actuel et moyenne sur la période" />
        {actualisation && <Squelette className="h-24" />}
        {stats.parBac.length === 0 ? (
          <Card>
            <EtatVide icone={Trash2} titre="Aucun bac dans votre zone" />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {stats.parBac.map((bac) => (
              <Card key={bac.id_bac} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <RefPill>#{bac.reference}</RefPill>
                  <EtatBadge niveau={bac.niveau_actuel} />
                </div>
                <div className="mt-4 space-y-3 text-xs">
                  <div>
                    <div className="mb-1 flex justify-between">
                      <span className="text-slate-500">Niveau actuel</span>
                      <span className="font-bold text-slate-800">{Math.round(bac.niveau_actuel)}%</span>
                    </div>
                    <LevelBar niveau={bac.niveau_actuel} />
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between">
                      <span className="text-slate-500">Moyenne sur la période</span>
                      <span className="font-bold text-slate-800">
                        {bac.nombre_mesures > 0 ? `${Math.round(bac.moyenne_remplissage)}%` : "—"}
                      </span>
                    </div>
                    <LevelBar niveau={bac.moyenne_remplissage} />
                  </div>
                  <p className="text-slate-400">{bac.nombre_mesures} mesure{bac.nombre_mesures > 1 ? "s" : ""}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Statistiques;
