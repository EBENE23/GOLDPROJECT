import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2, X } from "lucide-react";

import { useTranslation } from "../../i18n";

interface ModalProps {
  ouvert: boolean;
  onFermer: () => void;
  titre?: string;
  description?: string;
  children: ReactNode;
  // Largeur maximale sur ordinateur.
  largeur?: "sm" | "md" | "lg";
}

const largeurs = { sm: "sm:max-w-sm", md: "sm:max-w-lg", lg: "sm:max-w-2xl" };

/**
 * Fenêtre animée : feuille qui monte du bas sur mobile, boîte de dialogue centrée
 * qui apparaît en fondu sur ordinateur. Se ferme avec Échap ou un clic à l'extérieur.
 */
export default function Modal({ ouvert, onFermer, titre, description, children, largeur = "md" }: ModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!ouvert) return;

    const auClavier = (evenement: KeyboardEvent) => {
      if (evenement.key === "Escape") onFermer();
    };
    const debordement = document.body.style.overflow;

    document.addEventListener("keydown", auClavier);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", auClavier);
      document.body.style.overflow = debordement;
    };
  }, [ouvert, onFermer]);

  return (
    <AnimatePresence>
      {ouvert && (
        <div className="fixed inset-0 z-[2000] flex items-end justify-center sm:items-center sm:p-4">
          <motion.button
            type="button"
            aria-label={t("adminBacs.fermer")}
            onClick={onFermer}
            className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={titre}
            className={`relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6 ${largeurs[largeur]}`}
            initial={{ opacity: 0, y: 48, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
          >
            {(titre || description) && (
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {titre && <h2 className="text-lg font-bold text-slate-900">{titre}</h2>}
                  {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
                </div>
                <button
                  type="button"
                  onClick={onFermer}
                  aria-label={t("adminBacs.fermer")}
                  className="shrink-0 rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 active:scale-95"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface ConfirmDialogProps {
  ouvert: boolean;
  titre: string;
  message: string;
  libelleConfirmer?: string;
  // Action destructive : bouton rouge.
  danger?: boolean;
  enCours?: boolean;
  onConfirmer: () => void;
  onAnnuler: () => void;
}

/** Remplace window.confirm par une fenêtre cohérente avec le reste de l'application. */
export function ConfirmDialog({
  ouvert,
  titre,
  message,
  libelleConfirmer,
  danger = false,
  enCours = false,
  onConfirmer,
  onAnnuler,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const libelle = libelleConfirmer ?? t("modal.confirmer");

  return (
    <Modal ouvert={ouvert} onFermer={enCours ? () => undefined : onAnnuler} largeur="sm">
      <div className="text-center">
        <span
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
            danger ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          <AlertTriangle size={26} />
        </span>
        <h2 className="mt-4 text-lg font-bold text-slate-900">{titre}</h2>
        <p className="mt-1.5 text-sm text-slate-500">{message}</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onAnnuler}
          disabled={enCours}
          className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200 active:scale-[0.98] disabled:opacity-50"
        >
          {t("auth.login.retourCourt")}
        </button>
        <button
          type="button"
          onClick={onConfirmer}
          disabled={enCours}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60 ${
            danger ? "bg-red-600 hover:bg-red-700" : "bg-emerald-800 hover:bg-emerald-900"
          }`}
        >
          {enCours && <Loader2 size={16} className="animate-spin" />}
          {libelle}
        </button>
      </div>
    </Modal>
  );
}
