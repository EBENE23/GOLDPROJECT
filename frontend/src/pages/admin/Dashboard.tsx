import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ClipboardList,
  MapPinned,
  ShieldAlert,
  Siren,
  UserPlus,
  Users,
} from "lucide-react";

import {
  BandeauErreur,
  Card,
  Chargement,
  EtatBadge,
  EtatVide,
  KpiCard,
  LevelRing,
  RefPill,
  SectionTitle,
  StatutBadge,
  dateRelative,
  libelleStatut,
  tonStatut,
} from "../../components/ui/kit";
import FiltreDates from "../../components/ui/FiltreDates";
import { useAuthStore } from "../../stores/authStore";
import { useTempsReel } from "../../hooks/useTempsReel";
import api from "../../services/api";
import { obtenirCategorieNiveauBac } from "../../utils/bacLevel";
import { dansPlage, plageVide, type PlageDates } from "../../utils/plageDates";

interface Bac {
  id_bac: number;
  reference: string;
  niveau_remplissage: number | string;
  etat: string;
  id_zone: number;
}

interface Zone {
  idZone: number;
  nomZone: string;
  id_superviseur?: number | null;
}

interface Utilisateur {
  idUtilisateur: number;
  nom: string;
  prenom: string;
  role: string;
  statutCompte: string;
}

interface Demande {
  idDemande: number;
  nom: string;
  prenom: string;
  roleDemande: string;
  statut: string;
  dateDemande: string;
}

interface Intervention {
  idIntervention: number;
  motif?: string | null;
  priorite: string;
  statut: string;
  id_bac: number;
  dateCreation: string;
  bac?: { reference: string };
}

const liste = <T,>(donnees: unknown, cle: string): T[] =>
  Array.isArray(donnees) ? (donnees as T[]) : ((donnees as Record<string, T[]>)?.[cle] ?? []);

const STATUTS_ACTIFS = ["EN_ATTENTE", "PLANIFIEE", "EN_COURS"];

export default function Dashboard() {
  const utilisateur = useAuthStore((state) => state.utilisateur);
  const [bacs, setBacs] = useState<Bac[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [majLe, setMajLe] = useState("");
  const [periode, setPeriode] = useState<PlageDates>(plageVide);

  const charger = useCallback(async () => {
    try {
      setError("");
      const [b, z, u, d, i] = await Promise.all([
        api.get("/bacs"),
        api.get("/zones"),
        api.get("/utilisateurs"),
        api.get("/demandes-inscription"),
        api.get("/interventions"),
      ]);

      setBacs(liste<Bac>(b.data, "bacs"));
      setZones(liste<Zone>(z.data, "zones"));
      setUsers(liste<Utilisateur>(u.data, "utilisateurs"));
      setDemandes(liste<Demande>(d.data, "demandes"));
      setInterventions(liste<Intervention>(i.data, "interventions"));
      setMajLe(new Date().toISOString());
    } catch (err: any) {
      setError(err?.response?.data?.message || "Impossible de charger toutes les données du tableau de bord.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
    const intervalle = window.setInterval(charger, 20000);
    return () => window.clearInterval(intervalle);
  }, [charger]);

  useTempsReel(() => charger());

  const demandesEnAttente = useMemo(
    () =>
      demandes
        .filter((demande) => demande.statut === "EN_ATTENTE")
        .sort((a, b) => new Date(a.dateDemande).getTime() - new Date(b.dateDemande).getTime()),
    [demandes]
  );

  const zonesSansSuperviseur = useMemo(() => zones.filter((zone) => !zone.id_superviseur), [zones]);

  const bacsATraiter = useMemo(
    () =>
      bacs
        .filter((bac) => obtenirCategorieNiveauBac(bac.niveau_remplissage) !== "NORMAL")
        .sort((a, b) => Number(b.niveau_remplissage) - Number(a.niveau_remplissage)),
    [bacs]
  );
  const bacsCritiques = bacsATraiter.filter((bac) => obtenirCategorieNiveauBac(bac.niveau_remplissage) === "PLEIN");

  const interventionsPeriode = useMemo(
    () => interventions.filter((item) => dansPlage(item.dateCreation, periode)),
    [interventions, periode]
  );

  const utilisateursActifs = users.filter((u) => u.statutCompte === "ACTIF").length;
  const interventionsActives = interventions.filter((i) => STATUTS_ACTIFS.includes(i.statut)).length;

  if (loading) return <Chargement texte="Chargement du tableau de bord..." />;

  // Priorité du moment : demandes à valider, puis bacs critiques, puis zones sans superviseur.
  const hero = demandesEnAttente.length > 0
    ? {
        theme: "from-emerald-700 to-emerald-950",
        badge: "Action requise",
        icone: UserPlus,
        titre: `${demandesEnAttente.length} demande${demandesEnAttente.length > 1 ? "s" : ""} d'inscription à valider`,
        detail: demandesEnAttente
          .slice(0, 3)
          .map((d) => `${d.prenom} ${d.nom} (${libelleStatut(d.roleDemande).toLowerCase()})`)
          .join(" · "),
        lien: "/admin/demandes",
        action: "Examiner les demandes",
      }
    : bacsCritiques.length > 0
      ? {
          theme: "from-red-600 to-red-900",
          badge: "Urgent",
          icone: Siren,
          titre: `${bacsCritiques.length} bac${bacsCritiques.length > 1 ? "s" : ""} critique${bacsCritiques.length > 1 ? "s" : ""}`,
          detail: bacsCritiques
            .slice(0, 3)
            .map((b) => b.reference)
            .join(" · "),
          lien: "/admin/bacs",
          action: "Voir les bacs",
        }
      : zonesSansSuperviseur.length > 0
        ? {
            theme: "from-orange-500 to-orange-700",
            badge: "À organiser",
            icone: ShieldAlert,
            titre: `${zonesSansSuperviseur.length} zone${zonesSansSuperviseur.length > 1 ? "s" : ""} sans superviseur`,
            detail: zonesSansSuperviseur
              .slice(0, 4)
              .map((z) => z.nomZone)
              .join(" · "),
            lien: "/admin/zones",
            action: "Affecter un superviseur",
          }
        : null;

  return (
    <div className="space-y-4">
      {error && <BandeauErreur message={error} onReessayer={charger} />}

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">Administration</p>
          <p className="truncate text-lg font-bold text-slate-900">
            {utilisateur?.prenom} {utilisateur?.nom}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          En direct · {dateRelative(majLe)}
        </span>
      </div>

      {hero ? (
        <section className={`anim-carte overflow-hidden rounded-3xl bg-gradient-to-br ${hero.theme} p-5 text-white shadow-lg`}>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
            <hero.icone size={13} />
            {hero.badge}
          </span>
          <p className="mt-4 text-xl font-bold leading-snug">{hero.titre}</p>
          <p className="mt-1 line-clamp-2 text-sm text-white/75">{hero.detail}</p>
          <Link
            to={hero.lien}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-sm font-bold text-slate-900 shadow transition active:scale-[0.98] sm:w-auto"
          >
            {hero.action}
          </Link>
        </section>
      ) : (
        <section className="anim-carte overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-900 p-5 text-white shadow-lg">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
            <CheckCircle2 size={13} />
            Tout est en ordre
          </span>
          <p className="mt-4 text-xl font-bold">Aucune action requise</p>
          <p className="mt-1 text-sm text-white/75">Pas de demande en attente, de bac critique ni de zone sans superviseur.</p>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <KpiCard libelle="Utilisateurs actifs" valeur={utilisateursActifs} detail={`${users.length} comptes`} icone={Users} teinte="bleu" />
        <KpiCard libelle="Bacs" valeur={bacs.length} detail={`${bacsCritiques.length} critique${bacsCritiques.length > 1 ? "s" : ""}`} icone={Boxes} teinte={bacsCritiques.length > 0 ? "rouge" : "vert"} />
        <KpiCard libelle="Zones" valeur={zones.length} detail={`${zonesSansSuperviseur.length} sans superviseur`} icone={MapPinned} teinte={zonesSansSuperviseur.length > 0 ? "orange" : "vert"} />
        <KpiCard libelle="Interventions" valeur={interventionsActives} detail="Actives" icone={ClipboardList} teinte="gris" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section className="space-y-3">
          <SectionTitle
            icone={AlertTriangle}
            titre="Bacs à surveiller"
            droite={
              <Link to="/admin/bacs" className="text-sm font-semibold text-emerald-700 hover:underline">
                Tout voir
              </Link>
            }
          />
          {bacsATraiter.length === 0 ? (
            <Card>
              <EtatVide icone={CheckCircle2} titre="Tous les bacs sont en état normal" />
            </Card>
          ) : (
            bacsATraiter.slice(0, 4).map((bac) => (
              <Card key={bac.id_bac} severite={obtenirCategorieNiveauBac(bac.niveau_remplissage)} className="p-4">
                <div className="flex items-center gap-4">
                  <LevelRing niveau={bac.niveau_remplissage} taille={52} epaisseur={6} />
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <RefPill>#{bac.reference}</RefPill>
                    <EtatBadge niveau={bac.niveau_remplissage} />
                  </div>
                </div>
              </Card>
            ))
          )}
        </section>

        <section className="space-y-3">
          <SectionTitle icone={ClipboardList} titre="Interventions" sousTitre="Créées sur la période choisie" />
          <FiltreDates valeur={periode} onChange={setPeriode} />
          <Card className="divide-y divide-slate-100">
            {interventionsPeriode.length === 0 ? (
              <EtatVide icone={ClipboardList} titre="Aucune intervention sur cette période" />
            ) : (
              interventionsPeriode.slice(0, 6).map((item) => (
                <div key={item.idIntervention} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <RefPill>#{item.bac?.reference ?? item.id_bac}</RefPill>
                    <p className="mt-1 truncate text-sm text-slate-600">{item.motif || "Sans motif"}</p>
                  </div>
                  <StatutBadge ton={tonStatut(item.statut)}>{libelleStatut(item.statut)}</StatutBadge>
                </div>
              ))
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
