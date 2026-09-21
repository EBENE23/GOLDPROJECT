import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ClipboardPlus,
  MapPin,
  Percent,
  Radar,
  ShieldCheck,
  Siren,
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
  PrimaryButton,
  RefPill,
  SectionTitle,
  StatutBadge,
  dateRelative,
  libelleStatut,
  tonStatut,
} from "../../components/ui/kit";
import { useAuthStore } from "../../stores/authStore";
import {
  obtenirDashboardSuperviseur,
  type DashboardSuperviseur,
} from "../../services/superviseurService";
import { obtenirCategorieNiveauBac } from "../../utils/bacLevel";

const STATUTS_ACTIFS = ["EN_ATTENTE", "PLANIFIEE", "EN_COURS"];

const Dashboard = () => {
  const navigate = useNavigate();
  const utilisateur = useAuthStore((state) => state.utilisateur);
  const [data, setData] = useState<DashboardSuperviseur | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [majLe, setMajLe] = useState<string>("");

  const charger = useCallback(async () => {
    try {
      setError("");
      setData(await obtenirDashboardSuperviseur());
      setMajLe(new Date().toISOString());
    } catch (err: any) {
      setError(err?.response?.data?.message || "Impossible de charger le tableau de bord.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
    const intervalle = window.setInterval(charger, 15000);
    return () => window.clearInterval(intervalle);
  }, [charger]);

  // Bacs à traiter en priorité : hors état normal, les plus remplis d'abord.
  const prioritaires = useMemo(
    () =>
      (data?.bacs ?? [])
        .filter((bac) => obtenirCategorieNiveauBac(bac.niveau_remplissage) !== "NORMAL")
        .sort((a, b) => Number(b.niveau_remplissage) - Number(a.niveau_remplissage)),
    [data]
  );

  const interventionActiveParBac = useMemo(() => {
    const table = new Map<number, string>();
    (data?.interventions ?? []).forEach((item) => {
      if (STATUTS_ACTIFS.includes(item.statut)) table.set(item.id_bac, item.statut);
    });
    return table;
  }, [data]);

  const recentes = useMemo(() => (data?.interventions ?? []).slice(0, 5), [data]);

  if (loading) return <Chargement texte="Chargement du tableau de bord..." />;

  if (!data) {
    return <BandeauErreur message={error || "Tableau de bord indisponible."} onReessayer={charger} />;
  }

  const stats = data.statistiques;
  const taux = Math.round(Number(stats.pourcentageMoyen) || 0);

  return (
    <div className="space-y-5">
      {error && <BandeauErreur message={error} onReessayer={charger} />}

      <Card className="flex items-center justify-between gap-3 p-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <ShieldCheck size={24} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Superviseur · {data.zone.nomZone}
            </p>
            <p className="truncate text-lg font-bold text-slate-900">
              {utilisateur?.prenom} {utilisateur?.nom}
            </p>
          </div>
        </div>
        <div className="hidden shrink-0 items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:flex">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Actualisé {dateRelative(majLe)}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <KpiCard
          libelle="Bacs surveillés"
          valeur={stats.totalBacs}
          detail={`${stats.bacsNormaux} en état normal`}
          icone={Boxes}
          teinte="bleu"
        />
        <KpiCard
          libelle="Critiques (>80%)"
          valeur={stats.bacsPleins}
          detail={stats.bacsPleins > 0 ? "Intervention requise" : "Aucun bac plein"}
          icone={Siren}
          teinte="rouge"
        />
        <KpiCard
          libelle="En alerte"
          valeur={stats.bacsAlerte}
          detail="Entre 50 % et 80 %"
          icone={AlertTriangle}
          teinte="orange"
        />
        <div className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium text-slate-500 sm:text-sm">Taux moyen</p>
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

      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:max-w-md">
        <PrimaryButton icone={ClipboardPlus} onClick={() => navigate("/superviseur/interventions")}>
          Planifier une intervention
        </PrimaryButton>
        <Link
          to="/superviseur/suivi"
          aria-label="Suivi des interventions"
          className="flex w-12 items-center justify-center rounded-2xl bg-white text-emerald-800 shadow-sm ring-1 ring-slate-100 hover:bg-slate-50"
        >
          <Radar size={20} />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="space-y-3">
          <SectionTitle
            icone={Siren}
            titre="Bacs prioritaires"
            droite={
              prioritaires.length > 0 ? (
                <StatutBadge ton="rouge">{prioritaires.length} à traiter</StatutBadge>
              ) : undefined
            }
          />

          {prioritaires.length === 0 ? (
            <Card>
              <EtatVide
                icone={CheckCircle2}
                titre="Tous les bacs sont en état normal"
                description="Aucune intervention n'est nécessaire pour le moment."
              />
            </Card>
          ) : (
            prioritaires.map((bac) => {
              const active = interventionActiveParBac.get(bac.id_bac);

              return (
                <Card
                  key={bac.id_bac}
                  severite={obtenirCategorieNiveauBac(bac.niveau_remplissage)}
                  className="p-4"
                >
                  <div className="flex items-center gap-4">
                    <LevelRing niveau={bac.niveau_remplissage} taille={64} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <RefPill>#{bac.reference}</RefPill>
                        <EtatBadge niveau={bac.niveau_remplissage} />
                      </div>
                      {bac.latitude !== null && bac.latitude !== undefined && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                          <MapPin size={13} />
                          {Number(bac.latitude).toFixed(4)}° N, {Number(bac.longitude).toFixed(4)}° E
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    {active ? (
                      <StatutBadge ton={tonStatut(active)}>Intervention {libelleStatut(active).toLowerCase()}</StatutBadge>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">Aucune intervention prévue</span>
                    )}
                    {!active && (
                      <PrimaryButton
                        className="!rounded-xl !px-4 !py-2 !text-xs"
                        onClick={() => navigate(`/superviseur/interventions?ouvrir=1&bac=${bac.id_bac}`)}
                      >
                        Assigner collecte
                      </PrimaryButton>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </section>

        <section className="space-y-3">
          <SectionTitle icone={Radar} titre="Dernières interventions" sousTitre="Enregistrées dans votre zone" />

          <Card className="divide-y divide-slate-100">
            {recentes.length === 0 ? (
              <EtatVide icone={ClipboardPlus} titre="Aucune intervention" />
            ) : (
              recentes.map((item) => (
                <div key={item.idIntervention} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <RefPill>#{item.bac?.reference ?? item.id_bac}</RefPill>
                    <p className="mt-1 truncate text-sm text-slate-600">
                      {item.mission?.agent
                        ? `${item.mission.agent.prenom} ${item.mission.agent.nom}`
                        : "Aucun agent affecté"}
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
