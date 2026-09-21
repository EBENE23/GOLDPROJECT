import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, CheckCircle2, Clock, History, RefreshCw, XCircle } from "lucide-react";

import {
  BandeauErreur,
  Card,
  Chargement,
  EtatVide,
  FilterChips,
  KpiCard,
  PageHeader,
  RefPill,
  SecondaryButton,
  StatutBadge,
  libelleStatut,
  tonStatut,
} from "../../components/ui/kit";
import FiltreDates from "../../components/ui/FiltreDates";
import { listerMissionsAgent, type AgentMission } from "../../services/agentService";
import { dansPlage, plageVide, type PlageDates } from "../../utils/plageDates";

type Filtre = "TOUTES" | "TERMINEE" | "ANNULEE";

const formaterDateHeure = (valeur?: string | null) => {
  if (!valeur) return "—";
  const date = new Date(valeur);

  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const formaterDuree = (debut?: string | null, fin?: string | null) => {
  if (!debut || !fin) return null;
  const minutes = Math.round((new Date(fin).getTime() - new Date(debut).getTime()) / 60000);
  if (!Number.isFinite(minutes) || minutes < 0) return null;

  return minutes < 60 ? `${Math.max(minutes, 1)} min` : `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
};

const dateReference = (mission: AgentMission) => mission.dateFin || mission.dateAffectation;

const Historique = () => {
  const [missions, setMissions] = useState<AgentMission[]>([]);
  const [filtre, setFiltre] = useState<Filtre>("TOUTES");
  const [periode, setPeriode] = useState<PlageDates>(plageVide);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const charger = useCallback(async (actualisation = false) => {
    try {
      setError("");
      if (actualisation) setRefreshing(true);
      setMissions((await listerMissionsAgent()).missions);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Impossible de charger votre historique.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const clotures = useMemo(
    () =>
      missions
        .filter((mission) => mission.statut === "TERMINEE" || mission.statut === "ANNULEE")
        .filter((mission) => dansPlage(dateReference(mission), periode))
        .sort((a, b) => new Date(dateReference(b) ?? 0).getTime() - new Date(dateReference(a) ?? 0).getTime()),
    [missions, periode]
  );

  const terminees = clotures.filter((mission) => mission.statut === "TERMINEE");
  const annulees = clotures.filter((mission) => mission.statut === "ANNULEE");

  const dureeMoyenne = useMemo(() => {
    const durees = terminees
      .map((mission) =>
        mission.dateDebut && mission.dateFin ? (new Date(mission.dateFin).getTime() - new Date(mission.dateDebut).getTime()) / 60000 : NaN
      )
      .filter((minutes) => Number.isFinite(minutes) && minutes >= 0);

    if (durees.length === 0) return "—";
    const moyenne = Math.round(durees.reduce((a, b) => a + b, 0) / durees.length);

    return moyenne < 60 ? `${Math.max(moyenne, 1)} min` : `${Math.floor(moyenne / 60)} h ${String(moyenne % 60).padStart(2, "0")}`;
  }, [terminees]);

  const visibles = clotures.filter((mission) => filtre === "TOUTES" || mission.statut === filtre);

  if (loading) return <Chargement texte="Chargement de l'historique..." />;

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Historique des collectes"
        description="Missions terminées ou annulées, filtrables par période."
        actions={
          <SecondaryButton icone={RefreshCw} chargement={refreshing} onClick={() => charger(true)}>
            Actualiser
          </SecondaryButton>
        }
      />

      {error && <BandeauErreur message={error} onReessayer={() => charger()} />}

      <FiltreDates valeur={periode} onChange={setPeriode} libelle="Période" />

      <div className="grid grid-cols-3 gap-3 lg:gap-4">
        <KpiCard libelle="Terminées" valeur={terminees.length} icone={CheckCircle2} teinte="vert" />
        <KpiCard libelle="Annulées" valeur={annulees.length} icone={XCircle} teinte="rouge" />
        <KpiCard libelle="Durée moyenne" valeur={<span className="text-xl sm:text-2xl">{dureeMoyenne}</span>} icone={Clock} teinte="bleu" />
      </div>

      <FilterChips
        valeur={filtre}
        onChange={setFiltre}
        options={[
          { valeur: "TOUTES", libelle: "Toutes", compteur: clotures.length },
          { valeur: "TERMINEE", libelle: "Terminées", compteur: terminees.length, couleur: "#16a34a" },
          { valeur: "ANNULEE", libelle: "Annulées", compteur: annulees.length, couleur: "#dc2626" },
        ]}
      />

      {visibles.length === 0 ? (
        <Card>
          <EtatVide
            icone={History}
            titre="Aucune mission dans l'historique"
            description="Modifiez la période ou le filtre pour élargir la recherche."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {visibles.map((mission) => {
            const bac = mission.intervention?.bac;
            const duree = formaterDuree(mission.dateDebut, mission.dateFin);

            return (
              <Card key={mission.idMission} className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <RefPill>#{bac?.reference ?? `MS-${mission.idMission}`}</RefPill>
                    <p className="mt-1.5 truncate text-sm font-bold text-slate-900">
                      {bac?.zone?.nomZone ?? `Mission n°${mission.idMission}`}
                    </p>
                  </div>
                  <StatutBadge ton={tonStatut(mission.statut)}>{libelleStatut(mission.statut)}</StatutBadge>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs">
                  <div>
                    <dt className="text-slate-400">Début</dt>
                    <dd className="mt-0.5 font-semibold text-slate-700">{formaterDateHeure(mission.dateDebut)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Fin</dt>
                    <dd className="mt-0.5 font-semibold text-slate-700">{formaterDateHeure(mission.dateFin)}</dd>
                  </div>
                  {duree && (
                    <div className="col-span-2 flex items-center gap-1.5 text-slate-500">
                      <Clock size={13} /> Durée : <span className="font-semibold text-slate-700">{duree}</span>
                    </div>
                  )}
                </dl>

                {mission.observation && (
                  <p className="mt-3 line-clamp-2 text-xs text-slate-500">« {mission.observation} »</p>
                )}

                <Link
                  to={`/agent/missions/${mission.idMission}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline"
                >
                  <CalendarCheck size={14} />
                  Voir le détail
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Historique;
