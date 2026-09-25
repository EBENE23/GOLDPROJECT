import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Bell, BellRing, Check, Languages, LogOut, Moon, Palette, Sun } from "lucide-react";

import { Card, PageHeader, SectionTitle } from "../../components/ui/kit";
import { ConfirmDialog } from "../../components/ui/Modal";
import { logout, useAuthStore } from "../../stores/authStore";
import { useTranslation } from "../../i18n";
import {
  applyAppearance,
  loadUserPreferences,
  saveUserPreferences,
  type AppAccent,
  type AppLangue,
  type AppTailleTexte,
  type AppTheme,
  type UserPreferences,
} from "../../utils/userPreferences";

const DRAPEAUX: Record<AppLangue, string> = {
  fr: "/images/drapeaux/fr.svg",
  en: "/images/drapeaux/en.svg",
  it: "/images/drapeaux/it.svg",
  es: "/images/drapeaux/es.svg",
};

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
  const { t, setLangue } = useTranslation();
  const navigate = useNavigate();
  const utilisateur = useAuthStore((state) => state.utilisateur);
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadUserPreferences(utilisateur));
  const [deconnexion, setDeconnexion] = useState(false);

  const modifier = (changement: Partial<UserPreferences>, message?: string) => {
    const suivantes = { ...preferences, ...changement };
    setPreferences(suivantes);
    saveUserPreferences(utilisateur, suivantes);

    if (changement.theme || changement.accent || changement.tailleTexte) {
      applyAppearance(suivantes.theme, suivantes.accent, suivantes.tailleTexte);
    }
    if (changement.langue) setLangue(suivantes.langue);
    if (message) toast.success(message, { toastId: "preferences", autoClose: 1800 });
  };

  const themes: { valeur: AppTheme; libelle: string; icone: typeof Sun; apercu: string }[] = [
    { valeur: "clair", libelle: t("preferences.clair"), icone: Sun, apercu: "#ffffff" },
    { valeur: "sombre", libelle: t("preferences.sombre"), icone: Moon, apercu: "#1e293b" },
  ];

  const accents: { valeur: AppAccent; libelle: string; couleur: string }[] = [
    { valeur: "emeraude", libelle: t("preferences.emeraude"), couleur: "#10b981" },
    { valeur: "bleu", libelle: t("preferences.bleu"), couleur: "#3b82f6" },
    { valeur: "violet", libelle: t("preferences.violet"), couleur: "#8b5cf6" },
    { valeur: "orange", libelle: t("preferences.orange"), couleur: "#f97316" },
  ];

  const tailles: { valeur: AppTailleTexte; libelle: string; apercu: string }[] = [
    { valeur: "petite", libelle: t("preferences.petite"), apercu: "text-xs" },
    { valeur: "normale", libelle: t("preferences.normale"), apercu: "text-sm" },
    { valeur: "grande", libelle: t("preferences.grande"), apercu: "text-base" },
  ];

  const langues: { valeur: AppLangue; libelle: string }[] = [
    { valeur: "fr", libelle: "Français" },
    { valeur: "en", libelle: "English" },
    { valeur: "it", libelle: "Italiano" },
    { valeur: "es", libelle: "Español" },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader titre={t("preferences.titre")} description={t("preferences.description")} />

      <Card className="p-5 sm:p-6">
        <SectionTitle icone={Palette} titre={t("preferences.apparence")} sousTitre={t("preferences.themeApplication")} />
        <div className="mt-4 grid grid-cols-2 gap-3">
          {themes.map(({ valeur, libelle, icone: Icone, apercu }) => {
            const actif = preferences.theme === valeur;

            return (
              <button
                key={valeur}
                type="button"
                aria-pressed={actif}
                onClick={() => modifier({ theme: valeur }, t("preferences.themeActive", { theme: libelle.toLowerCase() }))}
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

        <p className="mt-5 text-sm font-semibold text-slate-700">{t("preferences.couleurPrincipale")}</p>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {accents.map(({ valeur, libelle, couleur }) => {
            const actif = preferences.accent === valeur;

            return (
              <button
                key={valeur}
                type="button"
                aria-pressed={actif}
                onClick={() => modifier({ accent: valeur }, t("preferences.couleurActive", { couleur: libelle.toLowerCase() }))}
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

        <p className="mt-5 text-sm font-semibold text-slate-700">{t("preferences.tailleTexte")}</p>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {tailles.map(({ valeur, libelle, apercu }) => {
            const actif = preferences.tailleTexte === valeur;

            return (
              <button
                key={valeur}
                type="button"
                aria-pressed={actif}
                onClick={() => modifier({ tailleTexte: valeur }, t("preferences.tailleActive", { taille: libelle.toLowerCase() }))}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-3 transition active:scale-[0.98] ${
                  actif ? "border-emerald-600 bg-emerald-50/60" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className={`font-bold text-slate-900 ${apercu}`}>Aa</span>
                <span className="text-xs font-semibold text-slate-600">{libelle}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <SectionTitle icone={Languages} titre={t("preferences.langue")} sousTitre={t("preferences.langueUtilisee")} />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {langues.map(({ valeur, libelle }) => {
            const actif = preferences.langue === valeur;

            return (
              <button
                key={valeur}
                type="button"
                aria-pressed={actif}
                onClick={() => modifier({ langue: valeur }, t("preferences.langueActive", { langue: libelle }))}
                className={`flex items-center gap-2.5 rounded-2xl border-2 px-3 py-2.5 text-left transition active:scale-[0.98] ${
                  actif ? "border-emerald-600 bg-emerald-50/60" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <img src={DRAPEAUX[valeur]} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-slate-200" />
                <span className="text-sm font-bold text-slate-900">{libelle}</span>
                {actif && <Check size={15} className="ml-auto shrink-0 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="divide-y divide-slate-100 p-5 sm:p-6">
        <SectionTitle icone={Bell} titre={t("preferences.notifications")} sousTitre={t("preferences.notificationsDesc")} />
        <Interrupteur
          icone={Bell}
          libelle={t("preferences.notifLabel")}
          description={t("preferences.notifDesc")}
          actif={preferences.notifications}
          onChange={(valeur) => modifier({ notifications: valeur }, valeur ? t("preferences.notifActivees") : t("preferences.notifDesactivees"))}
        />
        <Interrupteur
          icone={BellRing}
          libelle={t("preferences.alertesCritiquesLabel")}
          description={t("preferences.alertesCritiquesDesc")}
          actif={preferences.alertesCritiques}
          onChange={(valeur) =>
            modifier(
              { alertesCritiques: valeur },
              valeur ? t("preferences.alertesCritiquesActivees") : t("preferences.alertesCritiquesDesactivees")
            )
          }
        />
      </Card>

      <Card className="p-5 sm:p-6">
        <SectionTitle icone={LogOut} titre={t("preferences.session")} sousTitre={utilisateur?.email} />
        <button
          type="button"
          onClick={() => setDeconnexion(true)}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 active:scale-[0.98] sm:w-auto"
        >
          <LogOut size={17} />
          {t("preferences.seDeconnecter")}
        </button>
      </Card>

      <ConfirmDialog
        ouvert={deconnexion}
        titre={t("preferences.confirmerDeconnexionTitre")}
        message={t("preferences.confirmerDeconnexionMessage")}
        libelleConfirmer={t("preferences.seDeconnecter")}
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
