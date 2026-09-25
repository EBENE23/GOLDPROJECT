import { useEffect, useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import { Eye, EyeOff, KeyRound, Mail, MapPin, Phone, Save, ShieldCheck, User, UserCog } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import Avatar from "../../components/Avatar";
import AvatarPicker from "../../components/AvatarPicker";
import { Card, PageHeader, PrimaryButton, SectionTitle, StatutBadge } from "../../components/ui/kit";
import api from "../../services/api";
import { memoriserUtilisateur, useAuthStore } from "../../stores/authStore";
import { LOCALE_INTL, useTranslation } from "../../i18n";

interface SuperviseurZone {
  superviseur: {
    idUtilisateur: number;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string | null;
    photoProfil?: string | null;
  } | null;
  zone: { idZone: number; nomZone: string } | null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const classeChamp =
  "h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

function Champ({
  libelle,
  icone: Icone,
  erreur,
  ...props
}: { libelle: string; icone: LucideIcon; erreur?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {libelle}
      <span className="relative mt-1.5 block">
        <Icone size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input {...props} className={`${classeChamp} ${erreur ? "border-red-400" : ""}`} />
      </span>
      {erreur && <span className="mt-1 block text-xs font-normal text-red-600">{erreur}</span>}
    </label>
  );
}

/** Profil de l'utilisateur connecté (agent, superviseur ou administrateur). */
export default function MonProfil() {
  const { t, langue } = useTranslation();

  const LIBELLES_ROLE: Record<string, string> = {
    ADMINISTRATEUR: t("shell.roleAdmin"),
    SUPERVISEUR: t("shell.roleSuperviseur"),
    AGENT_COLLECTE: t("shell.roleAgent"),
  };

  const utilisateur = useAuthStore((state) => state.utilisateur);
  const [form, setForm] = useState({
    prenom: utilisateur?.prenom ?? "",
    nom: utilisateur?.nom ?? "",
    email: utilisateur?.email ?? "",
    telephone: utilisateur?.telephone ?? "",
  });
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [avatar, setAvatar] = useState<string | null>(utilisateur?.photoProfil ?? null);
  const [equipe, setEquipe] = useState<SuperviseurZone | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const [mdp, setMdp] = useState({ ancien: "", nouveau: "", confirmation: "" });
  const [erreurMdp, setErreurMdp] = useState("");
  const [voirMdp, setVoirMdp] = useState(false);
  const [envoiMdp, setEnvoiMdp] = useState(false);

  // La photo arrive du serveur après l'ouverture de la page.
  useEffect(() => {
    setAvatar(utilisateur?.photoProfil ?? null);
  }, [utilisateur?.photoProfil]);

  // L'agent de collecte retrouve les informations de son superviseur.
  const estAgent = utilisateur?.role === "AGENT_COLLECTE";
  useEffect(() => {
    if (!estAgent) return;
    api
      .get<SuperviseurZone>("/profil/mon-superviseur")
      .then((reponse) => setEquipe(reponse.data))
      .catch(() => setEquipe({ superviseur: null, zone: null }));
  }, [estAgent]);

  if (!utilisateur) return null;

  // La photo est enregistrée dès qu'elle est choisie, sans attendre le bouton « Enregistrer ».
  const changerPhoto = async (photo: string | null) => {
    const precedente = avatar;
    setAvatar(photo);

    try {
      const reponse = await api.put("/profil/me", {
        prenom: utilisateur.prenom,
        nom: utilisateur.nom,
        email: utilisateur.email,
        telephone: utilisateur.telephone ?? null,
        photoProfil: photo,
      });
      const misAJour = reponse.data?.utilisateur;
      if (misAJour) {
        useAuthStore.setState({ utilisateur: misAJour });
        memoriserUtilisateur(misAJour);
      }
      toast.success(photo ? t("monProfil.photoEnregistree") : t("monProfil.photoSupprimee"));
    } catch (err: any) {
      setAvatar(precedente);
      toast.error(err?.response?.data?.message || t("monProfil.erreurPhoto"));
    }
  };

  const enregistrer = async (event: FormEvent) => {
    event.preventDefault();

    const nouvellesErreurs: Record<string, string> = {};
    if (!form.prenom.trim()) nouvellesErreurs.prenom = t("monProfil.prenomObligatoire");
    if (!form.nom.trim()) nouvellesErreurs.nom = t("monProfil.nomObligatoire");
    if (!EMAIL.test(form.email.trim())) nouvellesErreurs.email = t("monProfil.emailInvalide");
    if (form.telephone.trim() && !/^[+\d][\d\s.-]{5,19}$/.test(form.telephone.trim())) {
      nouvellesErreurs.telephone = t("monProfil.telephoneInvalide");
    }

    setErreurs(nouvellesErreurs);
    if (Object.keys(nouvellesErreurs).length > 0) return;

    try {
      setEnvoi(true);
      const reponse = await api.put("/profil/me", {
        prenom: form.prenom.trim(),
        nom: form.nom.trim(),
        email: form.email.trim(),
        telephone: form.telephone.trim() || null,
        photoProfil: avatar,
      });

      const misAJour = reponse.data?.utilisateur;
      if (misAJour) {
        useAuthStore.setState({ utilisateur: misAJour });
        memoriserUtilisateur(misAJour);
      }
      toast.success(reponse.data?.message || t("monProfil.profilMisAJour"));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t("monProfil.erreurProfil"));
    } finally {
      setEnvoi(false);
    }
  };

  const changerMotDePasse = async (event: FormEvent) => {
    event.preventDefault();
    setErreurMdp("");

    if (!mdp.ancien || !mdp.nouveau) return setErreurMdp(t("monProfil.mdpRenseigner"));
    if (mdp.nouveau.length < 8) return setErreurMdp(t("monProfil.mdpCourt"));
    if (mdp.nouveau !== mdp.confirmation) return setErreurMdp(t("monProfil.mdpConfirmationDifferente"));
    if (mdp.nouveau === mdp.ancien) return setErreurMdp(t("monProfil.mdpIdentique"));

    try {
      setEnvoiMdp(true);
      const reponse = await api.put("/profil/me/mot-de-passe", {
        ancienMotDePasse: mdp.ancien,
        nouveauMotDePasse: mdp.nouveau,
      });
      toast.success(reponse.data?.message || t("monProfil.mdpModifie"));
      setMdp({ ancien: "", nouveau: "", confirmation: "" });
    } catch (err: any) {
      setErreurMdp(err?.response?.data?.message || t("monProfil.erreurMdp"));
    } finally {
      setEnvoiMdp(false);
    }
  };

  const nomComplet = `${utilisateur.prenom} ${utilisateur.nom}`;
  const depuis = utilisateur.dateCreation
    ? new Intl.DateTimeFormat(LOCALE_INTL[langue], { month: "long", year: "numeric" }).format(new Date(utilisateur.dateCreation))
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader titre={t("monProfil.titre")} description={t("monProfil.description")} />

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <AvatarPicker name={nomComplet} value={avatar} onChange={changerPhoto} />
          <div className="min-w-0 text-center sm:text-left">
            <p className="truncate text-lg font-bold text-slate-900">{nomComplet}</p>
            <p className="truncate text-sm text-slate-500">{utilisateur.email}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
              <StatutBadge ton="vert">{LIBELLES_ROLE[utilisateur.role] ?? utilisateur.role}</StatutBadge>
              {depuis && <StatutBadge ton="gris">{t("monProfil.membreDepuis", { date: depuis })}</StatutBadge>}
            </div>
          </div>
        </div>
      </Card>

      {estAgent && (
        <Card className="p-5 sm:p-6">
          <SectionTitle
            icone={UserCog}
            titre={t("monProfil.monSuperviseur")}
            sousTitre={equipe?.zone ? t("monProfil.zone", { nom: equipe.zone.nomZone }) : undefined}
          />
          {equipe === null ? (
            <p className="mt-4 text-sm text-slate-500">{t("monProfil.chargement")}</p>
          ) : equipe.superviseur ? (
            <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
              <Avatar prenom={equipe.superviseur.prenom} nom={equipe.superviseur.nom} photo={equipe.superviseur.photoProfil} taille={72} />
              <div className="min-w-0 space-y-1 text-center sm:text-left">
                <p className="truncate text-base font-bold text-slate-900">
                  {equipe.superviseur.prenom} {equipe.superviseur.nom}
                </p>
                <a href={`mailto:${equipe.superviseur.email}`} className="flex items-center justify-center gap-2 truncate text-sm text-slate-600 hover:text-emerald-700 sm:justify-start">
                  <Mail size={14} className="shrink-0" /> {equipe.superviseur.email}
                </a>
                {equipe.superviseur.telephone ? (
                  <a href={`tel:${equipe.superviseur.telephone}`} className="flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-emerald-700 sm:justify-start">
                    <Phone size={14} className="shrink-0" /> {equipe.superviseur.telephone}
                  </a>
                ) : null}
                {equipe.zone && (
                  <p className="flex items-center justify-center gap-2 text-sm text-slate-600 sm:justify-start">
                    <MapPin size={14} className="shrink-0" /> {equipe.zone.nomZone}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">{t("monProfil.aucunSuperviseur")}</p>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <SectionTitle icone={User} titre={t("monProfil.informationsPersonnelles")} />
          <form onSubmit={enregistrer} className="mt-5 space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Champ libelle={t("monProfil.prenom")} icone={User} value={form.prenom} erreur={erreurs.prenom} autoComplete="given-name"
                onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
              <Champ libelle={t("monProfil.nom")} icone={User} value={form.nom} erreur={erreurs.nom} autoComplete="family-name"
                onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </div>
            <Champ libelle={t("monProfil.email")} icone={Mail} type="email" value={form.email} erreur={erreurs.email} autoComplete="email"
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Champ libelle={t("monProfil.telephone")} icone={Phone} type="tel" value={form.telephone} erreur={erreurs.telephone} autoComplete="tel"
              placeholder="+237 6XX XX XX XX" onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            <PrimaryButton type="submit" icone={Save} chargement={envoi} pleineLargeur>
              {t("monProfil.enregistrerModifications")}
            </PrimaryButton>
          </form>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionTitle icone={ShieldCheck} titre={t("monProfil.motDePasse")} sousTitre={t("monProfil.auMoins8")} />
          <form onSubmit={changerMotDePasse} className="mt-5 space-y-4" noValidate>
            {erreurMdp && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erreurMdp}</p>
            )}
            <Champ libelle={t("monProfil.motDePasseActuel")} icone={KeyRound} type={voirMdp ? "text" : "password"} autoComplete="current-password"
              value={mdp.ancien} onChange={(e) => setMdp({ ...mdp, ancien: e.target.value })} />
            <Champ libelle={t("monProfil.nouveauMotDePasse")} icone={KeyRound} type={voirMdp ? "text" : "password"} autoComplete="new-password"
              value={mdp.nouveau} onChange={(e) => setMdp({ ...mdp, nouveau: e.target.value })} />
            <Champ libelle={t("monProfil.confirmerNouveauMotDePasse")} icone={KeyRound} type={voirMdp ? "text" : "password"} autoComplete="new-password"
              value={mdp.confirmation} onChange={(e) => setMdp({ ...mdp, confirmation: e.target.value })} />

            <button
              type="button"
              onClick={() => setVoirMdp((v) => !v)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              {voirMdp ? <EyeOff size={15} /> : <Eye size={15} />}
              {voirMdp ? t("monProfil.masquerMdp") : t("monProfil.afficherMdp")}
            </button>

            <PrimaryButton type="submit" icone={KeyRound} chargement={envoiMdp} pleineLargeur>
              {t("monProfil.changerMotDePasse")}
            </PrimaryButton>
          </form>
        </Card>
      </div>
    </div>
  );
}
