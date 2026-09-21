import { useEffect } from "react";
import { useMap } from "react-leaflet";

import type { Coordonnees } from "../../utils/itineraire";

interface AjusterVueProps {
  points: Coordonnees[];
  // Incrémenter cette valeur force un recentrage (bouton « Recentrer »).
  declencheur?: number;
}

/** Ajuste le zoom de la carte pour afficher tous les points fournis. */
export default function AjusterVue({ points, declencheur = 0 }: AjusterVueProps) {
  const carte = useMap();
  const cle = points.map((point) => point.join(",")).join("|");

  useEffect(() => {
    if (points.length === 1) {
      carte.setView(points[0], 16);
    } else if (points.length > 1) {
      carte.fitBounds(points, { padding: [40, 40], maxZoom: 17 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle, declencheur, carte]);

  return null;
}
