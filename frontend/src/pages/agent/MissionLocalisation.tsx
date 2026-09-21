import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  ExternalLink,
  LocateFixed,
  MapPin,
  Maximize2,
  Navigation,
  Satellite,
  WifiOff,
} from "lucide-react";
import { toast } from "react-toastify";
import "leaflet/dist/leaflet.css";

import { iconeAgent, iconeBac } from "../../components/map/iconesCarte";
import {
  BandeauErreur,
  Card,
  Chargement,
  EtatBadge,
  LevelRing,
  PrimaryButton,
  RefPill,
  StatutBadge,
  libelleStatut,
  tonStatut,
} from "../../components/ui/kit";
import { useEcranAllume, useGeolocalisation } from "../../hooks/useGeolocalisation";
import { useTempsReel } from "../../hooks/useTempsReel";
import {
  envoyerPositionMission,
  obtenirLocalisationMission,
  type LocalisationMission,
} from "../../services/agentService";
import { obtenirCategorieNiveauBac } from "../../utils/bacLevel";
import {
  calculerItineraire,
  cheminRestant,
  distanceEntre,
  formaterDistance,
  formaterDuree,
  longueurChemin,
  type Coordonnees,
  type Itineraire,
} from "../../utils/itineraire";

// Déplacement minimal (m) avant de recalculer l'itinéraire, et délai minimal (ms) entre deux calculs.
const SEUIL_RECALCUL_M = 40;
const DELAI_RECALCUL_MS = 8000;
// Intervalle minimal (ms) entre deux envois de position au superviseur.
const INTERVALLE_ENVOI_MS = 15000;
// Distance (m) à partir de laquelle l'agent est considéré arrivé au bac.
const RAYON_ARRIVEE_M = 30;

/** Fait suivre la carte à l'agent ; un geste de l'utilisateur sur la carte désactive le suivi. */
function SuiviCarte({
  position,
  suivi,
  onLibere,
  points,
  declencheurVueEnsemble,
  destination,
}: {
  position: Coordonnees | null;
  suivi: boolean;
  onLibere: () => void;
  points: Coordonnees[];
  declencheurVueEnsemble: number;
  destination: Coordonnees | null;
}) {
  const carte = useMap();
  const premierSuivi = useRef(true);

  useMapEvents({ dragstart: onLibere });

  useEffect(() => {
    if (!suivi || !position) return;

    let zoom = Math.max(carte.getZoom(), 17);

    // Premier positionnement : si le bac est loin, on garde un zoom plus large.
    if (premierSuivi.current && destination) {
      const distance = distanceEntre(position, destination);
      zoom = distance > 2000 ? 15 : distance > 800 ? 16 : 17;
      premierSuivi.current = false;
    }

    carte.setView(position, zoom, { animate: true, duration: 0.6 });
  }, [position, suivi, carte, destination]);

  useEffect(() => {
    if (declencheurVueEnsemble > 0 && points.length > 1) {
      carte.fitBounds(points, { padding: [70, 70], maxZoom: 17 });
    }
    // Uniquement à l'appui sur « Vue d'ensemble ».
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [declencheurVueEnsemble]);

  return null;
}

const MissionLocalisation = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const idMission = Number(id);

  const [data, setData] = useState<LocalisationMission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [suivi, setSuivi] = useState(true);
  const [vueEnsemble, setVueEnsemble] = useState(0);
  const [itineraire, setItineraire] = useState<Itineraire | null>(null);

  const departCalcule = useRef<Coordonnees | null>(null);
  const dernierCalcul = useRef(0);
  const dernierEnvoi = useRef(0);
  const arriveeSignalee = useRef(false);

  const { position, erreur: erreurGps } = useGeolocalisation(true);
  useEcranAllume(true);

  const charger = useCallback(async () => {
    if (!Number.isInteger(idMission) || idMission <= 0) {
      setError("Identifiant de mission invalide.");
      setLoading(false);
      return;
    }

    try {
      setError("");
      setData(await obtenirLocalisationMission(idMission));
    } catch (err: any) {
      setError(err?.response?.data?.message || "Impossible de récupérer la localisation de la mission.");
    } finally {
      setLoading(false);
    }
  }, [idMission]);

  useEffect(() => {
    charger();
    const intervalle = window.setInterval(charger, 30000);
    return () => window.clearInterval(intervalle);
  }, [charger]);

  useTempsReel(() => charger());

  const destination = useMemo<Coordonnees | null>(() => {
    const lat = data?.pointCollecte.latitude;
    const lng = data?.pointCollecte.longitude;

    if (lat === null || lat === undefined || lng === null || lng === undefined) return null;
    const a = Number(lat);
    const b = Number(lng);

    return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180 ? [a, b] : null;
  }, [data]);

  const coordonneesAgent = position?.coordonnees ?? null;
  const missionEnCours = data?.mission.statut === "EN_COURS";

  // Itinéraire routier : recalculé quand l'agent s'est déplacé de plus de 40 m (au plus toutes les 8 s).
  useEffect(() => {
    if (!coordonneesAgent || !destination) return;

    const dejaCalcule = departCalcule.current !== null && itineraire !== null;
    if (dejaCalcule) {
      if (distanceEntre(departCalcule.current as Coordonnees, coordonneesAgent) < SEUIL_RECALCUL_M) return;
      if (Date.now() - dernierCalcul.current < DELAI_RECALCUL_MS) return;
    }

    const controleur = new AbortController();
    departCalcule.current = coordonneesAgent;
    dernierCalcul.current = Date.now();

    calculerItineraire(coordonneesAgent, destination, controleur.signal)
      .then(setItineraire)
      .catch(() => undefined);

    return () => controleur.abort();
    // `itineraire` volontairement exclu : il ne doit pas relancer le calcul.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordonneesAgent, destination]);

  // Transmet la position au superviseur tant que la mission est en cours.
  useEffect(() => {
    if (!missionEnCours || !coordonneesAgent) return;
    if (Date.now() - dernierEnvoi.current < INTERVALLE_ENVOI_MS) return;

    dernierEnvoi.current = Date.now();
    envoyerPositionMission(idMission, coordonneesAgent[0], coordonneesAgent[1]).catch(() => undefined);
  }, [missionEnCours, coordonneesAgent, idMission]);

  // Trajet restant : se raccourcit au fil des déplacements.
  const trajet = useMemo(
    () => (itineraire && coordonneesAgent ? cheminRestant(itineraire.points, coordonneesAgent) : null),
    [itineraire, coordonneesAgent]
  );

  const restant = useMemo(() => {
    if (!trajet || !itineraire) return null;
    const distanceM = longueurChemin(trajet);
    const part = itineraire.distanceM > 0 ? Math.min(1, distanceM / itineraire.distanceM) : 1;

    return { distanceM, dureeS: itineraire.dureeS * part };
  }, [trajet, itineraire]);

  const distanceBac = coordonneesAgent && destination ? distanceEntre(coordonneesAgent, destination) : null;
  const arrive = distanceBac !== null && distanceBac <= RAYON_ARRIVEE_M;

  useEffect(() => {
    if (distanceBac === null) return;

    if (arrive && !arriveeSignalee.current) {
      arriveeSignalee.current = true;
      navigator.vibrate?.([200, 100, 200]);
      toast.success(`Vous êtes arrivé au bac ${data?.pointCollecte.reference ?? ""}.`, { toastId: "arrivee-bac" });
    } else if (distanceBac > RAYON_ARRIVEE_M * 3) {
      arriveeSignalee.current = false;
    }
  }, [arrive, distanceBac, data]);

  const capArrondi = position?.cap == null ? null : Math.round(position.cap / 10) * 10;
  const iconeDeLAgent = useMemo(() => iconeAgent(capArrondi), [capArrondi]);

  if (loading) return <Chargement texte="Chargement de la carte..." />;

  if (!data) {
    return (
      <div className="space-y-4">
        <Link to="/agent/missions" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
          <ArrowLeft size={17} /> Retour aux missions
        </Link>
        <BandeauErreur message={error || "Localisation indisponible."} onReessayer={charger} />
      </div>
    );
  }

  const bac = data.pointCollecte;
  const categorie = obtenirCategorieNiveauBac(bac.niveau_remplissage);
  const pointsVue = [destination, coordonneesAgent].filter((p): p is Coordonnees => Boolean(p));

  const ouvrirNavigation = () => {
    if (!destination) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${destination[0]},${destination[1]}&travelmode=driving`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          to={`/agent/missions/${data.mission.idMission}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={17} /> Mission n°{data.mission.idMission}
        </Link>
        <StatutBadge ton={tonStatut(data.mission.statut)}>{libelleStatut(data.mission.statut)}</StatutBadge>
      </div>

      {error && <BandeauErreur message={error} onReessayer={charger} />}

      {data.mission.statut === "AFFECTEE" && (
        <div className="flex flex-col gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800 sm:flex-row sm:items-center sm:justify-between">
          <p>Démarrez la mission pour que votre superviseur puisse suivre votre trajet.</p>
          <Link
            to={`/agent/missions/${data.mission.idMission}`}
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-sky-600 px-4 py-2 font-bold text-white"
          >
            Aller à la mission
          </Link>
        </div>
      )}

      <Card className="relative overflow-hidden">
        {destination ? (
          <div className="relative h-[calc(100dvh-15rem)] min-h-[400px] w-full lg:h-[640px]">
            <MapContainer center={destination} zoom={16} zoomControl={false} scrollWheelZoom className="z-0 h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ZoomControl position="bottomleft" />
              <SuiviCarte
                position={coordonneesAgent}
                suivi={suivi}
                onLibere={() => setSuivi(false)}
                points={pointsVue}
                declencheurVueEnsemble={vueEnsemble}
                destination={destination}
              />

              {trajet && (
                <Polyline
                  positions={trajet}
                  pathOptions={{
                    color: "#2563eb",
                    weight: 6,
                    opacity: 0.9,
                    dashArray: itineraire?.approximatif ? "10 10" : undefined,
                  }}
                />
              )}

              {position && (
                <>
                  <Circle
                    center={position.coordonnees}
                    radius={position.precision}
                    pathOptions={{ color: "#2563eb", weight: 1, fillOpacity: 0.1 }}
                  />
                  <Marker position={position.coordonnees} icon={iconeDeLAgent} zIndexOffset={900}>
                    <Popup>Votre position (± {Math.round(position.precision)} m)</Popup>
                  </Marker>
                </>
              )}

              <Marker position={destination} icon={iconeBac(bac.niveau_remplissage, true)} zIndexOffset={1000}>
                <Popup>
                  <p className="text-sm font-bold">{bac.reference}</p>
                  <p className="text-xs text-slate-500">{Math.round(Number(bac.niveau_remplissage) || 0)}% rempli</p>
                </Popup>
              </Marker>
            </MapContainer>

            {/* Tableau de bord de navigation */}
            <div className="pointer-events-none absolute inset-x-3 top-3 z-[1000] flex items-start justify-between gap-2">
              <div
                className={`pointer-events-auto rounded-2xl px-4 py-3 shadow-lg backdrop-blur ${
                  arrive ? "bg-emerald-600 text-white" : "bg-slate-900/90 text-white"
                }`}
              >
                {arrive ? (
                  <p className="flex items-center gap-2 text-sm font-bold">
                    <CheckCircle2 size={18} /> Vous êtes arrivé au bac
                  </p>
                ) : restant ? (
                  <>
                    <p className="text-2xl font-bold leading-none">{formaterDistance(restant.distanceM)}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-white/70">
                      <Clock size={12} /> {formaterDuree(restant.dureeS)}
                      {itineraire?.approximatif && " · estimé"}
                    </p>
                  </>
                ) : (
                  <p className="text-sm font-semibold">{erreurGps ? "GPS indisponible" : "Recherche du GPS…"}</p>
                )}
                <p className="mt-1.5 font-mono text-[11px] text-white/60">#{bac.reference}</p>
              </div>

              <span
                className={`pointer-events-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-lg ${
                  erreurGps
                    ? "bg-red-600 text-white"
                    : position
                      ? position.precision <= 30
                        ? "bg-white text-emerald-700"
                        : "bg-white text-orange-600"
                      : "bg-white text-slate-500"
                }`}
              >
                {erreurGps ? <WifiOff size={13} /> : <Satellite size={13} />}
                {erreurGps ? "GPS coupé" : position ? `GPS ± ${Math.round(position.precision)} m` : "GPS…"}
              </span>
            </div>

            {/* Boutons flottants */}
            <div className="absolute bottom-6 right-3 z-[1000] flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setSuivi(false);
                  setVueEnsemble((valeur) => valeur + 1);
                }}
                aria-label="Vue d'ensemble"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg ring-1 ring-slate-200 transition active:scale-95"
              >
                <Maximize2 size={20} />
              </button>
              <button
                type="button"
                onClick={() => setSuivi((valeur) => !valeur)}
                aria-label={suivi ? "Arrêter le suivi" : "Me suivre"}
                aria-pressed={suivi}
                className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition active:scale-95 ${
                  suivi ? "bg-emerald-600 text-white" : "bg-white text-emerald-700 ring-1 ring-slate-200"
                }`}
              >
                <LocateFixed size={24} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[320px] flex-col items-center justify-center p-6 text-center">
            <MapPin size={40} className="text-slate-300" />
            <p className="mt-3 font-semibold text-slate-800">Position du bac indisponible</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">Les coordonnées GPS de ce bac ne sont pas renseignées.</p>
          </div>
        )}
      </Card>

      {erreurGps && (
        <p className="flex items-start gap-2 rounded-2xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
          <WifiOff size={16} className="mt-0.5 shrink-0" />
          {erreurGps}
        </p>
      )}

      <Card severite={categorie} className="p-4">
        <div className="flex items-center gap-4">
          <LevelRing niveau={bac.niveau_remplissage} taille={68} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <RefPill>#{bac.reference}</RefPill>
              <EtatBadge niveau={bac.niveau_remplissage} />
            </div>
            <p className="mt-1.5 truncate text-sm font-bold text-slate-900">{bac.zone?.nomZone ?? "Zone non renseignée"}</p>
            {categorie !== "NORMAL" && missionEnCours && (
              <p className="mt-1 text-xs text-orange-600">Videz le bac : la mission se termine quand le capteur le confirme.</p>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <PrimaryButton icone={ClipboardCheck} onClick={() => navigate(`/agent/missions/${data.mission.idMission}`)}>
            {arrive ? "Traiter la mission" : "Détails de la mission"}
          </PrimaryButton>
          <button
            type="button"
            onClick={ouvrirNavigation}
            disabled={!destination}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
          >
            <Navigation size={17} />
            Ouvrir dans Maps <ExternalLink size={14} />
          </button>
        </div>
      </Card>
    </div>
  );
};

export default MissionLocalisation;
