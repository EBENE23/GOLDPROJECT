import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  Phone,
  Plus,
  Radar,
  RefreshCw,
  Truck,
  UserCheck,
  XCircle,
} from "lucide-react";

import {
  BandeauErreur,
  Card,
  Chargement,
  EtatVide,
  FilterChips,
  KpiCard,
  LevelRing,
  PageHeader,
  PrimaryButton,
  RefPill,
  SecondaryButton,
  StatutBadge,
  useLibelleStatut,
  tonStatut,
} from "../../components/ui/kit";
import {
  annulerInterventionSuperviseur,
  creerInterventionSuperviseur,
  listerAgentsSuperviseur,
  listerBacsSuperviseur,
  listerInterventionsSuperviseur,
  type Agent,
  type Bac,
  type Intervention,
} from "../../services/superviseurService";
import { obtenirCategorieNiveauBac } from "../../utils/bacLevel";
import { useTempsReel } from "../../hooks/useTempsReel";
import Modal, { ConfirmDialog } from "../../components/ui/Modal";
import FiltreDates from "../../components/ui/FiltreDates";
import { dansPlage, plageVide, type PlageDates } from "../../utils/plageDates";
import { LOCALE_INTL, useTranslation } from "../../i18n";

type Priorite = "NORMALE" | "MOYENNE" | "HAUTE" | "CRITIQUE";
type Filtre = "TOUTES" | "EN_ATTENTE" | "PLANIFIEE" | "EN_COURS" | "TERMINEE" | "ANNULEE";

interface FormState {
  id_bac: string;
  id_agent: string;
  datePrevue: string;
  priorite: Priorite;
  motif: string;
}

const formVide: FormState = { id_bac: "", id_agent: "", datePrevue: "", priorite: "HAUTE", motif: "" };

const STATUTS_ACTIFS = ["EN_ATTENTE", "PLANIFIEE", "EN_COURS"];

const tonPriorite = (priorite?: string) =>
  priorite === "CRITIQUE" ? "rouge" : priorite === "HAUTE" ? "orange" : priorite === "MOYENNE" ? "bleu" : "gris";

const champ =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50";

const Interventions = () => {
  const { t, langue } = useTranslation();
  const libelleStatut = useLibelleStatut();
  const [searchParams, setSearchParams] = useSearchParams();
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [bacs, setBacs] = useState<Bac[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filtre, setFiltre] = useState<Filtre>("TOUTES");
  const [periode, setPeriode] = useState<PlageDates>(plageVide);
  const [form, setForm] = useState<FormState>(formVide);
  const [formOuvert, setFormOuvert] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [error, setError] = useState("");
  const [erreurForm, setErreurForm] = useState("");
  const [aAnnuler, setAAnnuler] = useState<Intervention | null>(null);
  const [annulation, setAnnulation] = useState(false);

  const formaterDate = (valeur?: string | null) => {
    if (!valeur) return null;
    const date = new Date(valeur);

    return Number.isNaN(date.getTime())
      ? null
      : new Intl.DateTimeFormat(LOCALE_INTL[langue], { dateStyle: "medium", timeStyle: "short" }).format(date);
  };

  const charger = useCallback(async (actualisation = false) => {
    try {
      setError("");
      if (actualisation) setRefreshing(true);
      const [reponseInterventions, reponseBacs, reponseAgents] = await Promise.all([
        listerInterventionsSuperviseur(),
        listerBacsSuperviseur(),
        listerAgentsSuperviseur(),
      ]);
      setInterventions(reponseInterventions.interventions ?? []);
      setBacs(reponseBacs.bacs ?? []);
      setAgents(reponseAgents.agents ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message || t("superviseurInterventions.erreurChargement"));
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

  const bacsActifs = useMemo(
    () => new Set(interventions.filter((i) => STATUTS_ACTIFS.includes(i.statut)).map((i) => i.id_bac)),
    [interventions]
  );

  // Bacs à traiter (alerte ou critique) qui n'ont pas déjà une intervention active.
  const bacsPlanifiables = useMemo(
    () => bacs.filter((bac) => obtenirCategorieNiveauBac(bac.niveau_remplissage) !== "NORMAL" && !bacsActifs.has(bac.id_bac)),
    [bacs, bacsActifs]
  );

  const agentsDisponibles = useMemo(() => agents.filter((agent) => agent.disponible !== false), [agents]);

  const ouvrirFormulaire = useCallback(
    (bacId?: number, agentId?: string) => {
      const bac = bacs.find((item) => item.id_bac === bacId);

      setErreurForm("");
      setForm({
        ...formVide,
        id_bac: bac ? String(bac.id_bac) : "",
        id_agent: agentId ?? "",
        priorite: bac && obtenirCategorieNiveauBac(bac.niveau_remplissage) === "PLEIN" ? "CRITIQUE" : "HAUTE",
      });
      setFormOuvert(true);
    },
    [bacs]
  );

  // Ouverture depuis un autre écran : ?ouvrir=1&bac=ID&agent=ID
  useEffect(() => {
    if (loading || searchParams.get("ouvrir") !== "1") return;

    const bacId = Number(searchParams.get("bac"));
    const agentParam = searchParams.get("agent") ?? "";
    const agentValide = agentsDisponibles.some((agent) => String(agent.idUtilisateur) === agentParam);

    ouvrirFormulaire(Number.isInteger(bacId) && bacId > 0 ? bacId : undefined, agentValide ? agentParam : undefined);
    setSearchParams({}, { replace: true });
  }, [loading, searchParams, setSearchParams, agentsDisponibles, ouvrirFormulaire]);

  const soumettre = async (event: React.FormEvent) => {
    event.preventDefault();
    setErreurForm("");

    if (!form.id_bac) return setErreurForm(t("superviseurInterventions.veuillezSelectionnerBac"));
    if (!form.id_agent) return setErreurForm(t("superviseurInterventions.veuillezSelectionnerAgent"));
    if (!form.motif.trim()) return setErreurForm(t("superviseurInterventions.motifObligatoire"));

    try {
      setEnvoi(true);
      // Une seule requête : intervention + mission + notification à l'agent, en transaction.
      await creerInterventionSuperviseur({
        id_bac: Number(form.id_bac),
        id_agent: Number(form.id_agent),
        datePrevue: form.datePrevue ? new Date(form.datePrevue).toISOString() : null,
        priorite: form.priorite,
        motif: form.motif.trim(),
      });

      const agent = agents.find((item) => String(item.idUtilisateur) === form.id_agent);
      toast.success(t("superviseurInterventions.interventionCreeNotifie", { nom: agent ? `${agent.prenom} ${agent.nom}` : "" }));
      setFormOuvert(false);
      await charger(true);
    } catch (err: any) {
      setErreurForm(err?.response?.data?.message || t("superviseurInterventions.impossiblePlanifier"));
    } finally {
      setEnvoi(false);
    }
  };

  const confirmerAnnulation = async () => {
    if (!aAnnuler) return;

    try {
      setAnnulation(true);
      await annulerInterventionSuperviseur(aAnnuler.idIntervention);
      toast.success(t("superviseurInterventions.interventionAnnulee"));
      setAAnnuler(null);
      await charger(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t("superviseurInterventions.impossibleAnnuler"));
    } finally {
      setAnnulation(false);
    }
  };

  const compte = (statut: string) => interventions.filter((i) => i.statut === statut).length;

  const visibles = useMemo(
    () =>
      interventions
        .filter((i) => filtre === "TOUTES" || i.statut === filtre)
        .filter((i) => dansPlage(i.dateCreation, periode))
        .sort((a, b) => new Date(b.dateCreation ?? 0).getTime() - new Date(a.dateCreation ?? 0).getTime()),
    [interventions, filtre, periode]
  );

  if (loading) return <Chargement texte={t("adminInterventions.chargementInterventions")} />;

  const bacChoisi = bacs.find((bac) => String(bac.id_bac) === form.id_bac);

  return (
    <div className="space-y-5">
      <PageHeader
        titre={t("superviseurInterventions.titre")}
        description={t("superviseurInterventions.description")}
        actions={
          <>
            <SecondaryButton icone={RefreshCw} chargement={refreshing} onClick={() => charger(true)}>
              {t("adminDemandes.actualiser")}
            </SecondaryButton>
            <PrimaryButton
              icone={Plus}
              onClick={() => ouvrirFormulaire()}
              disabled={bacsPlanifiables.length === 0 || agentsDisponibles.length === 0}
              title={
                bacsPlanifiables.length === 0
                  ? t("superviseurInterventions.aucunBacATraiter")
                  : agentsDisponibles.length === 0
                    ? t("superviseurInterventions.aucunAgentDisponible")
                    : undefined
              }
            >
              {t("superviseurInterventions.planifier")}
            </PrimaryButton>
          </>
        }
      />

      {error && <BandeauErreur message={error} onReessayer={() => charger()} />}

      {agents.length === 0 && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
          {t("superviseurInterventions.aucunAgentZone")}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <KpiCard libelle={t("commun.statutEnAttente")} valeur={compte("EN_ATTENTE")} icone={Clock} teinte="orange" />
        <KpiCard libelle={t("adminInterventions.optPlanifiees")} valeur={compte("PLANIFIEE")} icone={ClipboardList} teinte="bleu" />
        <KpiCard libelle={t("commun.statutEnCours")} valeur={compte("EN_COURS")} icone={Truck} teinte="vert" />
        <KpiCard libelle={t("adminInterventions.optTerminees")} valeur={compte("TERMINEE")} icone={CheckCircle2} teinte="gris" />
      </div>

      <FilterChips
        valeur={filtre}
        onChange={setFiltre}
        options={[
          { valeur: "TOUTES", libelle: t("adminDemandes.filtreToutes"), compteur: interventions.length },
          { valeur: "EN_ATTENTE", libelle: t("commun.statutEnAttente"), compteur: compte("EN_ATTENTE"), couleur: "#f97316" },
          { valeur: "PLANIFIEE", libelle: t("adminInterventions.optPlanifiees"), compteur: compte("PLANIFIEE"), couleur: "#0ea5e9" },
          { valeur: "EN_COURS", libelle: t("commun.statutEnCours"), compteur: compte("EN_COURS"), couleur: "#16a34a" },
          { valeur: "TERMINEE", libelle: t("adminInterventions.optTerminees"), compteur: compte("TERMINEE"), couleur: "#94a3b8" },
          { valeur: "ANNULEE", libelle: t("adminInterventions.optAnnulees"), compteur: compte("ANNULEE"), couleur: "#dc2626" },
        ]}
      />

      <FiltreDates valeur={periode} onChange={setPeriode} libelle={t("adminInterventions.creees")} />

      {visibles.length === 0 ? (
        <Card>
          <EtatVide
            icone={ClipboardList}
            titre={t("superviseurInterventions.aucuneIntervention")}
            description={
              interventions.length === 0
                ? t("superviseurInterventions.utilisezPlanifier")
                : t("superviseurInterventions.aucuneCorrespondFiltre")
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {visibles.map((intervention) => {
            const bac = intervention.bac ?? bacs.find((item) => item.id_bac === intervention.id_bac);
            const agent = intervention.mission?.agent;
            const prevue = formaterDate(intervention.datePrevue);
            const modifiable = STATUTS_ACTIFS.includes(intervention.statut);

            return (
              <Card
                key={intervention.idIntervention}
                severite={bac ? obtenirCategorieNiveauBac(bac.niveau_remplissage) : undefined}
                className="flex flex-col p-4 sm:p-5"
              >
                <div className="flex items-start gap-4">
                  {bac && <LevelRing niveau={bac.niveau_remplissage} taille={60} />}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <RefPill>#{bac?.reference ?? `BAC-${intervention.id_bac}`}</RefPill>
                      <StatutBadge ton={tonStatut(intervention.statut)}>{libelleStatut(intervention.statut)}</StatutBadge>
                      <StatutBadge ton={tonPriorite(intervention.priorite)}>{libelleStatut(intervention.priorite)}</StatutBadge>
                    </div>
                    <p className="mt-2 text-sm font-bold text-slate-900">{t("superviseurInterventions.interventionNumero", { n: intervention.idIntervention })}</p>
                    {intervention.motif && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{intervention.motif}</p>}
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                  {agent ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <UserCheck size={14} />
                        {agent.prenom} {agent.nom}
                      </span>
                      {agent.telephone && (
                        <a href={`tel:${agent.telephone}`} className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                          <Phone size={13} />
                          {t("superviseurInterventions.appeler")}
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="font-medium text-orange-600">{t("superviseurDashboard.aucunAgentAffecte")}</p>
                  )}
                  {intervention.mission && (
                    <p>
                      {t("superviseurInterventions.missionLabel", { statut: libelleStatut(intervention.mission.statut) })}
                    </p>
                  )}
                  {prevue && (
                    <p className="flex items-center gap-1.5">
                      <CalendarClock size={13} />
                      {t("missionCard.prevue", { date: prevue })}
                    </p>
                  )}
                </div>

                {modifiable && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link
                      to="/superviseur/suivi"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-700 hover:bg-indigo-100"
                    >
                      <Radar size={16} />
                      {t("superviseurInterventions.suivre")}
                    </Link>
                    <button
                      type="button"
                      onClick={() => setAAnnuler(intervention)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100"
                    >
                      <XCircle size={16} />
                      {t("superviseurInterventions.annuler")}
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        ouvert={formOuvert}
        onFermer={() => setFormOuvert(false)}
        titre={t("superviseurInterventions.planifierUneIntervention")}
        description={t("superviseurInterventions.agentSeraNotifie")}
      >
        <form onSubmit={soumettre}>
        {erreurForm && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erreurForm}</div>
        )}

        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            {t("superviseurInterventions.bacACollecter")}
            <select
              className={`${champ} mt-1.5`}
              value={form.id_bac}
              onChange={(event) => {
                const bac = bacs.find((item) => String(item.id_bac) === event.target.value);
                setForm({
                  ...form,
                  id_bac: event.target.value,
                  priorite: bac && obtenirCategorieNiveauBac(bac.niveau_remplissage) === "PLEIN" ? "CRITIQUE" : form.priorite,
                });
              }}
            >
              <option value="">{t("adminInterventions.selectionnerBac")}</option>
              {bacsPlanifiables.map((bac) => (
                <option key={bac.id_bac} value={bac.id_bac}>
                  {bac.reference} — {Math.round(Number(bac.niveau_remplissage))}%
                </option>
              ))}
            </select>
            {bacChoisi && bacsPlanifiables.every((bac) => bac.id_bac !== bacChoisi.id_bac) && (
              <span className="mt-1 block text-xs font-normal text-orange-600">
                {t("superviseurInterventions.bacDejaActifOuNormal")}
              </span>
            )}
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            {t("superviseurInterventions.agentDeMaZone")}
            <select
              className={`${champ} mt-1.5`}
              value={form.id_agent}
              onChange={(event) => setForm({ ...form, id_agent: event.target.value })}
            >
              <option value="">{t("superviseurInterventions.selectionnerUnAgent")}</option>
              {agents.map((agent) => (
                <option key={agent.idUtilisateur} value={agent.idUtilisateur} disabled={agent.disponible === false}>
                  {agent.prenom} {agent.nom} —{" "}
                  {agent.disponible === false ? t("superviseurInterventions.indisponible") : t("superviseurInterventions.missionsActives", { n: agent.missionsActives ?? 0 })}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              {t("adminInterventions.colPriorite")}
              <select
                className={`${champ} mt-1.5`}
                value={form.priorite}
                onChange={(event) => setForm({ ...form, priorite: event.target.value as Priorite })}
              >
                <option value="NORMALE">{t("commun.prioriteNormale")}</option>
                <option value="MOYENNE">{t("commun.prioriteMoyenne")}</option>
                <option value="HAUTE">{t("commun.prioriteHaute")}</option>
                <option value="CRITIQUE">{t("commun.prioriteCritique")}</option>
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              {t("superviseurInterventions.datePrevue")} <span className="font-normal text-slate-400">{t("superviseurInterventions.facultatif")}</span>
              <input
                type="datetime-local"
                className={`${champ} mt-1.5`}
                value={form.datePrevue}
                onChange={(event) => setForm({ ...form, datePrevue: event.target.value })}
              />
            </label>
          </div>

          <label className="block text-sm font-semibold text-slate-700">
            {t("adminInterventions.champMotif")}
            <textarea
              rows={3}
              maxLength={255}
              className={`${champ} mt-1.5 h-auto py-2.5`}
              placeholder={t("superviseurInterventions.motifPlaceholder")}
              value={form.motif}
              onChange={(event) => setForm({ ...form, motif: event.target.value })}
            />
          </label>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <SecondaryButton onClick={() => setFormOuvert(false)}>{t("superviseurInterventions.annuler")}</SecondaryButton>
          <PrimaryButton type="submit" chargement={envoi}>
            {t("superviseurInterventions.creerEtNotifier")}
          </PrimaryButton>
        </div>
        </form>
      </Modal>

      <ConfirmDialog
        ouvert={aAnnuler !== null}
        titre={t("superviseurInterventions.annulerInterventionTitre")}
        message={
          aAnnuler
            ? t("superviseurInterventions.annulerInterventionMessage", { n: aAnnuler.idIntervention })
            : ""
        }
        libelleConfirmer={t("superviseurInterventions.annulerIntervention")}
        danger
        enCours={annulation}
        onConfirmer={confirmerAnnulation}
        onAnnuler={() => setAAnnuler(null)}
      />
    </div>
  );
};

export default Interventions;
