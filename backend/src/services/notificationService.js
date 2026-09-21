const { Notification } = require("../models");
const { diffuserAUtilisateur } = require("./evenementsService");

const notifierAffectationMission = async ({
  mission,
  intervention,
  agent,
  bac,
  superviseur,
  transaction,
}) => {
  if (!agent?.idUtilisateur || !mission || !intervention) {
    return null;
  }

  const referenceBac = bac?.reference || `#${intervention.id_bac}`;
  const nomSuperviseur =
    (superviseur
      ? `${superviseur.prenom || ""} ${superviseur.nom || ""}`.trim()
      : "") || "Votre superviseur";

  // La diffusion a lieu à la fin de la requête HTTP, une fois la transaction validée.
  if (transaction && typeof transaction.afterCommit === "function") {
    transaction.afterCommit(() => diffuserAUtilisateur(agent.idUtilisateur, "notification", {}));
  } else {
    diffuserAUtilisateur(agent.idUtilisateur, "notification", {});
  }

  return Notification.create(
    {
      contenu:
        `${nomSuperviseur} vous a affecté une mission pour le bac ` +
        `${referenceBac}. Consultez vos missions pour voir les détails.`,
      dateNotification: new Date(),
      lu: false,
      idUtilisateur: agent.idUtilisateur,
      id_bac: intervention.id_bac,
    },
    { transaction }
  );
};

// Notifie le superviseur d'une intervention (mission démarrée, terminée…).
const notifierSuperviseur = async ({ idSuperviseur, contenu, idBac, transaction }) => {
  if (!idSuperviseur) {
    return null;
  }

  const notification = await Notification.create(
    {
      contenu,
      dateNotification: new Date(),
      lu: false,
      idUtilisateur: idSuperviseur,
      id_bac: idBac ?? null,
    },
    { transaction }
  );

  if (transaction && typeof transaction.afterCommit === "function") {
    transaction.afterCommit(() => diffuserAUtilisateur(idSuperviseur, "notification", {}));
  } else {
    diffuserAUtilisateur(idSuperviseur, "notification", {});
  }

  return notification;
};

module.exports = {
  notifierAffectationMission,
  notifierSuperviseur,
};
