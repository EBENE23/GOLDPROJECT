import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CheckCircle2, ClipboardList, Coffee, FileText, Hourglass, MapPin, Navigation, Play, Truck } from "lucide-react";

import MissionCard from "../../components/MissionCard";
import {
  BandeauErreur,
  Card,
  Chargement,
  EtatBadge,
  EtatVide,
  LevelRing,
  SectionTitle,
  dateRelative,
} from "../../components/ui/kit";
import FiltreDates from "../../components/ui/FiltreDates";
import { useAuthStore } from "../../stores/authStore";
import { useTempsReel } from "../../hooks/useTempsReel";
import {
  demarrerMission,
  obtenirDashboardAgent,
  type AgentDashboard,
  type AgentMission,
} from "../../services/agentService";
import { dansPlage, plageVide, type PlageDates } from "../../utils/plageDates";

const POIDS_PRIORITE: Record<string, number> = { CRITIQUE: 0, HAUTE: 1, MOYENNE: 2, NORMALE: 3 };

const salutation = () => {
  const heure = new Date().getHours();
  return heure < 12 ? "Bonjour" : heure < 18 ? "Bon après-midi" : "Bonsoir";
};

/** Carte principale : la mission à traiter maintenant, avec son action. */
function MissionPrioritaire({ mission, onChange }: { mission: AgentMission; onChange: () => void }) {
  const navigate = useNavigate();
  const [action, setAction] = useState(false);
  const bac = mission.intervention?.bac;
  const enCours = mission.statut === "EN_COURS";
  const suspendue = mission.statut === "SUSPENDUE";

  const demarrer = async () => {
    try {
      setAction(true);
      await demarrerMission(mission.idMission);
      toast.success("Mission démarrée. Bonne route !");
      onChange();
      navigate(`/agent/missions/${mission.idMission}/localisation`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Impossible de démarrer la mission.");
    } finally {
      setAction(false);
    }
  };

  return (
    <section className="anim-carte overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 to-emerald-950 p-5 text-white shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
          {enCours ? "Mission en cours" : suspendue ? "Mission suspendue" : "À faire maintenant"}
        </span>
        {mission.intervention?.priorite && ["CRITIQUE", "HAUTE"].includes(mission.intervention.priorite) && (
          <span className="rounded-full bg-red-500 px-3 py-1 text-[11px] font-bold uppercase">
            {mission.intervention.priorite === "CRITIQUE" ? "Urgent" : "Prioritaire"}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-4">
        {bac && (
          <div className="rounded-full bg-white p-1.5">
            <LevelRing niveau={bac.niveau_remplissage} taille={72} />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-mono text-xs font-bold text-emerald-200">#{bac?.reference ?? `MS-${mission.idMission}`}</p>
          <p className="mt-0.5 truncate text-lg font-bold leading-tight">{bac?.zone?.nomZone ?? "Point de collecte"}</p>
          {mission.intervention?.motif && (
            <p className="mt-1 line-clamp-2 text-xs text-white/70">{mission.intervention.motif}</p>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {mission.statut === "AFFECTEE" ? (
          <button
            type="button"
            onClick={demarrer}
            disabled={action}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-sm font-bold text-emerald-900 shadow transition active:scale-[0.98] disabled:opacity-60"
          >
            <Play size={18} />
            {action ? "Démarrage…" : "Démarrer la mission"}
          </button>
        ) : (
          <Link
            to={`/agent/missions/${mission.idMission}/localisation`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-sm font-bold text-emerald-900 shadow transition active:scale-[0.98]"
          >
            <Navigation size={18} />
            Suivre l'itinéraire
          </Link>
        )}
        <Link
          to={mission.statut === "AFFECTEE" ? `/agent/missions/${mission.idMission}/localisation` : `/agent/missions/${mission.idMission}`}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-white/25 active:scale-[0.98]"
        >
          {mission.statut === "AFFECTEE" ? <MapPin size={18} /> : <FileText size={18} />}
          {mission.statut === "AFFECTEE" ? "Voir l'itinéraire" : "Détails / terminer"}
        </Link>
      </div>

      {bac && (
        <div className="mt-3 flex items-center gap-2 text-[11px] text-white/70">
          <EtatBadge niveau={bac.niveau_remplissage} />
          <span>{Math.round(Number(bac.niveau_remplissage))}% rempli · mise à jour en direct</span>
        </div>
      )}
    </section>
  );
}

const Dashboard = () => {
  const utilisateur = useAuthStore((state) => state.utilisateur);
  const [data, setData] = useState<AgentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [majLe, setMajLe] = useState("");
  const [periode, setPeriode] = useState<PlageDates>(plageVide);

  const charger = useCallback(async () => {
    try {
      setError("");
      setData(await obtenirDashboardAgent());
      setMajLe(new Date().toISOString());
    } catch (err: any) {
      setError(err?.response?.data?.message || "Impossible de charger votre tableau de bord.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
    const intervalle = window.setInterval(charger, 15000);
    return () => window.clearInterval(intervalle);
  }, [charger]);

  useTempsReel(() => charger());

  // À traiter : en cours d'abord, puis par priorité, puis la plus ancienne affectation.
  const aTraiter = useMemo(() => {
    const ordre: Record<string, number> = { EN_COURS: 0, AFFECTEE: 1, SUSPENDUE: 2 };

    return (data?.missions ?? [])
      .filter((mission) => mission.statut in ordre)
      .sort(
        (a, b) =>
          ordre[a.statut] - ordre[b.statut] ||
          (POIDS_PRIORITE[a.intervention?.priorite ?? "NORMALE"] ?? 3) - (POIDS_PRIORITE[b.intervention?.priorite ?? "NORMALE"] ?? 3) ||
          new Date(a.dateAffectation ?? 0).getTime() - new Date(b.dateAffectation ?? 0).getTime()
      );
  }, [data]);

  // Indicateurs sur la période choisie (date d'affectation).
  const compte = useMemo(() => {
    const missions = (data?.missions ?? []).filter((mission) => dansPlage(mission.dateAffectation, periode));
    const n = (statut: string) => missions.filter((mission) => mission.statut === statut).length;

    return { total: missions.length, enCours: n("EN_COURS"), aDemarrer: n("AFFECTEE"), terminees: n("TERMINEE") };
  }, [data, periode]);

  if (loading) return <Chargement texte="Chargement du tableau de bord..." />;

  if (!data) return <BandeauErreur message={error || "Tableau de bord indisponible."} onReessayer={charger} />;

  const [prioritaire, ...suivantes] = aTraiter;

  return (
    <div className="space-y-4">
      {error && <BandeauErreur message={error} onReessayer={charger} />}

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">
            {salutation()}, <span className="font-bold text-slate-900">{utilisateur?.prenom ?? data.agent.prenom}</span>
          </p>
          <p className="text-xs text-slate-400">
            {aTraiter.length > 0
              ? `${aTraiter.length} mission${aTraiter.length > 1 ? "s" : ""} à traiter`
              : "Aucune mission à traiter"}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          En direct · {dateRelative(majLe)}
        </span>
      </div>

      {prioritaire ? (
        <MissionPrioritaire key={prioritaire.idMission} mission={prioritaire} onChange={charger} />
      ) : (
        <Card>
          <EtatVide
            icone={Coffee}
            titre="Rien à faire pour le moment"
            description="Vous serez notifié dès qu'un superviseur vous affectera une intervention."
          />
        </Card>
      )}

      <section className="space-y-3">
        <FiltreDates valeur={periode} onChange={setPeriode} libelle="Mon activité" />
        <div className="grid grid-cols-4 gap-2">
          {[
            { libelle: "Missions", valeur: compte.total, icone: ClipboardList, classe: "text-slate-600 bg-slate-100" },
            { libelle: "En cours", valeur: compte.enCours, icone: Truck, classe: "text-sky-700 bg-sky-50" },
            { libelle: "À démarrer", valeur: compte.aDemarrer, icone: Hourglass, classe: "text-orange-600 bg-orange-50" },
            { libelle: "Terminées", valeur: compte.terminees, icone: CheckCircle2, classe: "text-emerald-700 bg-emerald-50" },
          ].map(({ libelle, valeur, icone: Icone, classe }) => (
            <div key={libelle} className="anim-carte rounded-2xl border border-slate-100 bg-white p-2.5 text-center shadow-sm">
              <span className={`mx-auto flex h-7 w-7 items-center justify-center rounded-lg ${classe}`}>
                <Icone size={14} />
              </span>
              <p className="mt-1.5 text-xl font-bold leading-none text-slate-900">{valeur}</p>
              <p className="mt-1 truncate text-[10px] font-medium text-slate-500">{libelle}</p>
            </div>
          ))}
        </div>
      </section>

      {suivantes.length > 0 && (
        <section className="space-y-3">
          <SectionTitle
            icone={Truck}
            titre="Ensuite"
            sousTitre={`${suivantes.length} autre${suivantes.length > 1 ? "s" : ""} mission${suivantes.length > 1 ? "s" : ""}`}
            droite={
              <Link to="/agent/missions" className="text-sm font-semibold text-emerald-700 hover:underline">
                Tout voir
              </Link>
            }
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {suivantes.slice(0, 4).map((mission) => (
              <MissionCard key={mission.idMission} mission={mission} onChange={charger} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
};

export default Dashboard;
