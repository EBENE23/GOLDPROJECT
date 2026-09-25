import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ClipboardList,
  MapPin,
  Percent,
  Radar,
  ShieldCheck,
  Siren,
  Truck,
} from "lucide-react";

import {
  BandeauErreur,
  Card,
  Chargement,
  EtatBadge,
  EtatVide,
  KpiCard,
  LevelBar,
  LevelRing,
  RefPill,
  SectionTitle,
  StatutBadge,
  useDateRelative,
  useLibelleStatut,
  tonStatut,
} from "../../components/ui/kit";
import FiltreDates from "../../components/ui/FiltreDates";
import { useAuthStore } from "../../stores/authStore";
import { useTempsReel } from "../../hooks/useTempsReel";
import {
  obtenirDashboardSuperviseur,
  type Bac,
  type DashboardSuperviseur,
} from "../../services/superviseurService";
import { obtenirCategorieNiveauBac } from "../../utils/bacLevel";
import { dansPlage, plageVide, type PlageDates } from "../../utils/plageDates";
import { useTranslation } from "../../i18n";

const STATUTS_ACTIFS = ["EN_ATTENTE", "PLANIFIEE", "EN_COURS"];

/** Carte principale : ce que le superviseur doit faire maintenant. */
function PrioriteDuMoment({
  prioritaires,
  enCours,
}: {
  prioritaires: Bac[];
  enCours: number;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [premier, ...autres] = prioritaires;

  if (premier) {
    const critique = obtenirCategorieNiveauBac(premier.niveau_remplissage) === "PLEIN";

    return (
      <section
        className={`anim-carte overflow-hidden rounded-3xl p-5 text-white shadow-lg ${
          critique ? "bg-gradient-to-br from-red-600 to-red-900" : "bg-gradient-to-br from-orange-500 to-orange-700"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
            <Siren size={13} />
            {critique ? t("superviseurDashboard.interventionUrgente") : t("superviseurDashboard.aSurveiller")}
          </span>
          <span className="text-[11px] font-semibold text-white/80">
            {t(prioritaires.length > 1 ? "superviseurDashboard.bacSansInterventionPluriel" : "superviseurDashboard.bacSansInterventionSingulier", { n: prioritaires.length })}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="rounded-full bg-white p-1.5">
            <LevelRing niveau={premier.niveau_remplissage} taille={72} />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-xs font-bold text-white/80">#{premier.reference}</p>
            <p className="mt-0.5 text-lg font-bold leading-tight">
              {critique ? t("superviseurDashboard.bacPleinAVider") : t("superviseurDashboard.bacBientotPlein")}
            </p>
            {premier.latitude !== null && premier.latitude !== undefined && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-white/75">
                <MapPin size={12} />
                {Number(premier.latitude).toFixed(4)}° N, {Number(premier.longitude).toFixed(4)}° E
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate(`/superviseur/interventions?ouvrir=1&bac=${premier.id_bac}`)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-sm font-bold text-slate-900 shadow transition active:scale-[0.98]"
          >
            <Truck size={18} />
            {t("superviseurDashboard.assignerCollecte")}
          </button>
          <Link
            to={autres.length > 0 ? "/superviseur/alertes" : "/superviseur/localisation"}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/20 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-white/30 active:scale-[0.98]"
          >
            {autres.length > 0
              ? t(autres.length > 1 ? "superviseurDashboard.voirAutresPluriel" : "superviseurDashboard.voirAutresSingulier", { n: autres.length })
              : t("superviseurDashboard.voirSurCarte")}
          </Link>
        </div>
      </section>
    );
  }

  if (enCours > 0) {
    return (
      <section className="anim-carte overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 to-indigo-800 p-5 text-white shadow-lg">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
          <Radar size={13} />
          {t("superviseurDashboard.suiviEnDirect")}
        </span>
        <p className="mt-4 text-2xl font-bold">
          {t(enCours > 1 ? "superviseurDashboard.collectePluriel" : "superviseurDashboard.collecteSingulier", { n: enCours })}
        </p>
        <p className="mt-1 text-sm text-white/75">{t("superviseurDashboard.suivezPosition")}</p>
        <Link
          to="/superviseur/suivi"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-sm font-bold text-indigo-900 shadow transition active:scale-[0.98] sm:w-auto"
        >
          <Radar size={18} />
          {t("superviseurDashboard.ouvrirSuivi")}
        </Link>
      </section>
    );
  }

  return (
    <section className="anim-carte overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-900 p-5 text-white shadow-lg">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
        <CheckCircle2 size={13} />
        {t("superviseurDashboard.toutSousControle")}
      </span>
      <p className="mt-4 text-xl font-bold">{t("superviseurDashboard.aucunBacIntervention")}</p>
      <p className="mt-1 text-sm text-white/75">{t("superviseurDashboard.seraAlerte")}</p>
    </section>
  );
}

const Dashboard = () => {
  const { t } = useTranslation();
  const dateRelative = useDateRelative();
  const libelleStatut = useLibelleStatut();
  const utilisateur = useAuthStore((state) => state.utilisateur);
  const [data, setData] = useState<DashboardSuperviseur | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [majLe, setMajLe] = useState("");
  const [periode, setPeriode] = useState<PlageDates>(plageVide);

  const charger = useCallback(async () => {
    try {
      setError("");
      setData(await obtenirDashboardSuperviseur());
      setMajLe(new Date().toISOString());
    } catch (err: any) {
      setError(err?.response?.data?.message || t("superviseurDashboard.erreurChargement"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    charger();
    const intervalle = window.setInterval(charger, 15000);
    return () => window.clearInterval(intervalle);
  }, [charger]);

  useTempsReel(() => charger());

  const interventionActiveParBac = useMemo(() => {
    const table = new Map<number, string>();
    (data?.interventions ?? []).forEach((item) => {
      if (STATUTS_ACTIFS.includes(item.statut)) table.set(item.id_bac, item.statut);
    });
    return table;
  }, [data]);

  // Bacs à traiter (hors état normal, sans intervention active), les plus remplis d'abord.
  const prioritaires = useMemo(
    () =>
      (data?.bacs ?? [])
        .filter(
          (bac) =>
            obtenirCategorieNiveauBac(bac.niveau_remplissage) !== "NORMAL" && !interventionActiveParBac.has(bac.id_bac)
        )
        .sort((a, b) => Number(b.niveau_remplissage) - Number(a.niveau_remplissage)),
    [data, interventionActiveParBac]
  );

  const interventionsPeriode = useMemo(
    () => (data?.interventions ?? []).filter((item) => dansPlage(item.dateCreation, periode)),
    [data, periode]
  );

  if (loading) return <Chargement texte={t("superviseurDashboard.chargement")} />;

  if (!data) return <BandeauErreur message={error || t("superviseurDashboard.tableauDeBordIndisponible")} onReessayer={charger} />;

  const stats = data.statistiques;
  const taux = Math.round(Number(stats.pourcentageMoyen) || 0);

  return (
    <div className="space-y-4">
      {error && <BandeauErreur message={error} onReessayer={charger} />}

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            <ShieldCheck size={15} className="text-emerald-600" />
            {data.zone.nomZone}
          </p>
          <p className="truncate text-lg font-bold text-slate-900">
            {utilisateur?.prenom} {utilisateur?.nom}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          {t("adminDashboard.enDirect", { temps: dateRelative(majLe) })}
        </span>
      </div>

      <PrioriteDuMoment prioritaires={prioritaires} enCours={stats.interventionsEnCours} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <KpiCard libelle={t("superviseurDashboard.kpiBacsSurveilles")} valeur={stats.totalBacs} detail={t("superviseurDashboard.kpiNormauxDetail", { n: stats.bacsNormaux })} icone={Boxes} teinte="bleu" />
        <KpiCard libelle={t("superviseurDashboard.kpiCritiques")} valeur={stats.bacsPleins} detail={t("superviseurDashboard.kpiAuDessus80")} icone={Siren} teinte="rouge" />
        <KpiCard libelle={t("adminBacs.kpiAlerte")} valeur={stats.bacsAlerte} detail={t("superviseurDashboard.kpiEntre")} icone={AlertTriangle} teinte="orange" />
        <div className="anim-carte rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium text-slate-500 sm:text-sm">{t("superviseurDashboard.tauxMoyen")}</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Percent size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold leading-none text-slate-900 sm:text-3xl">{taux}%</p>
          <div className="mt-3">
            <LevelBar niveau={taux} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="space-y-3">
          <SectionTitle
            icone={Siren}
            titre={t("superviseurDashboard.bacsATraiter")}
            droite={prioritaires.length > 0 ? <StatutBadge ton="rouge">{prioritaires.length}</StatutBadge> : undefined}
          />

          {prioritaires.length === 0 ? (
            <Card>
              <EtatVide icone={CheckCircle2} titre={t("superviseurDashboard.aucunBacAttente")} />
            </Card>
          ) : (
            prioritaires.slice(0, 5).map((bac) => (
              <Card key={bac.id_bac} severite={obtenirCategorieNiveauBac(bac.niveau_remplissage)} className="p-4">
                <div className="flex items-center gap-4">
                  <LevelRing niveau={bac.niveau_remplissage} taille={56} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <RefPill>#{bac.reference}</RefPill>
                      <EtatBadge niveau={bac.niveau_remplissage} />
                    </div>
                  </div>
                  <Link
                    to={`/superviseur/interventions?ouvrir=1&bac=${bac.id_bac}`}
                    className="shrink-0 rounded-xl bg-emerald-800 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-emerald-900 active:scale-95"
                  >
                    {t("superviseurDashboard.assigner")}
                  </Link>
                </div>
              </Card>
            ))
          )}
        </section>

        <section className="space-y-3">
          <SectionTitle icone={ClipboardList} titre={t("adminDashboard.interventionsTitre")} sousTitre={t("adminDashboard.interventionsSousTitre")} />
          <FiltreDates valeur={periode} onChange={setPeriode} />

          <Card className="divide-y divide-slate-100">
            {interventionsPeriode.length === 0 ? (
              <EtatVide icone={ClipboardList} titre={t("adminDashboard.aucuneInterventionPeriode")} />
            ) : (
              interventionsPeriode.slice(0, 6).map((item) => (
                <div key={item.idIntervention} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <RefPill>#{item.bac?.reference ?? item.id_bac}</RefPill>
                    <p className="mt-1 truncate text-sm text-slate-600">
                      {item.mission?.agent ? `${item.mission.agent.prenom} ${item.mission.agent.nom}` : t("superviseurDashboard.aucunAgentAffecte")}
                    </p>
                  </div>
                  <StatutBadge ton={tonStatut(item.statut)}>{libelleStatut(item.statut)}</StatutBadge>
                </div>
              ))
            )}
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
