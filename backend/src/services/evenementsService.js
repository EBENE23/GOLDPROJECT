const { Zone } = require("../models");

/**
 * Diffusion d'événements en temps réel (Server-Sent Events).
 *
 * Les applications ouvrent GET /api/evenements ; le serveur y pousse :
 *  - "mesure"       : un capteur a transmis une mesure (bac, niveau, état)
 *  - "notification" : une notification vient d'être créée pour l'utilisateur
 *  - "maj"          : une ressource a été modifiée (interventions, missions…)
 * Les événements ne contiennent pas de données sensibles : ils servent à
 * déclencher le rechargement des données via l'API authentifiée.
 */
const clients = new Set();

const ajouterClient = async (req, res, utilisateur) => {
  const zones = new Set();

  if (utilisateur.role === "SUPERVISEUR") {
    const zonesSupervisees = await Zone.findAll({
      where: { id_superviseur: utilisateur.idUtilisateur },
      attributes: ["idZone"],
    });
    zonesSupervisees.forEach((zone) => zones.add(zone.idZone));
  } else if (utilisateur.id_zone) {
    zones.add(utilisateur.id_zone);
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write("retry: 3000\n\n");
  res.write(`event: connecte\ndata: {}\n\n`);

  const client = {
    res,
    idUtilisateur: utilisateur.idUtilisateur,
    role: utilisateur.role,
    zones,
  };
  clients.add(client);

  // Commentaire périodique : garde la connexion ouverte à travers les proxys.
  const battement = setInterval(() => res.write(": ping\n\n"), 25000);

  req.on("close", () => {
    clearInterval(battement);
    clients.delete(client);
  });
};

const envoyer = (client, type, donnees) => {
  try {
    client.res.write(`event: ${type}\ndata: ${JSON.stringify(donnees ?? {})}\n\n`);
  } catch {
    clients.delete(client);
  }
};

/** Envoie à tous les clients, ou seulement à ceux concernés par la zone. */
const diffuser = (type, donnees, { idZone } = {}) => {
  for (const client of clients) {
    const concerne =
      idZone === undefined ||
      client.role === "ADMINISTRATEUR" ||
      client.zones.has(idZone);

    if (concerne) {
      envoyer(client, type, donnees);
    }
  }
};

/** Envoie uniquement aux connexions d'un utilisateur donné. */
const diffuserAUtilisateur = (idUtilisateur, type, donnees) => {
  for (const client of clients) {
    if (client.idUtilisateur === idUtilisateur) {
      envoyer(client, type, donnees);
    }
  }
};

module.exports = { ajouterClient, diffuser, diffuserAUtilisateur };
