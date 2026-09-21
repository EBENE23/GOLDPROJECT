import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Truck } from "lucide-react";

import MissionCard from "../../components/MissionCard";
import {
  BandeauErreur,
  Card,
  Chargement,
  EtatVide,
  FilterChips,
  PageHeader,
  SecondaryButton,
} from "../../components/ui/kit";
import { listerMissionsAgent, type AgentMission } from "../../services/agentService";
import FiltreDates from "../../components/ui/FiltreDates";
import { dansPlage, plageVide, type PlageDates } from "../../utils/plageDates";
import { useTempsReel } from "../../hooks/useTempsReel";

type Filtre = "TOUTES" | "EN_COURS" | "AFFECTEE" | "SUSPENDUE" | "TERMINEE";

const Missions = () => {
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
      setError(err?.response?.data?.message || "Impossible de charger vos missions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    charger();
    const intervalle = window.setInterval(() => charger(), 20000);
    return () => window.clearInterval(intervalle);
  }, [charger]);

  useTempsReel(() => charger());

  const compte = (statut: string) => missions.filter((m) => m.statut === statut).length;

  const visibles = useMemo(() => {
    // En cours d'abord, puis à démarrer, suspendues, terminées ; le plus récent en premier.
    const ordre: Record<string, number> = { EN_COURS: 0, AFFECTEE: 1, SUSPENDUE: 2, TERMINEE: 3, ANNULEE: 4 };

    return missions
      .filter((m) => filtre === "TOUTES" || m.statut === filtre)
      .filter((m) => dansPlage(m.dateAffectation, periode))
      .sort(
        (a, b) =>
          (ordre[a.statut] ?? 9) - (ordre[b.statut] ?? 9) ||
          new Date(b.dateAffectation ?? 0).getTime() - new Date(a.dateAffectation ?? 0).getTime()
      );
  }, [missions, filtre, periode]);

  if (loading) return <Chargement texte="Chargement de vos missions..." />;

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Mes missions"
        description="Missions de collecte qui vous sont affectées par votre superviseur."
        actions={
          <SecondaryButton icone={RefreshCw} chargement={refreshing} onClick={() => charger(true)}>
            Actualiser
          </SecondaryButton>
        }
      />

      {error && <BandeauErreur message={error} onReessayer={() => charger()} />}

      <FilterChips
        valeur={filtre}
        onChange={setFiltre}
        options={[
          { valeur: "TOUTES", libelle: "Toutes", compteur: missions.length },
          { valeur: "EN_COURS", libelle: "En cours", compteur: compte("EN_COURS"), couleur: "#0ea5e9" },
          { valeur: "AFFECTEE", libelle: "À démarrer", compteur: compte("AFFECTEE"), couleur: "#f97316" },
          { valeur: "SUSPENDUE", libelle: "Suspendues", compteur: compte("SUSPENDUE"), couleur: "#94a3b8" },
          { valeur: "TERMINEE", libelle: "Terminées", compteur: compte("TERMINEE"), couleur: "#16a34a" },
        ]}
      />

      <FiltreDates valeur={periode} onChange={setPeriode} libelle="Affectées" />

      {visibles.length === 0 ? (
        <Card>
          <EtatVide
            icone={Truck}
            titre="Aucune mission disponible"
            description={
              missions.length === 0
                ? "Vous serez notifié dès qu'un superviseur vous affectera une intervention."
                : "Aucune mission ne correspond à ce filtre."
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {visibles.map((mission) => (
            <MissionCard key={mission.idMission} mission={mission} onChange={() => charger()} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Missions;
