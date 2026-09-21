import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import { CheckCircle2, ClipboardList, Clock, MapPin, Navigation, Phone, RefreshCw, Truck } from "lucide-react";
import "leaflet/dist/leaflet.css";

import AjusterVue from "../../components/map/AjusterVue";
import { iconeAgent, iconeBac } from "../../components/map/iconesCarte";
import {
  BandeauErreur,
  Card,
  Chargement,
  EtatBadge,
  EtatVide,
  FilterChips,
  KpiCard,
  LevelBar,
  PageHeader,
  RefPill,
  SecondaryButton,
  SectionTitle,
  StatutBadge,
  dateRelative,
  libelleStatut,
  tonStatut,
} from "../../components/ui/kit";
import {
  suivreInterventionsSuperviseur,
  type Intervention,
} from "../../services/superviseurService";
import { obtenirCategorieNiveauBac } from "../../utils/bacLevel";
import { distanceEntre, formaterDistance, type Coordonnees } from "../../utils/itineraire";
import { useTempsReel } from "../../hooks/useTempsReel";

type Filtre = "TOUTES" | "EN_COURS" | "PLANIFIEE" | "EN_ATTENTE";

const versCoordonnees = (lat: unknown, lng: unknown): Coordonnees | null => {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return null;
  const a = Number(lat);
  const b = Number(lng);

  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180 ? [a, b] : null;
};

const Suivi = () => {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [filtre, setFiltre] = useState<Filtre>("TOUTES");
  const [selection, setSelection] = useState<number | null>(null);
  const [recentrage, setRecentrage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const charger = useCallback(async (actualisation = false) => {
    try {
      setError("");
      if (actualisation) setRefreshing(true);
      const reponse = await suivreInterventionsSuperviseur();
      setInterventions(reponse.interventions);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Impossible de charger le suivi des interventions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    charger();
    const intervalle = window.setInterval(() => charger(), 10000);
    return () => window.clearInterval(intervalle);
  }, [charger]);

  useTempsReel(() => charger());

  const compte = (statut: string) => interventions.filter((item) => item.statut === statut).length;

  const visibles = useMemo(
    () => interventions.filter((item) => filtre === "TOUTES" || item.statut === filtre),
    [interventions, filtre]
  );

  const lignes = useMemo(
    () =>
      visibles.map((intervention) => {
        const bac = versCoordonnees(intervention.bac?.latitude, intervention.bac?.longitude);
        const mission = intervention.mission;
        const agent =
          mission?.statut === "EN_COURS"
            ? versCoordonnees(mission.latitudeAgent, mission.longitudeAgent)
            : null;

        return { intervention, bac, agent };
      }),
    [visibles]
  );

  const pointsCarte = useMemo(() => {
    const cible = lignes.filter((ligne) => selection === null || ligne.intervention.idIntervention === selection);
    return cible.flatMap((ligne) => [ligne.bac, ligne.agent]).filter((p): p is Coordonnees => p !== null);
  }, [lignes, selection]);

  if (loading) return <Chargement texte="Chargement du suivi..." />;

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Suivi des interventions"
        description="Bacs à traiter et position des agents en mission, actualisés toutes les 10 secondes."
        actions={
          <SecondaryButton icone={RefreshCw} chargement={refreshing} onClick={() => charger(true)}>
            Actualiser
          </SecondaryButton>
        }
      />

      {error && <BandeauErreur message={error} onReessayer={() => charger()} />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <KpiCard libelle="Actives" valeur={interventions.length} icone={ClipboardList} teinte="gris" />
        <KpiCard libelle="En cours" valeur={compte("EN_COURS")} icone={Truck} teinte="bleu" />
        <KpiCard libelle="Planifiées" valeur={compte("PLANIFIEE")} icone={CheckCircle2} teinte="vert" />
        <KpiCard libelle="En attente" valeur={compte("EN_ATTENTE")} icone={Clock} teinte="orange" />
      </div>

      <FilterChips
        valeur={filtre}
        onChange={(valeur) => {
          setFiltre(valeur);
          setSelection(null);
        }}
        options={[
          { valeur: "TOUTES", libelle: "Toutes", compteur: interventions.length },
          { valeur: "EN_COURS", libelle: "En cours", compteur: compte("EN_COURS"), couleur: "#0ea5e9" },
          { valeur: "PLANIFIEE", libelle: "Planifiées", compteur: compte("PLANIFIEE"), couleur: "#16a34a" },
          { valeur: "EN_ATTENTE", libelle: "En attente", compteur: compte("EN_ATTENTE"), couleur: "#f97316" },
        ]}
      />

      {interventions.length === 0 ? (
        <Card>
          <EtatVide
            icone={ClipboardList}
            titre="Aucune intervention active"
            description="Les interventions planifiées apparaîtront ici avec leur suivi sur la carte."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 p-4">
              <SectionTitle
                icone={MapPin}
                titre="Carte de suivi"
                sousTitre="Point coloré : bac • Point bleu : agent en mission"
                droite={
                  <button
                    type="button"
                    onClick={() => {
                      setSelection(null);
                      setRecentrage((valeur) => valeur + 1);
                    }}
                    className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                  >
                    Tout voir
                  </button>
                }
              />
            </div>
            <div className="h-[340px] w-full sm:h-[440px] xl:h-[560px]">
              <MapContainer center={[3.8667, 11.5167]} zoom={13} scrollWheelZoom className="z-0 h-full w-full">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <AjusterVue points={pointsCarte} declencheur={recentrage} />

                {lignes.map(({ intervention, bac, agent }) => {
                  const actif = selection === intervention.idIntervention;

                  return (
                    <span key={intervention.idIntervention}>
                      {bac && agent && (
                        <Polyline positions={[agent, bac]} pathOptions={{ color: "#2563eb", weight: 3, dashArray: "8 8" }} />
                      )}
                      {bac && (
                        <Marker
                          position={bac}
                          icon={iconeBac(intervention.bac?.niveau_remplissage, actif)}
                          zIndexOffset={actif ? 1000 : 0}
                          eventHandlers={{ click: () => setSelection(intervention.idIntervention) }}
                        >
                          <Popup>
                            <p className="text-sm font-bold">{intervention.bac?.reference}</p>
                            <p className="text-xs text-slate-500">
                              Remplissage : {Math.round(Number(intervention.bac?.niveau_remplissage) || 0)}%
                            </p>
                            <p className="text-xs text-slate-500">Statut : {libelleStatut(intervention.statut)}</p>
                          </Popup>
                        </Marker>
                      )}
                      {agent && (
                        <Marker position={agent} icon={iconeAgent()} zIndexOffset={900}>
                          <Popup>
                            <p className="text-sm font-bold">
                              {intervention.mission?.agent?.prenom} {intervention.mission?.agent?.nom}
                            </p>
                            <p className="text-xs text-slate-500">
                              Position {dateRelative(intervention.mission?.datePositionAgent)}
                            </p>
                          </Popup>
                        </Marker>
                      )}
                    </span>
                  );
                })}
              </MapContainer>
            </div>
          </Card>

          <div className="space-y-3">
            {lignes.length === 0 && (
              <Card>
                <EtatVide icone={ClipboardList} titre="Aucune intervention pour ce filtre" />
              </Card>
            )}

            {lignes.map(({ intervention, bac, agent }) => {
              const agentMission = intervention.mission?.agent;
              const distance = bac && agent ? distanceEntre(agent, bac) : null;
              const actif = selection === intervention.idIntervention;

              return (
                <Card
                  key={intervention.idIntervention}
                  severite={obtenirCategorieNiveauBac(intervention.bac?.niveau_remplissage)}
                  className={`p-4 transition ${actif ? "ring-2 ring-emerald-500" : ""}`}
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setSelection(actif ? null : intervention.idIntervention)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <RefPill>#{intervention.bac?.reference}</RefPill>
                        <p className="mt-1.5 text-sm font-bold text-slate-900">
                          Intervention n°{intervention.idIntervention}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <StatutBadge ton={tonStatut(intervention.statut)}>{libelleStatut(intervention.statut)}</StatutBadge>
                        <EtatBadge niveau={intervention.bac?.niveau_remplissage} />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-500">
                        {Math.round(Number(intervention.bac?.niveau_remplissage) || 0)}%
                      </span>
                      <LevelBar niveau={intervention.bac?.niveau_remplissage} />
                    </div>
                  </button>

                  <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
                    {agentMission ? (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-semibold text-slate-800">
                            {agentMission.prenom} {agentMission.nom}
                          </p>
                          {agentMission.telephone && (
                            <a
                              href={`tel:${agentMission.telephone}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"
                            >
                              <Phone size={13} />
                              Appeler
                            </a>
                          )}
                        </div>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <Navigation size={13} />
                          {intervention.mission?.statut === "EN_COURS"
                            ? agent
                              ? `À ${formaterDistance(distance ?? 0)} du bac • ${dateRelative(intervention.mission?.datePositionAgent)}`
                              : "Mission démarrée, position en attente…"
                            : `Mission ${libelleStatut(intervention.mission?.statut).toLowerCase()}`}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs font-medium text-orange-600">Aucun agent affecté</p>
                    )}
                  </div>

                  {intervention.motif && <p className="mt-2 text-xs text-slate-500">Motif : {intervention.motif}</p>}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Suivi;
