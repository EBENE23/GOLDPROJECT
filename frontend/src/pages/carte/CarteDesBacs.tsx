import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap } from "react-leaflet";
import { ClipboardPlus, ExternalLink, History, LocateFixed, MapPin, Navigation, Search, X } from "lucide-react";
import "leaflet/dist/leaflet.css";

import { iconeAgent, iconeBac } from "../../components/map/iconesCarte";
import {
  BandeauErreur,
  Card,
  Chargement,
  EtatBadge,
  EtatVide,
  FilterChips,
  LevelRing,
  PageHeader,
  PrimaryButton,
  RefPill,
  SecondaryButton,
  etatMeta,
} from "../../components/ui/kit";
import { useGeolocalisation } from "../../hooks/useGeolocalisation";
import { useTempsReel } from "../../hooks/useTempsReel";
import { obtenirLocalisationBacsAgent } from "../../services/agentService";
import { obtenirLocalisationBacs } from "../../services/superviseurService";
import { obtenirCategorieNiveauBac, type BacLevelCategory } from "../../utils/bacLevel";
import { distanceEntre, formaterDistance, type Coordonnees } from "../../utils/itineraire";
import { useTranslation } from "../../i18n";

interface BacCarte {
  id_bac: number;
  reference: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  niveau_remplissage: number | string;
}

type Filtre = "TOUS" | BacLevelCategory;

const versCoordonnees = (bac: BacCarte): Coordonnees | null => {
  if (bac.latitude === null || bac.latitude === undefined || bac.longitude === null || bac.longitude === undefined) return null;
  const lat = Number(bac.latitude);
  const lng = Number(bac.longitude);

  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? [lat, lng] : null;
};

/** Ajuste la vue : sur le bac sélectionné, sinon sur l'ensemble des bacs visibles. */
function AjusterVue({ points, cible, declencheur }: { points: Coordonnees[]; cible: Coordonnees | null; declencheur: number }) {
  const carte = useMap();
  const cle = points.map((p) => p.join(",")).join("|");

  useEffect(() => {
    if (cible) {
      carte.flyTo(cible, Math.max(carte.getZoom(), 16), { duration: 0.8 });
    } else if (points.length === 1) {
      carte.setView(points[0], 16);
    } else if (points.length > 1) {
      carte.fitBounds(points, { padding: [50, 50], maxZoom: 17 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle, cible?.join(","), declencheur]);

  return null;
}

/** Carte interactive des bacs de la zone, partagée par le superviseur et l'agent. */
export default function CarteDesBacs({ role }: { role: "SUPERVISEUR" | "AGENT_COLLECTE" }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const estSuperviseur = role === "SUPERVISEUR";
  const [bacs, setBacs] = useState<BacCarte[]>([]);
  const [zone, setZone] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("TOUS");
  const [recherche, setRecherche] = useState("");
  const [selection, setSelection] = useState<number | null>(null);
  const [vueEnsemble, setVueEnsemble] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { position, erreur: erreurGps } = useGeolocalisation(true);

  const charger = useCallback(async () => {
    try {
      setError("");
      const reponse = estSuperviseur ? await obtenirLocalisationBacs() : await obtenirLocalisationBacsAgent();
      setBacs((reponse.bacs ?? []) as BacCarte[]);
      setZone(reponse.zone?.nomZone ?? "");
    } catch (err: any) {
      setError(err?.response?.data?.message || t("carteDesBacs.erreurChargement"));
    } finally {
      setLoading(false);
    }
  }, [estSuperviseur, t]);

  useEffect(() => {
    charger();
    const intervalle = window.setInterval(charger, 20000);
    return () => window.clearInterval(intervalle);
  }, [charger]);

  useTempsReel(() => charger());

  const compte = (categorie: BacLevelCategory) =>
    bacs.filter((bac) => obtenirCategorieNiveauBac(bac.niveau_remplissage) === categorie).length;

  const coordonneesAgent = position?.coordonnees ?? null;

  const visibles = useMemo(() => {
    const terme = recherche.trim().toLowerCase();

    return bacs
      .filter((bac) => filtre === "TOUS" || obtenirCategorieNiveauBac(bac.niveau_remplissage) === filtre)
      .filter((bac) => !terme || bac.reference.toLowerCase().includes(terme))
      .sort((a, b) => {
        // Les plus remplis d'abord ; à égalité, les plus proches.
        const ecart = Number(b.niveau_remplissage) - Number(a.niveau_remplissage);
        if (ecart !== 0 || !coordonneesAgent) return ecart;
        const ca = versCoordonnees(a);
        const cb = versCoordonnees(b);
        return (ca ? distanceEntre(coordonneesAgent, ca) : Infinity) - (cb ? distanceEntre(coordonneesAgent, cb) : Infinity);
      });
  }, [bacs, filtre, recherche, coordonneesAgent]);

  const localises = visibles.filter((bac) => versCoordonnees(bac) !== null);
  const pointsVue = localises.map((bac) => versCoordonnees(bac) as Coordonnees);
  const bacChoisi = bacs.find((bac) => bac.id_bac === selection) ?? null;
  const cibleChoisie = bacChoisi ? versCoordonnees(bacChoisi) : null;

  if (loading) return <Chargement texte={t("agentMissionLocalisation.chargement")} />;

  const ouvrirNavigation = (bac: BacCarte) => {
    const cible = versCoordonnees(bac);
    if (!cible) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${cible[0]},${cible[1]}&travelmode=driving`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        titre={t("shell.titreCarteBacs")}
        description={zone ? t("carteDesBacs.descriptionZone", { zone }) : t("carteDesBacs.descriptionGenerique")}
      />

      {error && <BandeauErreur message={error} onReessayer={charger} />}

      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={recherche}
          onChange={(event) => setRecherche(event.target.value)}
          placeholder={t("superviseurBacs.rechercherPlaceholder")}
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
        />
      </div>

      <FilterChips
        valeur={filtre}
        onChange={setFiltre}
        options={[
          { valeur: "TOUS", libelle: t("adminUtilisateurs.filtreTous"), compteur: bacs.length },
          { valeur: "PLEIN", libelle: t("superviseurBacs.filtreCritiques"), compteur: compte("PLEIN"), couleur: etatMeta.PLEIN.couleur },
          { valeur: "ALERTE", libelle: t("superviseurBacs.filtreAlertes"), compteur: compte("ALERTE"), couleur: etatMeta.ALERTE.couleur },
          { valeur: "NORMAL", libelle: t("superviseurBacs.filtreNormaux"), compteur: compte("NORMAL"), couleur: etatMeta.NORMAL.couleur },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Card className="relative overflow-hidden">
          {bacs.length === 0 ? (
            <EtatVide icone={MapPin} titre={t("superviseurHistoriques.aucunBacZone")} />
          ) : localises.length === 0 && !coordonneesAgent ? (
            <EtatVide icone={MapPin} titre={t("carteDesBacs.aucunBacAAfficher")} description={t("carteDesBacs.modifierRechercheFiltreGps")} />
          ) : (
            <div className="relative h-[52dvh] min-h-[340px] w-full xl:h-[600px]">
              <MapContainer center={pointsVue[0] ?? coordonneesAgent ?? [3.8667, 11.5167]} zoom={14} zoomControl={false} scrollWheelZoom className="z-0 h-full w-full">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ZoomControl position="bottomleft" />
                <AjusterVue points={pointsVue} cible={cibleChoisie} declencheur={vueEnsemble} />

                {localises.map((bac) => (
                  <Marker
                    key={bac.id_bac}
                    position={versCoordonnees(bac) as Coordonnees}
                    icon={iconeBac(bac.niveau_remplissage, bac.id_bac === selection)}
                    zIndexOffset={bac.id_bac === selection ? 1000 : Math.round(Number(bac.niveau_remplissage))}
                    eventHandlers={{ click: () => setSelection(bac.id_bac) }}
                  >
                    <Popup>
                      <p className="text-sm font-bold">{bac.reference}</p>
                      <p className="text-xs text-slate-500">{t("notifications.pourcentRempli", { n: Math.round(Number(bac.niveau_remplissage)) })}</p>
                    </Popup>
                  </Marker>
                ))}

                {coordonneesAgent && (
                  <Marker position={coordonneesAgent} icon={iconeAgent(position?.cap ?? null)} zIndexOffset={900}>
                    <Popup>{t("carteDesBacs.vousEtesIci")}</Popup>
                  </Marker>
                )}
              </MapContainer>

              <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelection(null);
                    setVueEnsemble((v) => v + 1);
                  }}
                  aria-label={t("carteDesBacs.voirTousLesBacs")}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg ring-1 ring-slate-200 transition active:scale-95"
                >
                  <MapPin size={19} />
                </button>
                {coordonneesAgent && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelection(null);
                      setVueEnsemble((v) => v + 1);
                    }}
                    aria-label={t("carteDesBacs.meSituer")}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition active:scale-95"
                  >
                    <LocateFixed size={19} />
                  </button>
                )}
              </div>

              {erreurGps && !coordonneesAgent && (
                <p className="absolute inset-x-3 bottom-3 z-[1000] rounded-xl bg-white/95 px-3 py-2 text-xs text-orange-700 shadow">
                  {t("carteDesBacs.positionNonAffichee", { erreur: erreurGps })}
                </p>
              )}
            </div>
          )}
        </Card>

        <div className="space-y-3">
          {bacChoisi && (
            <Card severite={obtenirCategorieNiveauBac(bacChoisi.niveau_remplissage)} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-4">
                  <LevelRing niveau={bacChoisi.niveau_remplissage} taille={68} />
                  <div className="min-w-0">
                    <RefPill>#{bacChoisi.reference}</RefPill>
                    <div className="mt-1.5">
                      <EtatBadge niveau={bacChoisi.niveau_remplissage} />
                    </div>
                    {cibleChoisie && coordonneesAgent && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                        <Navigation size={12} />{t("carteDesBacs.aDistanceDeVous", { distance: formaterDistance(distanceEntre(coordonneesAgent, cibleChoisie)) })}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelection(null)}
                  aria-label={t("adminBacs.fermer")}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {estSuperviseur && obtenirCategorieNiveauBac(bacChoisi.niveau_remplissage) !== "NORMAL" && (
                  <PrimaryButton
                    icone={ClipboardPlus}
                    className="col-span-2"
                    onClick={() => navigate(`/superviseur/interventions?ouvrir=1&bac=${bacChoisi.id_bac}`)}
                  >
                    {t("bacCard.creerIntervention")}
                  </PrimaryButton>
                )}
                <SecondaryButton icone={ExternalLink} onClick={() => ouvrirNavigation(bacChoisi)} disabled={!cibleChoisie}>
                  {t("missionCard.itineraire")}
                </SecondaryButton>
                {estSuperviseur ? (
                  <SecondaryButton icone={History} onClick={() => navigate("/superviseur/historiques")}>
                    {t("bacCard.historique")}
                  </SecondaryButton>
                ) : (
                  <SecondaryButton icone={Navigation} onClick={() => navigate("/agent/missions")}>
                    {t("shell.titreMesMissions")}
                  </SecondaryButton>
                )}
              </div>
            </Card>
          )}

          <div className="max-h-[520px] space-y-2 overflow-y-auto pr-0.5 xl:max-h-[540px]">
            {visibles.length === 0 ? (
              <Card>
                <EtatVide icone={MapPin} titre={t("carteDesBacs.aucunBacCorrespond")} />
              </Card>
            ) : (
              visibles.map((bac) => {
                const cible = versCoordonnees(bac);
                const actif = bac.id_bac === selection;

                return (
                  <button
                    key={bac.id_bac}
                    type="button"
                    onClick={() => setSelection(actif ? null : bac.id_bac)}
                    className={`flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left shadow-sm transition active:scale-[0.99] ${
                      actif ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <LevelRing niveau={bac.niveau_remplissage} taille={46} epaisseur={5} />
                    <div className="min-w-0 flex-1">
                      <RefPill>#{bac.reference}</RefPill>
                      <p className="mt-1 text-xs text-slate-500">
                        {cible
                          ? coordonneesAgent
                            ? t("carteDesBacs.aDistance", { distance: formaterDistance(distanceEntre(coordonneesAgent, cible)) })
                            : `${cible[0].toFixed(4)}° N, ${cible[1].toFixed(4)}° E`
                          : t("carteDesBacs.positionGpsNonRenseignee")}
                      </p>
                    </div>
                    <EtatBadge niveau={bac.niveau_remplissage} />
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
