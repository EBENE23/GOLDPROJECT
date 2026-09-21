import { useEffect, useRef } from "react";

import { ecouterTempsReel } from "../services/tempsReel";

const TYPES_PAR_DEFAUT = ["mesure", "notification", "maj"];

/**
 * Appelle `rafraichir` dès que le serveur signale un changement (nouvelle mesure
 * d'un capteur, notification, modification de données). Les appels rapprochés
 * sont regroupés. L'interrogation périodique de la page reste le filet de sécurité.
 */
export const useTempsReel = (rafraichir: () => void, types: string[] = TYPES_PAR_DEFAUT) => {
  const dernier = useRef(rafraichir);
  const filtre = useRef(types);

  useEffect(() => {
    dernier.current = rafraichir;
    filtre.current = types;
  });

  useEffect(() => {
    let minuteur: number | undefined;

    const desabonner = ecouterTempsReel((evenement) => {
      if (!filtre.current.includes(evenement.type)) return;

      window.clearTimeout(minuteur);
      minuteur = window.setTimeout(() => dernier.current(), 400);
    });

    return () => {
      window.clearTimeout(minuteur);
      desabonner();
    };
  }, []);
};
