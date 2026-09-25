import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, FileText, Navigation, Play, RotateCcw, UserRound } from "lucide-react";
import { toast } from "react-toastify";

import {
  Card,
  LevelRing,
  PrimaryButton,
  RefPill,
  SecondaryButton,
  StatutBadge,
  useLibelleStatut,
  tonStatut,
} from "./ui/kit";
import { demarrerMission, reprendreMission, type AgentMission } from "../services/agentService";
import { obtenirCategorieNiveauBac } from "../utils/bacLevel";
import { LOCALE_INTL, useTranslation } from "../i18n";

const tonPriorite = (priorite?: string) =>
  priorite === "CRITIQUE" ? "rouge" : priorite === "HAUTE" ? "orange" : priorite === "MOYENNE" ? "bleu" : "gris";

/** Carte d'une mission de collecte, avec ses actions rapides. */
export default function MissionCard({ mission, onChange }: { mission: AgentMission; onChange?: () => void }) {
  const { t, langue } = useTranslation();
  const libelleStatut = useLibelleStatut();
  const navigate = useNavigate();
  const [action, setAction] = useState(false);
  const bac = mission.intervention?.bac;
  const superviseur = mission.intervention?.superviseur;

  const formaterDate = (valeur?: string | null) => {
    if (!valeur) return null;
    const date = new Date(valeur);

    return Number.isNaN(date.getTime())
      ? null
      : new Intl.DateTimeFormat(LOCALE_INTL[langue], { dateStyle: "medium", timeStyle: "short" }).format(date);
  };

  const prevue = formaterDate(mission.intervention?.datePrevue);

  const lancer = async (fn: (id: number) => Promise<unknown>, succes: string) => {
    try {
      setAction(true);
      await fn(mission.idMission);
      toast.success(succes);
      onChange?.();
      navigate(`/agent/missions/${mission.idMission}/localisation`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t("missionCard.actionImpossible"));
    } finally {
      setAction(false);
    }
  };

  const detail = () => navigate(`/agent/missions/${mission.idMission}`);
  const itineraire = () => navigate(`/agent/missions/${mission.idMission}/localisation`);

  return (
    <Card severite={bac ? obtenirCategorieNiveauBac(bac.niveau_remplissage) : undefined} className="p-4 sm:p-5">
      <div className="flex items-start gap-4">
        {bac && <LevelRing niveau={bac.niveau_remplissage} taille={64} />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <RefPill>#{bac?.reference ?? `MS-${mission.idMission}`}</RefPill>
            <StatutBadge ton={tonStatut(mission.statut)}>{libelleStatut(mission.statut)}</StatutBadge>
            {mission.intervention?.priorite && (
              <StatutBadge ton={tonPriorite(mission.intervention.priorite)}>
                {libelleStatut(mission.intervention.priorite)}
              </StatutBadge>
            )}
          </div>
          <p className="mt-2 text-sm font-bold text-slate-900">
            {bac?.zone?.nomZone ? t("missionCard.collecteZone", { zone: bac.zone.nomZone }) : t("missionCard.missionNumero", { n: mission.idMission })}
          </p>
          {mission.intervention?.motif && (
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{mission.intervention.motif}</p>
          )}
        </div>
      </div>

      {(superviseur || prevue) && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          {superviseur && (
            <span className="inline-flex items-center gap-1.5">
              <UserRound size={13} />
              {superviseur.prenom} {superviseur.nom}
            </span>
          )}
          {prevue && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock size={13} />
              {t("missionCard.prevue", { date: prevue })}
            </span>
          )}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        {mission.statut === "AFFECTEE" && (
          <>
            <PrimaryButton
              icone={Play}
              chargement={action}
              onClick={() => lancer(demarrerMission, t("missionCard.missionDemarree"))}
            >
              {t("missionCard.demarrer")}
            </PrimaryButton>
            <SecondaryButton icone={Navigation} onClick={itineraire}>
              {t("missionCard.itineraire")}
            </SecondaryButton>
          </>
        )}

        {mission.statut === "EN_COURS" && (
          <>
            <PrimaryButton icone={Navigation} onClick={itineraire}>
              {t("missionCard.suivreItineraire")}
            </PrimaryButton>
            <SecondaryButton icone={FileText} onClick={detail}>
              {t("missionCard.details")}
            </SecondaryButton>
          </>
        )}

        {mission.statut === "SUSPENDUE" && (
          <>
            <PrimaryButton
              icone={RotateCcw}
              chargement={action}
              onClick={() => lancer(reprendreMission, t("missionCard.missionReprise"))}
            >
              {t("missionCard.reprendre")}
            </PrimaryButton>
            <SecondaryButton icone={FileText} onClick={detail}>
              {t("missionCard.details")}
            </SecondaryButton>
          </>
        )}

        {(mission.statut === "TERMINEE" || mission.statut === "ANNULEE") && (
          <SecondaryButton icone={FileText} onClick={detail} className="col-span-2">
            {t("missionCard.consulterMission")}
          </SecondaryButton>
        )}
      </div>
    </Card>
  );
}
