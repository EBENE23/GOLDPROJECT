import { useEffect, useRef, useState } from "react";

import { distanceEntre, capEntre, type Coordonnees } from "../utils/itineraire";

export interface PositionAgent {
  coordonnees: Coordonnees;
  // Précision en mètres.
  precision: number;
  // Direction de déplacement en degrés (0 = nord), null tant que l'agent est immobile.
  cap: number | null;
  // Vitesse en m/s, null si inconnue.
  vitesse: number | null;
}

const messageErreur = (erreur: GeolocationPositionError) => {
  switch (erreur.code) {
    case erreur.PERMISSION_DENIED:
      return "Localisation refusée. Autorisez l'accès à la position dans les paramètres du navigateur.";
    case erreur.POSITION_UNAVAILABLE:
      return "Position indisponible. Vérifiez que le GPS du téléphone est activé.";
    default:
      return "La recherche de votre position a expiré. Déplacez-vous à découvert.";
  }
};

// Déplacement minimal (m) pour recalculer le cap à partir des positions successives.
const DEPLACEMENT_CAP_M = 4;

/** Suit la position GPS de l'appareil tant que le composant est affiché. */
export const useGeolocalisation = (actif = true) => {
  const [position, setPosition] = useState<PositionAgent | null>(null);
  const [erreur, setErreur] = useState("");
  const precedente = useRef<Coordonnees | null>(null);
  const dernierCap = useRef<number | null>(null);

  useEffect(() => {
    if (!actif) {
      return;
    }

    if (!("geolocation" in navigator)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setErreur("La géolocalisation n'est pas prise en charge par ce navigateur.");
      return;
    }

    if (!window.isSecureContext) {
      setErreur("La géolocalisation exige une connexion sécurisée (HTTPS) ou localhost.");
      return;
    }

    const idSuivi = navigator.geolocation.watchPosition(
      (resultat) => {
        const coordonnees: Coordonnees = [resultat.coords.latitude, resultat.coords.longitude];

        // Le cap fourni par le GPS n'est fiable qu'en mouvement ; sinon on le déduit
        // des deux dernières positions distinctes.
        let cap = Number.isFinite(resultat.coords.heading) ? resultat.coords.heading : null;

        if (cap === null && precedente.current) {
          if (distanceEntre(precedente.current, coordonnees) >= DEPLACEMENT_CAP_M) {
            cap = capEntre(precedente.current, coordonnees);
            precedente.current = coordonnees;
          } else {
            cap = dernierCap.current;
          }
        } else {
          precedente.current = coordonnees;
        }

        dernierCap.current = cap;
        setErreur("");
        setPosition({
          coordonnees,
          precision: resultat.coords.accuracy,
          cap,
          vitesse: Number.isFinite(resultat.coords.speed) ? resultat.coords.speed : null,
        });
      },
      (echec) => setErreur(messageErreur(echec)),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 }
    );

    return () => navigator.geolocation.clearWatch(idSuivi);
  }, [actif]);

  return { position, erreur };
};

/** Empêche la mise en veille de l'écran pendant la navigation (si le navigateur le permet). */
export const useEcranAllume = (actif = true) => {
  useEffect(() => {
    if (!actif || !("wakeLock" in navigator)) {
      return;
    }

    let verrou: WakeLockSentinel | null = null;
    let arrete = false;

    const demander = async () => {
      try {
        verrou = await navigator.wakeLock.request("screen");
      } catch {
        /* refusé (économie d'énergie, onglet masqué) : sans conséquence */
      }
    };

    const auRetour = () => {
      if (document.visibilityState === "visible" && !arrete) {
        void demander();
      }
    };

    void demander();
    document.addEventListener("visibilitychange", auRetour);

    return () => {
      arrete = true;
      document.removeEventListener("visibilitychange", auRetour);
      void verrou?.release().catch(() => undefined);
    };
  }, [actif]);
};
