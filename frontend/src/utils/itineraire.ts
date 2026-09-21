export type Coordonnees = [number, number]; // [latitude, longitude]

export interface Itineraire {
  points: Coordonnees[];
  distanceM: number;
  dureeS: number;
  // true si l'itinéraire routier est indisponible (ligne droite estimée)
  approximatif: boolean;
}

const RAYON_TERRE_M = 6371000;
const VITESSE_ESTIMEE_MS = 25 / 3.6; // 25 km/h en ville

const enRadians = (degres: number) => (degres * Math.PI) / 180;

export const distanceEntre = (a: Coordonnees, b: Coordonnees) => {
  const dLat = enRadians(b[0] - a[0]);
  const dLng = enRadians(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(enRadians(a[0])) * Math.cos(enRadians(b[0])) * Math.sin(dLng / 2) ** 2;

  return 2 * RAYON_TERRE_M * Math.asin(Math.sqrt(h));
};

export const formaterDistance = (metres: number) =>
  metres < 1000 ? `${Math.round(metres)} m` : `${(metres / 1000).toFixed(1)} km`;

export const formaterDuree = (secondes: number) => {
  const minutes = Math.max(1, Math.round(secondes / 60));

  if (minutes < 60) {
    return `${minutes} min`;
  }

  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
};

const ligneDroite = (depart: Coordonnees, arrivee: Coordonnees): Itineraire => {
  const distanceM = distanceEntre(depart, arrivee);

  return {
    points: [depart, arrivee],
    distanceM,
    dureeS: distanceM / VITESSE_ESTIMEE_MS,
    approximatif: true,
  };
};

/**
 * Calcule l'itinéraire routier via le service public OSRM (OpenStreetMap).
 * En cas d'échec (hors ligne, service indisponible), retourne une ligne droite.
 */
export const calculerItineraire = async (
  depart: Coordonnees,
  arrivee: Coordonnees,
  signal?: AbortSignal
): Promise<Itineraire> => {
  const controleur = new AbortController();
  const delai = window.setTimeout(() => controleur.abort(), 8000);
  signal?.addEventListener("abort", () => controleur.abort());

  try {
    const url =
      "https://router.project-osrm.org/route/v1/driving/" +
      `${depart[1]},${depart[0]};${arrivee[1]},${arrivee[0]}` +
      "?overview=full&geometries=geojson";

    const reponse = await fetch(url, { signal: controleur.signal });

    if (!reponse.ok) {
      throw new Error(`OSRM ${reponse.status}`);
    }

    const donnees = await reponse.json();
    const route = donnees?.routes?.[0];

    if (!route?.geometry?.coordinates?.length) {
      throw new Error("Aucun itinéraire");
    }

    return {
      points: route.geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng] as Coordonnees
      ),
      distanceM: route.distance,
      dureeS: route.duration,
      approximatif: false,
    };
  } catch (erreur) {
    if (signal?.aborted) {
      throw erreur;
    }

    return ligneDroite(depart, arrivee);
  } finally {
    window.clearTimeout(delai);
  }
};

/** Cap (0–360°, 0 = nord) pour aller du point a vers le point b. */
export const capEntre = (a: Coordonnees, b: Coordonnees) => {
  const phi1 = enRadians(a[0]);
  const phi2 = enRadians(b[0]);
  const dLambda = enRadians(b[1] - a[1]);
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);

  return (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360;
};

export const longueurChemin = (points: Coordonnees[]) =>
  points.reduce((total, point, i) => (i === 0 ? 0 : total + distanceEntre(points[i - 1], point)), 0);

/**
 * Partie de l'itinéraire restant à parcourir : part de la position de l'agent et
 * reprend au point de la route le plus proche (le trajet « se consomme » en avançant).
 */
export const cheminRestant = (points: Coordonnees[], position: Coordonnees): Coordonnees[] => {
  if (points.length < 2) {
    return points;
  }

  let indexProche = 0;
  let minimum = Infinity;

  points.forEach((point, i) => {
    const distance = distanceEntre(point, position);

    if (distance < minimum) {
      minimum = distance;
      indexProche = i;
    }
  });

  return [position, ...points.slice(indexProche + 1)];
};
