const COTE = 256;
const QUALITE = 0.82;

/**
 * Lit une image choisie par l'utilisateur et la réduit en carré 256×256 (JPEG).
 * La photo est stockée en base et affichée dans des listes : elle doit rester légère.
 */
export const preparerPhotoProfil = (fichier: File): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!fichier.type.startsWith("image/")) {
      reject(new Error("Sélectionnez une image valide (JPG, PNG ou WEBP)."));
      return;
    }

    const lecteur = new FileReader();
    lecteur.onerror = () => reject(new Error("Impossible de lire cette image."));
    lecteur.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Cette image est illisible ou corrompue."));
      image.onload = () => {
        // Recadrage centré en carré, sans déformer le visage.
        const cote = Math.min(image.width, image.height);
        const canvas = document.createElement("canvas");
        canvas.width = COTE;
        canvas.height = COTE;
        const contexte = canvas.getContext("2d");

        if (!contexte) {
          reject(new Error("Le traitement de l'image n'est pas disponible."));
          return;
        }

        contexte.fillStyle = "#ffffff";
        contexte.fillRect(0, 0, COTE, COTE);
        contexte.drawImage(
          image,
          (image.width - cote) / 2,
          (image.height - cote) / 2,
          cote,
          cote,
          0,
          0,
          COTE,
          COTE
        );
        resolve(canvas.toDataURL("image/jpeg", QUALITE));
      };
      image.src = String(lecteur.result);
    };
    lecteur.readAsDataURL(fichier);
  });
