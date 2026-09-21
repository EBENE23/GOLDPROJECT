import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { AlertTriangle, CheckCircle2, Clock, LocateFixed, MapPin, Send } from "lucide-react";

import {
  BandeauErreur,
  Card,
  Chargement,
  EtatVide,
  FilterChips,
  PageHeader,
  PrimaryButton,
  RefPill,
  SectionTitle,
  StatutBadge,
  dateRelative,
} from "../../components/ui/kit";
import FiltreDates from "../../components/ui/FiltreDates";
import { useTempsReel } from "../../hooks/useTempsReel";
import { creerIncidentAgent, listerIncidentsAgent, type IncidentAgent } from "../../services/incidentService";
import { listerMissionsAgent, type AgentMission } from "../../services/agentService";
import { dansPlage, plageVide, type PlageDates } from "../../utils/plageDates";

type Filtre = "TOUS" | "OUVERT" | "TRAITE";

const MAX_DESCRIPTION = 2000;

const Signalements = () => {
  const [searchParams] = useSearchParams();
  const [missions, setMissions] = useState<AgentMission[]>([]);
  const [incidents, setIncidents] = useState<IncidentAgent[]>([]);
  const [idMission, setIdMission] = useState(searchParams.get("mission") ?? "");
  const [description, setDescription] = useState("");
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [recherchePosition, setRecherchePosition] = useState(false);
  const [filtre, setFiltre] = useState<Filtre>("TOUS");
  const [periode, setPeriode] = useState<PlageDates>(plageVide);
  const [loading, setLoading] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [error, setError] = useState("");
  const [erreurForm, setErreurForm] = useState("");

  const charger = useCallback(async () => {
    try {
      setError("");
      const [reponseMissions, reponseIncidents] = await Promise.all([listerMissionsAgent(), listerIncidentsAgent()]);
      setMissions(reponseMissions.missions);
      setIncidents(reponseIncidents);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Impossible de charger les signalements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  useTempsReel(() => charger());

  // Missions sur lesquelles un problème peut être signalé.
  const missionsActives = useMemo(
    () => missions.filter((m) => ["AFFECTEE", "EN_COURS", "SUSPENDUE"].includes(m.statut)),
    [missions]
  );

  // Présélectionne la mission en cours s'il n'y en a qu'une.
  useEffect(() => {
    if (!idMission && missionsActives.length === 1) {
      setIdMission(String(missionsActives[0].idMission));
    }
  }, [missionsActives, idMission]);

  const libelleMission = (id: number) => {
    const mission = missions.find((m) => m.idMission === id);
    return mission?.intervention?.bac?.reference ? `Bac ${mission.intervention.bac.reference}` : `Mission n°${id}`;
  };

  const localiser = () => {
    if (!("geolocation" in navigator) || !window.isSecureContext) {
      toast.warning("La localisation n'est pas disponible sur cette connexion.");
      return;
    }

    setRecherchePosition(true);
    navigator.geolocation.getCurrentPosition(
      (resultat) => {
        setPosition({ lat: resultat.coords.latitude, lng: resultat.coords.longitude });
        setRecherchePosition(false);
        toast.success("Position ajoutée au signalement.", { autoClose: 2000 });
      },
      () => {
        setRecherchePosition(false);
        toast.error("Impossible d'obtenir votre position. Vérifiez l'autorisation de localisation.");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const envoyer = async (event: FormEvent) => {
    event.preventDefault();
    setErreurForm("");

    if (!idMission) return setErreurForm("Choisissez la mission concernée.");
    if (description.trim().length < 5) return setErreurForm("Décrivez le problème en quelques mots (5 caractères minimum).");

    try {
      setEnvoi(true);
      await creerIncidentAgent(Number(idMission), {
        description: description.trim(),
        latitude: position?.lat ?? null,
        longitude: position?.lng ?? null,
      });
      toast.success("Problème signalé. Votre superviseur a été prévenu.");
      setDescription("");
      setPosition(null);
      await charger();
    } catch (err: any) {
      setErreurForm(err?.response?.data?.message || "Impossible d'envoyer le signalement.");
    } finally {
      setEnvoi(false);
    }
  };

  const visibles = useMemo(
    () =>
      incidents
        .filter((i) => filtre === "TOUS" || i.statut === filtre)
        .filter((i) => dansPlage(i.dateCreation, periode))
        .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()),
    [incidents, filtre, periode]
  );

  if (loading) return <Chargement texte="Chargement des signalements..." />;

  const champ =
    "w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

  return (
    <div className="space-y-5">
      <PageHeader titre="Signaler un problème" description="Prévenez votre superviseur d'une difficulté rencontrée pendant une mission." />

      {error && <BandeauErreur message={error} onReessayer={charger} />}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card className="p-5 sm:p-6">
          <SectionTitle icone={AlertTriangle} titre="Nouveau signalement" sousTitre="Transmis immédiatement au superviseur" />

          {missionsActives.length === 0 ? (
            <EtatVide
              icone={CheckCircle2}
              titre="Aucune mission en cours"
              description="Un problème se signale sur une mission qui vous est affectée."
            />
          ) : (
            <form onSubmit={envoyer} className="mt-5 space-y-4" noValidate>
              {erreurForm && (
                <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erreurForm}</p>
              )}

              <label className="block text-sm font-semibold text-slate-700">
                Mission concernée
                <select className={`${champ} mt-1.5 h-11`} value={idMission} onChange={(e) => setIdMission(e.target.value)}>
                  <option value="">Sélectionner une mission</option>
                  {missionsActives.map((m) => (
                    <option key={m.idMission} value={m.idMission}>
                      {libelleMission(m.idMission)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Description du problème
                <textarea
                  rows={4}
                  maxLength={MAX_DESCRIPTION}
                  className={`${champ} mt-1.5 py-2.5`}
                  placeholder="Ex. : accès bloqué par un véhicule, bac endommagé…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <span className="mt-1 block text-right text-[11px] font-normal text-slate-400">
                  {description.length}/{MAX_DESCRIPTION}
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-3">
                <button
                  type="button"
                  onClick={localiser}
                  disabled={recherchePosition}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 active:scale-95 disabled:opacity-60"
                >
                  <LocateFixed size={15} className={recherchePosition ? "animate-pulse" : ""} />
                  {recherchePosition ? "Localisation…" : "Ajouter ma position"}
                </button>
                {position ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    <MapPin size={13} />
                    {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Facultatif</span>
                )}
              </div>

              <PrimaryButton type="submit" icone={Send} chargement={envoi} pleineLargeur>
                Envoyer le signalement
              </PrimaryButton>
            </form>
          )}
        </Card>

        <section className="space-y-3">
          <SectionTitle icone={Clock} titre="Mes signalements" sousTitre={`${incidents.length} au total`} />
          <FilterChips
            valeur={filtre}
            onChange={setFiltre}
            options={[
              { valeur: "TOUS", libelle: "Tous", compteur: incidents.length },
              { valeur: "OUVERT", libelle: "Ouverts", compteur: incidents.filter((i) => i.statut === "OUVERT").length, couleur: "#f97316" },
              { valeur: "TRAITE", libelle: "Traités", compteur: incidents.filter((i) => i.statut === "TRAITE").length, couleur: "#16a34a" },
            ]}
          />
          <FiltreDates valeur={periode} onChange={setPeriode} />

          {visibles.length === 0 ? (
            <Card>
              <EtatVide icone={AlertTriangle} titre="Aucun signalement" description="Vos signalements apparaîtront ici." />
            </Card>
          ) : (
            visibles.map((incident) => (
              <Card key={incident.idIncident} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <RefPill>{libelleMission(incident.id_mission)}</RefPill>
                  <StatutBadge ton={incident.statut === "TRAITE" ? "vert" : "orange"}>
                    {incident.statut === "TRAITE" ? "Traité" : "Ouvert"}
                  </StatutBadge>
                </div>
                <p className="mt-2 text-sm text-slate-700">{incident.description}</p>
                <p className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                  <span>{dateRelative(incident.dateCreation)}</span>
                  {incident.latitude !== null && incident.latitude !== undefined && (
                    <span className="flex items-center gap-1">
                      <MapPin size={11} />
                      {Number(incident.latitude).toFixed(4)}, {Number(incident.longitude).toFixed(4)}
                    </span>
                  )}
                </p>
              </Card>
            ))
          )}
        </section>
      </div>
    </div>
  );
};

export default Signalements;
