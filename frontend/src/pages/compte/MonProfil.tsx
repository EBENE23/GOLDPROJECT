import { useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import { Eye, EyeOff, KeyRound, Mail, Phone, Save, ShieldCheck, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import AvatarPicker from "../../components/AvatarPicker";
import { Card, PageHeader, PrimaryButton, SectionTitle, StatutBadge } from "../../components/ui/kit";
import api from "../../services/api";
import { useAuthStore } from "../../stores/authStore";
import { loadUserAvatar, saveUserAvatar } from "../../utils/userPreferences";

const LIBELLES_ROLE: Record<string, string> = {
  ADMINISTRATEUR: "Administrateur",
  SUPERVISEUR: "Superviseur",
  AGENT_COLLECTE: "Agent de collecte",
};

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
  const utilisateur = useAuthStore((state) => state.utilisateur);
  const [form, setForm] = useState({
    prenom: utilisateur?.prenom ?? "",
    nom: utilisateur?.nom ?? "",
    email: utilisateur?.email ?? "",
    telephone: utilisateur?.telephone ?? "",
  });
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [avatar, setAvatar] = useState<string | null>(() => loadUserAvatar(utilisateur));
  const [envoi, setEnvoi] = useState(false);

  const [mdp, setMdp] = useState({ ancien: "", nouveau: "", confirmation: "" });
  const [erreurMdp, setErreurMdp] = useState("");
  const [voirMdp, setVoirMdp] = useState(false);
  const [envoiMdp, setEnvoiMdp] = useState(false);

  if (!utilisateur) return null;

  const enregistrer = async (event: FormEvent) => {
    event.preventDefault();

    const nouvellesErreurs: Record<string, string> = {};
    if (!form.prenom.trim()) nouvellesErreurs.prenom = "Le prénom est obligatoire.";
    if (!form.nom.trim()) nouvellesErreurs.nom = "Le nom est obligatoire.";
    if (!EMAIL.test(form.email.trim())) nouvellesErreurs.email = "Adresse e-mail invalide.";
    if (form.telephone.trim() && !/^[+\d][\d\s.-]{5,19}$/.test(form.telephone.trim())) {
      nouvellesErreurs.telephone = "Numéro de téléphone invalide.";
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
      });

      const misAJour = reponse.data?.utilisateur;
      if (misAJour) {
        useAuthStore.setState({ utilisateur: misAJour });
        localStorage.setItem("smartcitywaste_user", JSON.stringify(misAJour));
      }
      saveUserAvatar(utilisateur, avatar);
      toast.success(reponse.data?.message || "Profil mis à jour.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Impossible de mettre à jour le profil.");
    } finally {
      setEnvoi(false);
    }
  };

  const changerMotDePasse = async (event: FormEvent) => {
    event.preventDefault();
    setErreurMdp("");

    if (!mdp.ancien || !mdp.nouveau) return setErreurMdp("Renseignez l'ancien et le nouveau mot de passe.");
    if (mdp.nouveau.length < 8) return setErreurMdp("Le nouveau mot de passe doit contenir au moins 8 caractères.");
    if (mdp.nouveau !== mdp.confirmation) return setErreurMdp("La confirmation ne correspond pas au nouveau mot de passe.");
    if (mdp.nouveau === mdp.ancien) return setErreurMdp("Le nouveau mot de passe doit être différent de l'ancien.");

    try {
      setEnvoiMdp(true);
      const reponse = await api.put("/profil/me/mot-de-passe", {
        ancienMotDePasse: mdp.ancien,
        nouveauMotDePasse: mdp.nouveau,
      });
      toast.success(reponse.data?.message || "Mot de passe modifié.");
      setMdp({ ancien: "", nouveau: "", confirmation: "" });
    } catch (err: any) {
      setErreurMdp(err?.response?.data?.message || "Impossible de modifier le mot de passe.");
    } finally {
      setEnvoiMdp(false);
    }
  };

  const nomComplet = `${utilisateur.prenom} ${utilisateur.nom}`;
  const depuis = utilisateur.dateCreation
    ? new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(utilisateur.dateCreation))
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader titre="Mon profil" description="Vos informations personnelles et la sécurité de votre compte." />

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <AvatarPicker name={nomComplet} value={avatar} onChange={setAvatar} />
          <div className="min-w-0 text-center sm:text-left">
            <p className="truncate text-lg font-bold text-slate-900">{nomComplet}</p>
            <p className="truncate text-sm text-slate-500">{utilisateur.email}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
              <StatutBadge ton="vert">{LIBELLES_ROLE[utilisateur.role] ?? utilisateur.role}</StatutBadge>
              {depuis && <StatutBadge ton="gris">Membre depuis {depuis}</StatutBadge>}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <SectionTitle icone={User} titre="Informations personnelles" />
          <form onSubmit={enregistrer} className="mt-5 space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Champ libelle="Prénom" icone={User} value={form.prenom} erreur={erreurs.prenom} autoComplete="given-name"
                onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
              <Champ libelle="Nom" icone={User} value={form.nom} erreur={erreurs.nom} autoComplete="family-name"
                onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </div>
            <Champ libelle="Adresse e-mail" icone={Mail} type="email" value={form.email} erreur={erreurs.email} autoComplete="email"
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Champ libelle="Téléphone" icone={Phone} type="tel" value={form.telephone} erreur={erreurs.telephone} autoComplete="tel"
              placeholder="+237 6XX XX XX XX" onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            <PrimaryButton type="submit" icone={Save} chargement={envoi} pleineLargeur>
              Enregistrer les modifications
            </PrimaryButton>
          </form>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionTitle icone={ShieldCheck} titre="Mot de passe" sousTitre="Au moins 8 caractères" />
          <form onSubmit={changerMotDePasse} className="mt-5 space-y-4" noValidate>
            {erreurMdp && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erreurMdp}</p>
            )}
            <Champ libelle="Mot de passe actuel" icone={KeyRound} type={voirMdp ? "text" : "password"} autoComplete="current-password"
              value={mdp.ancien} onChange={(e) => setMdp({ ...mdp, ancien: e.target.value })} />
            <Champ libelle="Nouveau mot de passe" icone={KeyRound} type={voirMdp ? "text" : "password"} autoComplete="new-password"
              value={mdp.nouveau} onChange={(e) => setMdp({ ...mdp, nouveau: e.target.value })} />
            <Champ libelle="Confirmer le nouveau mot de passe" icone={KeyRound} type={voirMdp ? "text" : "password"} autoComplete="new-password"
              value={mdp.confirmation} onChange={(e) => setMdp({ ...mdp, confirmation: e.target.value })} />

            <button
              type="button"
              onClick={() => setVoirMdp((v) => !v)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              {voirMdp ? <EyeOff size={15} /> : <Eye size={15} />}
              {voirMdp ? "Masquer" : "Afficher"} les mots de passe
            </button>

            <PrimaryButton type="submit" icone={KeyRound} chargement={envoiMdp} pleineLargeur>
              Changer le mot de passe
            </PrimaryButton>
          </form>
        </Card>
      </div>
    </div>
  );
}
