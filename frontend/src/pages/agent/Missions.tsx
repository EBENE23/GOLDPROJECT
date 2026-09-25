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
import { useTranslation } from "../../i18n";

type Filtre = "TOUTES" | "EN_COURS" | "AFFECTEE" | "SUSPENDUE" | "TERMINEE";

const Missions = () => {
  const { t } = useTranslation();
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
      setError(err?.response?.data?.message || t("agentMissions.erreurChargement"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

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

  if (loading) return <Chargement texte={t("agentMissions.chargement")} />;

  return (
    <div className="space-y-5">
      <PageHeader
        titre={t("shell.titreMesMissions")}
        description={t("agentMissions.description")}
        actions={
          <SecondaryButton icone={RefreshCw} chargement={refreshing} onClick={() => charger(true)}>
            {t("adminDemandes.actualiser")}
          </SecondaryButton>
        }
      />

      {error && <BandeauErreur message={error} onReessayer={() => charger()} />}

      <FilterChips
        valeur={filtre}
        onChange={setFiltre}
        options={[
          { valeur: "TOUTES", libelle: t("adminDemandes.filtreToutes"), compteur: missions.length },
          { valeur: "EN_COURS", libelle: t("commun.statutEnCours"), compteur: compte("EN_COURS"), couleur: "#0ea5e9" },
          { valeur: "AFFECTEE", libelle: t("agentDashboard.kpiADemarrer"), compteur: compte("AFFECTEE"), couleur: "#f97316" },
          { valeur: "SUSPENDUE", libelle: t("agentMissions.filtreSuspendues"), compteur: compte("SUSPENDUE"), couleur: "#94a3b8" },
          { valeur: "TERMINEE", libelle: t("adminInterventions.optTerminees"), compteur: compte("TERMINEE"), couleur: "#16a34a" },
        ]}
      />

      <FiltreDates valeur={periode} onChange={setPeriode} libelle={t("agentMissions.affectees")} />

      {visibles.length === 0 ? (
        <Card>
          <EtatVide
            icone={Truck}
            titre={t("agentMissions.aucuneMissionDisponible")}
            description={
              missions.length === 0
                ? t("agentDashboard.seraNotifie")
                : t("agentMissions.aucuneCorrespondFiltre")
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
