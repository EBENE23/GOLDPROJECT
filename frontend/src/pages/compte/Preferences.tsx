import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Bell, BellRing, Check, LogOut, Moon, Palette, Sun } from "lucide-react";

import { Card, PageHeader, SectionTitle } from "../../components/ui/kit";
import { ConfirmDialog } from "../../components/ui/Modal";
import { logout, useAuthStore } from "../../stores/authStore";
import {
  applyAppearance,
  loadUserPreferences,
  saveUserPreferences,
  type AppAccent,
  type AppTheme,
  type UserPreferences,
} from "../../utils/userPreferences";

function Interrupteur({
  actif,
  onChange,
  libelle,
  description,
  icone: Icone,
}: {
  actif: boolean;
  onChange: (valeur: boolean) => void;
  libelle: string;
  description: string;
  icone: typeof Bell;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <Icone size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{libelle}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={actif}
        aria-label={libelle}
        onClick={() => onChange(!actif)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${actif ? "bg-emerald-600" : "bg-slate-300"}`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            actif ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

/** Préférences d'affichage et de notification. Chaque changement est enregistré aussitôt. */
export default function Preferences() {
  const navigate = useNavigate();
  const utilisateur = useAuthStore((state) => state.utilisateur);
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadUserPreferences(utilisateur));
  const [deconnexion, setDeconnexion] = useState(false);

  const modifier = (changement: Partial<UserPreferences>, message?: string) => {
    const suivantes = { ...preferences, ...changement };
    setPreferences(suivantes);
    saveUserPreferences(utilisateur, suivantes);

    if (changement.theme || changement.accent) applyAppearance(suivantes.theme, suivantes.accent);
    if (message) toast.success(message, { toastId: "preferences", autoClose: 1800 });
  };

  const themes: { valeur: AppTheme; libelle: string; icone: typeof Sun; apercu: string }[] = [
    { valeur: "clair", libelle: "Clair", icone: Sun, apercu: "#ffffff" },
    { valeur: "sombre", libelle: "Sombre", icone: Moon, apercu: "#1e293b" },
  ];

  const accents: { valeur: AppAccent; libelle: string; couleur: string }[] = [
    { valeur: "emeraude", libelle: "Émeraude", couleur: "#10b981" },
    { valeur: "bleu", libelle: "Bleu", couleur: "#3b82f6" },
    { valeur: "violet", libelle: "Violet", couleur: "#8b5cf6" },
    { valeur: "orange", libelle: "Orange", couleur: "#f97316" },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader titre="Préférences" description="Personnalisez l'affichage et les notifications. Les changements sont enregistrés automatiquement." />

      <Card className="p-5 sm:p-6">
        <SectionTitle icone={Palette} titre="Apparence" sousTitre="Thème de l'application" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          {themes.map(({ valeur, libelle, icone: Icone, apercu }) => {
            const actif = preferences.theme === valeur;

            return (
              <button
                key={valeur}
                type="button"
                aria-pressed={actif}
                onClick={() => modifier({ theme: valeur }, `Thème ${libelle.toLowerCase()} activé.`)}
                className={`rounded-2xl border-2 p-3 text-left transition active:scale-[0.98] ${
                  actif ? "border-emerald-600 bg-emerald-50/60" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className="mb-3 flex h-14 items-end gap-1.5 rounded-xl border border-slate-400/40 p-2" style={{ background: apercu }}>
                  <span className="h-3 w-8 rounded bg-emerald-500" />
                  <span className="h-6 w-4 rounded bg-slate-300/70" />
                  <span className="h-4 w-4 rounded bg-slate-300/70" />
                </span>
                <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Icone size={16} />
                  {libelle}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-5 text-sm font-semibold text-slate-700">Couleur principale</p>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {accents.map(({ valeur, libelle, couleur }) => {
            const actif = preferences.accent === valeur;

            return (
              <button
                key={valeur}
                type="button"
                aria-pressed={actif}
                onClick={() => modifier({ accent: valeur }, `Couleur ${libelle.toLowerCase()} activée.`)}
                className={`flex items-center gap-2.5 rounded-2xl border-2 px-3 py-2.5 text-left transition active:scale-[0.98] ${
                  actif ? "border-emerald-600 bg-emerald-50/60" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white" style={{ background: couleur }}>
                  {actif && <Check size={14} />}
                </span>
                <span className="text-sm font-bold text-slate-900">{libelle}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="divide-y divide-slate-100 p-5 sm:p-6">
        <SectionTitle icone={Bell} titre="Notifications" sousTitre="Messages affichés pendant que vous utilisez l'application" />
        <Interrupteur
          icone={Bell}
          libelle="Notifications"
          description="Affiche un message à l'arrivée d'une nouvelle notification."
          actif={preferences.notifications}
          onChange={(valeur) => modifier({ notifications: valeur }, valeur ? "Notifications activées." : "Notifications désactivées.")}
        />
        <Interrupteur
          icone={BellRing}
          libelle="Alertes critiques"
          description="Met en avant les bacs pleins et les urgences."
          actif={preferences.alertesCritiques}
          onChange={(valeur) => modifier({ alertesCritiques: valeur }, valeur ? "Alertes critiques activées." : "Alertes critiques désactivées.")}
        />
      </Card>

      <Card className="p-5 sm:p-6">
        <SectionTitle icone={LogOut} titre="Session" sousTitre={utilisateur?.email} />
        <button
          type="button"
          onClick={() => setDeconnexion(true)}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 active:scale-[0.98] sm:w-auto"
        >
          <LogOut size={17} />
          Se déconnecter
        </button>
      </Card>

      <ConfirmDialog
        ouvert={deconnexion}
        titre="Se déconnecter ?"
        message="Vous devrez saisir à nouveau votre e-mail et votre mot de passe."
        libelleConfirmer="Se déconnecter"
        danger
        onAnnuler={() => setDeconnexion(false)}
        onConfirmer={() => {
          logout();
          navigate("/login", { replace: true });
        }}
      />
    </div>
  );
}
