import L from "leaflet";

import { normaliserNiveauBac, obtenirCouleurNiveauBac } from "../../utils/bacLevel";

// Tracé « poubelle » (grille 24×24).
const CHEMIN_POUBELLE =
  "M18 6L17.2 18C17.13 19.07 17.09 19.59 16.87 19.99C16.67 20.34 16.36 20.62 16 20.8C15.59 21 15.06 21 14 21H10C8.94 21 8.41 21 8 20.8C7.64 20.62 7.33 20.34 7.13 19.99C6.91 19.59 6.87 19.07 6.8 18L6 6M4 6H20M16 6L15.73 5.19C15.47 4.4 15.34 4.01 15.09 3.72C14.88 3.46 14.6 3.26 14.29 3.14C13.94 3 13.52 3 12.69 3H11.31C10.48 3 10.06 3 9.71 3.14C9.4 3.26 9.12 3.46 8.91 3.72C8.66 4.01 8.53 4.4 8.27 5.19L8 6M14 10V17M10 10V17";

/**
 * Icône d'un bac : épingle colorée selon le niveau de remplissage, poubelle,
 * pastille de pourcentage, et halo pulsé lorsque le bac est critique (> 80 %).
 */
export const iconeBac = (
  niveau: number | string | null | undefined,
  selectionne = false
) => {
  const valeur = Math.round(normaliserNiveauBac(niveau));
  const couleur = obtenirCouleurNiveauBac(valeur);
  const critique = valeur > 80;
  const largeur = 46;
  const hauteur = 58;

  const html = `
    <div class="bac-pin ${selectionne ? "bac-pin--selectionne" : ""}" style="--c:${couleur}">
      ${critique ? '<span class="bac-pin__halo"></span>' : ""}
      <svg width="${largeur}" height="${hauteur}" viewBox="0 0 46 58" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M23 56C23 56 4 34 4 22a19 19 0 1 1 38 0c0 12-19 34-19 34z"
              fill="${couleur}" stroke="white" stroke-width="3" stroke-linejoin="round"/>
        <circle cx="23" cy="22" r="13.5" fill="white"/>
        <g transform="translate(11 10)">
          <path d="${CHEMIN_POUBELLE}" stroke="${couleur}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
      </svg>
      <span class="bac-pin__niveau">${valeur}%</span>
    </div>`;

  return L.divIcon({
    className: "bac-marker",
    html,
    iconSize: [largeur, hauteur],
    iconAnchor: [largeur / 2, hauteur - 2],
    popupAnchor: [0, -(hauteur - 8)],
  });
};

/**
 * Icône de l'agent de collecte : pastille bleue avec halo. La flèche tourne selon
 * la direction de déplacement (cap en degrés) ; sans cap, un point central est affiché.
 */
export const iconeAgent = (cap: number | null = null) =>
  L.divIcon({
    className: "bac-marker",
    html: `
      <div class="agent-pin">
        <span class="agent-pin__halo"></span>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="17" fill="#2563eb" stroke="white" stroke-width="3"/>
          ${
            cap === null
              ? '<circle cx="20" cy="20" r="5" fill="white"/>'
              : `<g style="transform-origin:20px 20px;transform:rotate(${Math.round(cap)}deg);transition:transform .4s ease">
                   <path d="M20 8.5L27.5 27L20 23L12.5 27Z" fill="white"/>
                 </g>`
          }
        </svg>
      </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
