import { useCallback, useRef, useState, type ReactNode } from "react";

import { ConfirmDialog } from "../components/ui/Modal";

interface OptionsConfirmation {
  titre: string;
  message: string;
  libelle?: string;
  // Action destructive : bouton rouge.
  danger?: boolean;
}

/**
 * Remplace window.confirm par une fenêtre animée.
 *   const { confirmer, dialogue } = useConfirmation();
 *   if (!(await confirmer({ titre, message }))) return;
 * et afficher `{dialogue}` dans le rendu du composant.
 */
export const useConfirmation = () => {
  const [options, setOptions] = useState<OptionsConfirmation | null>(null);
  const resolution = useRef<((valeur: boolean) => void) | null>(null);

  const confirmer = useCallback(
    (demande: OptionsConfirmation) =>
      new Promise<boolean>((resolve) => {
        resolution.current = resolve;
        setOptions(demande);
      }),
    []
  );

  const repondre = (valeur: boolean) => {
    resolution.current?.(valeur);
    resolution.current = null;
    setOptions(null);
  };

  const dialogue: ReactNode = (
    <ConfirmDialog
      ouvert={options !== null}
      titre={options?.titre ?? ""}
      message={options?.message ?? ""}
      libelleConfirmer={options?.libelle}
      danger={options?.danger}
      onConfirmer={() => repondre(true)}
      onAnnuler={() => repondre(false)}
    />
  );

  return { confirmer, dialogue };
};
