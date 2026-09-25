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
import { useTranslation } from "../../i18n";
import {
  obtenirStatistiquesSuperviseur,
  type StatistiquesDetaillees,
} from "../../services/superviseurService";
import { plageVide, type PlageDates } from "../../utils/plageDates";

const COULEURS_INTERVENTIONS: Record<string, { couleur: string }> = {
  EN_ATTENTE: { couleur: "#f97316" },
  PLANIFIEE: { couleur: "#0ea5e9" },
  EN_COURS: { couleur: "#6366f1" },
  TERMINEE: { couleur: "#16a34a" },
  ANNULEE: { couleur: "#94a3b8" },
};

const Statistiques = () => {
  const { t } = useTranslation();

  const LIBELLES_INTERVENTIONS: Record<string, string> = {
    EN_ATTENTE: t("commun.statutEnAttente"),
    PLANIFIEE: t("adminInterventions.optPlanifiees"),
    EN_COURS: t("commun.statutEnCours"),
    TERMINEE: t("adminInterventions.optTerminees"),
    ANNULEE: t("adminInterventions.optAnnulees"),
  };
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
        setError(err?.response?.data?.message || t("superviseurStatistiques.erreurChargement"));
      } finally {
        setLoading(false);
        setActualisation(false);
      }
    },
    [periode, t]
  );

  useEffect(() => {
    charger();
  }, [charger]);

  useTempsReel(() => charger());

  const repartitionBacs = useMemo(
    () =>
      stats
        ? (["NORMAL", "ALERTE", "PLEIN"] as const).map((etat) => ({
            nom: t(etatMeta[etat].libelleCle),
            valeur: stats.repartitionEtat[etat],
            couleur: etatMeta[etat].couleur,
          }))
        : [],
    [stats, t]
  );

  const interventions = useMemo(
    () =>
      stats
        ? Object.entries(COULEURS_INTERVENTIONS).map(([statut, meta]) => ({
            nom: LIBELLES_INTERVENTIONS[statut],
            valeur: stats.repartitionInterventions[statut as keyof StatistiquesDetaillees["repartitionInterventions"]] ?? 0,
            couleur: meta.couleur,
          }))
        : [],
    [stats, t]
  );

  const moyenneGlobale = useMemo(() => {
    const avecMesures = stats?.parBac.filter((bac) => bac.nombre_mesures > 0) ?? [];
    if (avecMesures.length === 0) return null;

    return Math.round(avecMesures.reduce((total, bac) => total + bac.moyenne_remplissage, 0) / avecMesures.length);
  }, [stats]);

  if (loading) return <Chargement texte={t("superviseurStatistiques.chargement")} />;

  if (!stats) return <BandeauErreur message={error || t("superviseurStatistiques.statistiquesIndisponibles")} onReessayer={() => charger()} />;

  const totalInterventions = interventions.reduce((total, item) => total + item.valeur, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        titre={t("superviseurStatistiques.titre")}
        description={zone ? t("superviseurStatistiques.descriptionZone", { zone }) : t("superviseurStatistiques.descriptionGenerique")}
        actions={
          <SecondaryButton icone={RefreshCw} chargement={actualisation} onClick={() => charger(true)}>
            {t("adminDemandes.actualiser")}
          </SecondaryButton>
        }
      />

      {error && <BandeauErreur message={error} onReessayer={() => charger()} />}

      <FiltreDates valeur={periode} onChange={setPeriode} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <KpiCard libelle={t("shell.navBacs")} valeur={stats.nombreBacs} icone={Trash2} teinte="bleu" />
        <KpiCard libelle={t("superviseurStatistiques.kpiMesuresRecues")} valeur={stats.nombreMesures} detail={t("superviseurStatistiques.surLaPeriode")} icone={Activity} teinte="vert" />
        <KpiCard libelle={t("superviseurStatistiques.kpiRemplissageMoyen")} valeur={moyenneGlobale === null ? "—" : `${moyenneGlobale}%`} detail={t("superviseurStatistiques.surLaPeriode")} icone={Gauge} teinte="orange" />
        <KpiCard libelle={t("adminDashboard.kpiInterventions")} valeur={stats.nombreInterventions} detail={t("superviseurStatistiques.surLaPeriode")} icone={ClipboardList} teinte="gris" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <SectionTitle icone={IconePie} titre={t("superviseurStatistiques.etatActuelBacs")} sousTitre={t("superviseurStatistiques.situationInstant")} />
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
          <SectionTitle icone={ClipboardList} titre={t("superviseurStatistiques.interventionsParStatut")} sousTitre={t("superviseurStatistiques.surLaPeriodeCount", { n: totalInterventions })} />
          {totalInterventions === 0 ? (
            <EtatVide icone={ClipboardList} titre={t("adminDashboard.aucuneInterventionPeriode")} />
          ) : (
            <div className="mt-4 h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={interventions} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="nom" tick={{ fontSize: 11, fill: "#64748b" }} interval={0} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip cursor={{ fill: "rgba(148,163,184,0.12)" }} />
                  <Bar dataKey="valeur" name={t("superviseurStatistiques.interventionsBarName")} radius={[8, 8, 0, 0]}>
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
        <SectionTitle icone={BarChart3} titre={t("superviseurStatistiques.detailParBac")} sousTitre={t("superviseurStatistiques.niveauActuelEtMoyenne")} />
        {actualisation && <Squelette className="h-24" />}
        {stats.parBac.length === 0 ? (
          <Card>
            <EtatVide icone={Trash2} titre={t("superviseurHistoriques.aucunBacZone")} />
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
                      <span className="text-slate-500">{t("adminBacs.niveauActuel")}</span>
                      <span className="font-bold text-slate-800">{Math.round(bac.niveau_actuel)}%</span>
                    </div>
                    <LevelBar niveau={bac.niveau_actuel} />
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between">
                      <span className="text-slate-500">{t("superviseurStatistiques.moyenneSurPeriode")}</span>
                      <span className="font-bold text-slate-800">
                        {bac.nombre_mesures > 0 ? `${Math.round(bac.moyenne_remplissage)}%` : "—"}
                      </span>
                    </div>
                    <LevelBar niveau={bac.moyenne_remplissage} />
                  </div>
                  <p className="text-slate-400">{t(bac.nombre_mesures > 1 ? "superviseurStatistiques.mesurePluriel" : "superviseurStatistiques.mesureSingulier", { n: bac.nombre_mesures })}</p>
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
