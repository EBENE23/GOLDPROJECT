import api from "./api";

export interface EvenementTempsReel {
  // "mesure" | "notification" | "maj" | "connecte"
  type: string;
  donnees: Record<string, unknown>;
}

type Ecouteur = (evenement: EvenementTempsReel) => void;

const ecouteurs = new Set<Ecouteur>();
let actif = false;
let controleur: AbortController | null = null;

const pause = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const traiterBloc = (bloc: string) => {
  let type = "message";
  let donnees = "";

  for (const ligne of bloc.split("\n")) {
    if (ligne.startsWith("event:")) type = ligne.slice(6).trim();
    else if (ligne.startsWith("data:")) donnees += ligne.slice(5).trim();
  }

  if (bloc.startsWith(":") || !donnees) return;

  let contenu: Record<string, unknown> = {};
  try {
    contenu = JSON.parse(donnees);
  } catch {
    /* données non JSON : ignorées */
  }

  ecouteurs.forEach((ecouteur) => ecouteur({ type, donnees: contenu }));
};

/** Maintient la connexion SSE ouverte, avec reconnexion automatique. */
const maintenirConnexion = async () => {
  while (actif) {
    controleur = new AbortController();

    try {
      const token = localStorage.getItem("smartcitywaste_token");

      if (token) {
        const reponse = await fetch(`${api.defaults.baseURL}/evenements`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
          signal: controleur.signal,
        });

        if (reponse.ok && reponse.body) {
          const lecteur = reponse.body.getReader();
          const decodeur = new TextDecoder();
          let tampon = "";

          while (actif) {
            const { done, value } = await lecteur.read();
            if (done) break;

            tampon += decodeur.decode(value, { stream: true });
            const blocs = tampon.split("\n\n");
            tampon = blocs.pop() ?? "";
            blocs.forEach(traiterBloc);
          }
        }
      }
    } catch {
      /* coupure réseau ou arrêt volontaire : on retente ci-dessous */
    }

    if (actif) await pause(3000);
  }
};

/** S'abonne aux événements temps réel ; retourne la fonction de désabonnement. */
export const ecouterTempsReel = (ecouteur: Ecouteur) => {
  ecouteurs.add(ecouteur);

  if (!actif) {
    actif = true;
    void maintenirConnexion();
  }

  return () => {
    ecouteurs.delete(ecouteur);

    if (ecouteurs.size === 0) {
      actif = false;
      controleur?.abort();
    }
  };
};
