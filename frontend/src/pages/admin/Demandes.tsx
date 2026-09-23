import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";

import Avatar from "../../components/Avatar";
import FiltreDates from "../../components/ui/FiltreDates";
import Modal from "../../components/ui/Modal";
import {
  BandeauErreur,
  Card,
  Chargement,
  EtatVide,
  FilterChips,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
  StatutBadge,
  dateRelative,
} from "../../components/ui/kit";
import { useConfirmation } from "../../hooks/useConfirmation";
import api from "../../services/api";
import { dansPlage, plageVide, type PlageDates } from "../../utils/plageDates";

type DemandeRole = "SUPERVISEUR" | "AGENT_COLLECTE";
type DemandeStatut = "EN_ATTENTE" | "APPROUVEE" | "REFUSEE";

interface DemandeInscription {
  idDemande: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string | null;
  photoProfil?: string | null;
  roleDemande: DemandeRole;
  statut: DemandeStatut;
  dateDemande: string;
}

interface OccupationZone {
  idZone: number;
  nomZone: string;
  superviseur: { idUtilisateur: number; nom: string; prenom: string; photoProfil?: string | null } | null;
  nbAgents: number;
  maxAgents: number;
  superviseurLibre: boolean;
  placesAgents: number;
}

const LIBELLE_ROLE: Record<DemandeRole, string> = {
  SUPERVISEUR: "Superviseur",
  AGENT_COLLECTE: "Agent de collecte",
};

const LIBELLE_STATUT: Record<DemandeStatut, string> = {
  EN_ATTENTE: "En attente",
  APPROUVEE: "Approuvée",
  REFUSEE: "Refusée",
};

const TON_STATUT: Record<DemandeStatut, "orange" | "vert" | "rouge"> = {
  EN_ATTENTE: "orange",
  APPROUVEE: "vert",
  REFUSEE: "rouge",
};

// Une zone peut-elle accueillir ce rôle ? (mêmes règles que le serveur)
const zoneAccepte = (zone: OccupationZone, role: DemandeRole) =>
  role === "SUPERVISEUR" ? zone.superviseurLibre : zone.placesAgents > 0;

const motifRefusZone = (zone: OccupationZone, role: DemandeRole) => {
  if (zoneAccepte(zone, role)) return null;
  return role === "SUPERVISEUR"
    ? `Déjà supervisée par ${zone.superviseur?.prenom ?? ""} ${zone.superviseur?.nom ?? ""}`.trim()
    : `Complète (${zone.nbAgents}/${zone.maxAgents} agents)`;
};

function JaugeAgents({ nb, max }: { nb: number; max: number }) {
  const plein = nb >= max;

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${plein ? "bg-orange-500" : "bg-emerald-500"}`}
          style={{ width: `${Math.min(100, (nb / max) * 100)}%` }}
        />
      </div>
      <span className={`text-[11px] font-bold ${plein ? "text-orange-600" : "text-slate-500"}`}>
        {nb}/{max}
      </span>
    </div>
  );
}

export default function Demandes() {
  const { confirmer, dialogue } = useConfirmation();
  const [demandes, setDemandes] = useState<DemandeInscription[]>([]);
  const [zones, setZones] = useState<OccupationZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [actualisation, setActualisation] = useState(false);
  const [erreur, setErreur] = useState("");
  const [recherche, setRecherche] = useState("");
  const [periode, setPeriode] = useState<PlageDates>(plageVide);
  const [statut, setStatut] = useState<"TOUS" | DemandeStatut>("EN_ATTENTE");
  const [role, setRole] = useState<"TOUS" | DemandeRole>("TOUS");
  const [selection, setSelection] = useState<DemandeInscription | null>(null);
  const [zoneChoisie, setZoneChoisie] = useState<number | null>(null);
  const [enCours, setEnCours] = useState<number | null>(null);
  const [erreurAction, setErreurAction] = useState("");

  const charger = useCallback(async (manuel = false) => {
    try {
      if (manuel) setActualisation(true);
      setErreur("");

      const [reponseDemandes, reponseZones] = await Promise.all([
        api.get<DemandeInscription[] | { demandes?: DemandeInscription[] }>("/demandes-inscription"),
        api.get<{ zones: OccupationZone[] }>("/demandes-inscription/zones/occupation"),
      ]);

      setDemandes(
        Array.isArray(reponseDemandes.data) ? reponseDemandes.data : reponseDemandes.data?.demandes ?? []
      );
      setZones(reponseZones.data?.zones ?? []);
    } catch (err: any) {
      setErreur(err?.response?.data?.message || "Impossible de charger les demandes d'inscription.");
    } finally {
      setLoading(false);
      setActualisation(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const compte = useMemo(
    () => ({
      attente: demandes.filter((d) => d.statut === "EN_ATTENTE").length,
      approuvees: demandes.filter((d) => d.statut === "APPROUVEE").length,
      refusees: demandes.filter((d) => d.statut === "REFUSEE").length,
    }),
    [demandes]
  );

  const visibles = useMemo(() => {
    const terme = recherche.trim().toLowerCase();

    return demandes
      .filter((d) => statut === "TOUS" || d.statut === statut)
      .filter((d) => role === "TOUS" || d.roleDemande === role)
      .filter((d) => dansPlage(d.dateDemande, periode))
      .filter(
        (d) =>
          !terme || `${d.prenom} ${d.nom}`.toLowerCase().includes(terme) || d.email.toLowerCase().includes(terme)
      )
      .sort((a, b) => new Date(b.dateDemande).getTime() - new Date(a.dateDemande).getTime());
  }, [demandes, statut, role, periode, recherche]);

  const zonesDuRole = useMemo(
    () => (selection ? zones.map((zone) => ({ zone, motif: motifRefusZone(zone, selection.roleDemande) })) : []),
    [zones, selection]
  );
  const auMoinsUneZoneLibre = zonesDuRole.some(({ motif }) => motif === null);

  const ouvrir = (demande: DemandeInscription) => {
    setSelection(demande);
    setZoneChoisie(null);
    setErreurAction("");
  };

  const approuver = async () => {
    if (!selection) return;
    if (!zoneChoisie) return setErreurAction("Choisissez la zone d'affectation.");

    try {
      setEnCours(selection.idDemande);
      setErreurAction("");
      await api.put(`/demandes-inscription/${selection.idDemande}/approuver`, { idZone: zoneChoisie });
      toast.success(`${selection.prenom} ${selection.nom} est inscrit(e) et peut se connecter.`);
      setSelection(null);
      await charger(true);
    } catch (err: any) {
      setErreurAction(err?.response?.data?.message || "Impossible d'approuver la demande.");
      await charger(true);
    } finally {
      setEnCours(null);
    }
  };

  const refuser = async (demande: DemandeInscription) => {
    const ok = await confirmer({
      titre: "Refuser cette demande ?",
      message: `${demande.prenom} ${demande.nom} ne pourra pas accéder à la plateforme avec cette demande.`,
      libelle: "Refuser",
      danger: true,
    });
    if (!ok) return;

    try {
      setEnCours(demande.idDemande);
      await api.put(`/demandes-inscription/${demande.idDemande}/refuser`);
      toast.success("Demande refusée.");
      setSelection(null);
      await charger(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Impossible de refuser la demande.");
    } finally {
      setEnCours(null);
    }
  };

  if (loading) return <Chargement texte="Chargement des demandes..." />;

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Demandes d'inscription"
        description="Vérifiez les demandes, puis affectez chaque personne à une zone."
        actions={
          <SecondaryButton icone={RefreshCw} chargement={actualisation} onClick={() => charger(true)}>
            Actualiser
          </SecondaryButton>
        }
      />

      {erreur && <BandeauErreur message={erreur} onReessayer={() => charger(true)} />}

      <div className="grid grid-cols-3 gap-3">
        {[
          { libelle: "En attente", valeur: compte.attente, icone: Clock3, classe: "bg-orange-50 text-orange-600" },
          { libelle: "Approuvées", valeur: compte.approuvees, icone: Check, classe: "bg-emerald-50 text-emerald-600" },
          { libelle: "Refusées", valeur: compte.refusees, icone: UserX, classe: "bg-red-50 text-red-600" },
        ].map(({ libelle, valeur, icone: Icone, classe }) => (
          <Card key={libelle} className="p-3.5 sm:p-4">
            <span className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${classe}`}>
              <Icone size={18} />
            </span>
            <p className="text-xs font-medium text-slate-500">{libelle}</p>
            <p className="text-2xl font-bold text-slate-900">{valeur}</p>
          </Card>
        ))}
      </div>

      <section className="space-y-3">
        <SectionTitle
          icone={MapPin}
          titre="Occupation des zones"
          sousTitre="Chaque zone a un seul superviseur et 5 agents de collecte au plus"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {zones.map((zone) => (
            <Card key={zone.idZone} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-bold text-slate-900">{zone.nomZone}</p>
                {zone.superviseurLibre ? (
                  <StatutBadge ton="orange">Sans superviseur</StatutBadge>
                ) : (
                  <StatutBadge ton="vert">Supervisée</StatutBadge>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2.5">
                {zone.superviseur ? (
                  <>
                    <Avatar prenom={zone.superviseur.prenom} nom={zone.superviseur.nom} photo={zone.superviseur.photoProfil} taille={32} />
                    <p className="min-w-0 truncate text-sm text-slate-700">
                      {zone.superviseur.prenom} {zone.superviseur.nom}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-400">Poste de superviseur vacant</p>
                )}
              </div>

              <div className="mt-3">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Users size={12} /> Agents de collecte
                </p>
                <JaugeAgents nb={zone.nbAgents} max={zone.maxAgents} />
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <FilterChips
          valeur={statut}
          onChange={setStatut}
          options={[
            { valeur: "EN_ATTENTE", libelle: "En attente", compteur: compte.attente, couleur: "#f97316" },
            { valeur: "APPROUVEE", libelle: "Approuvées", compteur: compte.approuvees, couleur: "#16a34a" },
            { valeur: "REFUSEE", libelle: "Refusées", compteur: compte.refusees, couleur: "#dc2626" },
            { valeur: "TOUS", libelle: "Toutes", compteur: demandes.length },
          ]}
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher par nom ou e-mail…"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "TOUS" | DemandeRole)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-emerald-500"
          >
            <option value="TOUS">Tous les rôles</option>
            <option value="SUPERVISEUR">Superviseur</option>
            <option value="AGENT_COLLECTE">Agent de collecte</option>
          </select>
        </div>
        <FiltreDates valeur={periode} onChange={setPeriode} libelle="Demandes reçues" />
      </section>

      {visibles.length === 0 ? (
        <Card>
          <EtatVide
            icone={UserPlus}
            titre={statut === "EN_ATTENTE" ? "Aucune demande en attente" : "Aucune demande trouvée"}
            description="Les nouvelles demandes apparaîtront ici."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {visibles.map((demande) => (
            <Card key={demande.idDemande} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar prenom={demande.prenom} nom={demande.nom} photo={demande.photoProfil} taille={56} />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="truncate font-bold text-slate-900">
                      {demande.prenom} {demande.nom}
                    </p>
                    <StatutBadge ton={TON_STATUT[demande.statut]}>{LIBELLE_STATUT[demande.statut]}</StatutBadge>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <ShieldCheck size={13} /> {LIBELLE_ROLE[demande.roleDemande]}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 truncate text-xs text-slate-500">
                    <Mail size={12} className="shrink-0" /> {demande.email}
                  </p>
                  {demande.telephone && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <Phone size={12} className="shrink-0" /> {demande.telephone}
                    </p>
                  )}
                  <p className="mt-1.5 text-[11px] text-slate-400">Reçue {dateRelative(demande.dateDemande)}</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                {demande.statut === "EN_ATTENTE" ? (
                  <>
                    <PrimaryButton icone={UserCheck} className="flex-1 !py-2.5" onClick={() => ouvrir(demande)}>
                      Approuver
                    </PrimaryButton>
                    <button
                      type="button"
                      onClick={() => refuser(demande)}
                      disabled={enCours === demande.idDemande}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100 active:scale-[0.98] disabled:opacity-50"
                    >
                      <UserX size={16} /> Refuser
                    </button>
                  </>
                ) : (
                  <SecondaryButton className="flex-1 !py-2.5" onClick={() => ouvrir(demande)}>
                    Consulter
                  </SecondaryButton>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        ouvert={selection !== null}
        onFermer={() => setSelection(null)}
        titre={selection?.statut === "EN_ATTENTE" ? "Approuver la demande" : "Détail de la demande"}
        description={selection ? `${selection.prenom} ${selection.nom} · ${LIBELLE_ROLE[selection.roleDemande]}` : undefined}
        largeur="lg"
      >
        {selection && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-3">
              <Avatar prenom={selection.prenom} nom={selection.nom} photo={selection.photoProfil} taille={64} />
              <div className="min-w-0 text-sm">
                <p className="truncate text-slate-700">{selection.email}</p>
                <p className="text-slate-500">{selection.telephone || "Téléphone non renseigné"}</p>
                <div className="mt-1.5">
                  <StatutBadge ton={TON_STATUT[selection.statut]}>{LIBELLE_STATUT[selection.statut]}</StatutBadge>
                </div>
              </div>
            </div>

            {selection.statut === "EN_ATTENTE" && (
              <>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Zone d'affectation</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {selection.roleDemande === "SUPERVISEUR"
                      ? "Une zone n'a qu'un seul superviseur : seules les zones sans superviseur sont proposées."
                      : "Une zone compte 5 agents de collecte au plus."}
                  </p>

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {zonesDuRole.map(({ zone, motif }) => {
                      const choisie = zoneChoisie === zone.idZone;
                      // Un agent est mieux placé dans une zone qui a déjà son superviseur.
                      const sansSuperviseur = selection.roleDemande === "AGENT_COLLECTE" && zone.superviseurLibre;

                      return (
                        <button
                          key={zone.idZone}
                          type="button"
                          disabled={motif !== null}
                          aria-pressed={choisie}
                          onClick={() => setZoneChoisie(zone.idZone)}
                          className={`rounded-2xl border-2 p-3 text-left transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${
                            choisie ? "border-emerald-600 bg-emerald-50/60" : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-900">{zone.nomZone}</span>
                            {choisie && <CheckCircle2 size={18} className="text-emerald-600" />}
                          </span>
                          <span className="mt-1 block text-xs text-slate-500">
                            {zone.superviseur ? `Superviseur : ${zone.superviseur.prenom} ${zone.superviseur.nom}` : "Sans superviseur"}
                          </span>
                          <span className="mt-2 block">
                            <JaugeAgents nb={zone.nbAgents} max={zone.maxAgents} />
                          </span>
                          {motif && <span className="mt-1.5 block text-[11px] font-semibold text-orange-600">{motif}</span>}
                          {!motif && sansSuperviseur && (
                            <span className="mt-1.5 block text-[11px] font-semibold text-orange-600">
                              Aucun superviseur pour l'instant
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {!auMoinsUneZoneLibre && (
                    <p className="mt-3 flex items-start gap-2 rounded-xl bg-orange-50 p-3 text-xs text-orange-700">
                      <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                      Aucune zone ne peut accueillir cette personne pour le moment.
                    </p>
                  )}
                </div>

                {erreurAction && (
                  <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erreurAction}</p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => refuser(selection)}
                    disabled={enCours === selection.idDemande}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 active:scale-[0.98] disabled:opacity-50"
                  >
                    <UserX size={17} /> Refuser
                  </button>
                  <PrimaryButton
                    icone={UserCheck}
                    chargement={enCours === selection.idDemande}
                    disabled={!zoneChoisie}
                    onClick={approuver}
                  >
                    Approuver
                  </PrimaryButton>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {dialogue}
    </div>
  );
}
