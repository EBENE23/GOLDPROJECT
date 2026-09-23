import { useCallback, useEffect, useMemo, useState } from "react";
import Avatar from "../../components/Avatar";
import { useNavigate } from "react-router-dom";
import { ClipboardPlus, Mail, Phone, RefreshCw, UserCheck, Users } from "lucide-react";

import {
  Card,
  BandeauErreur,
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
import { listerAgentsSuperviseur, type Agent, type Zone } from "../../services/superviseurService";
import { useTempsReel } from "../../hooks/useTempsReel";

type Filtre = "TOUS" | "DISPONIBLES" | "OCCUPES";

const Agents = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [zone, setZone] = useState<Zone | undefined>();
  const [filtre, setFiltre] = useState<Filtre>("TOUS");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const charger = useCallback(async (actualisation = false) => {
    try {
      setError("");
      if (actualisation) setRefreshing(true);
      const reponse = await listerAgentsSuperviseur();
      setAgents(reponse.agents);
      setZone(reponse.zone);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Impossible de charger les agents de votre zone.");
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

  const disponibles = useMemo(() => agents.filter((a) => a.disponible).length, [agents]);
  const enMission = useMemo(() => agents.filter((a) => (a.missionsActives ?? 0) > 0).length, [agents]);

  const visibles = useMemo(
    () =>
      agents.filter((agent) =>
        filtre === "DISPONIBLES" ? agent.disponible : filtre === "OCCUPES" ? (agent.missionsActives ?? 0) > 0 : true
      ),
    [agents, filtre]
  );

  if (loading) return <Chargement texte="Chargement des agents..." />;

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Agents de ma zone"
        description={zone ? `Agents de collecte affectés à ${zone.nomZone}` : "Agents de collecte de votre zone"}
        actions={
          <SecondaryButton icone={RefreshCw} chargement={refreshing} onClick={() => charger(true)}>
            Actualiser
          </SecondaryButton>
        }
      />

      {error && <BandeauErreur message={error} onReessayer={() => charger()} />}

      <div className="grid grid-cols-3 gap-3 lg:gap-4">
        <KpiCard libelle="Agents" valeur={agents.length} icone={Users} teinte="gris" />
        <KpiCard libelle="Disponibles" valeur={disponibles} icone={UserCheck} teinte="vert" />
        <KpiCard libelle="En mission" valeur={enMission} icone={ClipboardPlus} teinte="bleu" />
      </div>

      <FilterChips
        valeur={filtre}
        onChange={setFiltre}
        options={[
          { valeur: "TOUS", libelle: "Tous", compteur: agents.length },
          { valeur: "DISPONIBLES", libelle: "Disponibles", compteur: disponibles, couleur: "#16a34a" },
          { valeur: "OCCUPES", libelle: "En mission", compteur: enMission, couleur: "#0ea5e9" },
        ]}
      />

      {visibles.length === 0 ? (
        <Card>
          <EtatVide
            icone={Users}
            titre={agents.length === 0 ? "Aucun agent dans votre zone" : "Aucun agent pour ce filtre"}
            description={
              agents.length === 0
                ? "L'administrateur doit affecter des agents de collecte à votre zone."
                : undefined
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibles.map((agent) => {
            const actives = agent.missionsActives ?? 0;
            const limite = agent.limiteMissions ?? 5;

            return (
              <Card key={agent.idUtilisateur} className="flex flex-col p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <Avatar prenom={agent.prenom} nom={agent.nom} photo={agent.photoProfil} taille={52} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-900">
                      {agent.prenom} {agent.nom}
                    </p>
                    <div className="mt-1">
                      <StatutBadge ton={agent.disponible ? "vert" : "orange"}>
                        {agent.statutCompte !== "ACTIF"
                          ? "Compte inactif"
                          : agent.disponible
                            ? "Disponible"
                            : "Charge maximale"}
                      </StatutBadge>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-sm text-slate-600">
                  {agent.telephone && (
                    <a href={`tel:${agent.telephone}`} className="flex items-center gap-2 hover:text-emerald-700">
                      <Phone size={15} className="text-slate-400" />
                      {agent.telephone}
                    </a>
                  )}
                  {agent.email && (
                    <p className="flex items-center gap-2 truncate">
                      <Mail size={15} className="shrink-0 text-slate-400" />
                      <span className="truncate">{agent.email}</span>
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="font-medium text-slate-500">Missions actives</span>
                    <span className="font-bold text-slate-800">
                      {actives} / {limite}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${actives >= limite ? "bg-orange-500" : "bg-emerald-500"}`}
                      style={{ width: `${Math.min(100, (actives / limite) * 100)}%` }}
                    />
                  </div>
                </div>

                {agent.missions && agent.missions.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {agent.missions.map((mission) => (
                      <li
                        key={mission.idMission}
                        className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2"
                      >
                        <RefPill>{mission.bac?.reference ?? `Mission ${mission.idMission}`}</RefPill>
                        <StatutBadge ton={tonStatut(mission.statut)}>{libelleStatut(mission.statut)}</StatutBadge>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-auto pt-4">
                  <SecondaryButton
                    pleineLargeur
                    icone={ClipboardPlus}
                    disabled={!agent.disponible}
                    onClick={() => navigate(`/superviseur/interventions?ouvrir=1&agent=${agent.idUtilisateur}`)}
                  >
                    Assigner une intervention
                  </SecondaryButton>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Agents;
