const mqtt = require("mqtt");

const {
  Bac,
  Mesure,
  Notification,
  Zone,
  Utilisateur,
  sequelize,
} = require("../models");

const {
  calculerRemplissage,
} = require("./mesureService");

const {
  diffuser,
  diffuserAUtilisateur,
} = require("./evenementsService");

const BROKER_URL =
  process.env.MQTT_BROKER_URL ||
  "mqtt://localhost:1883";

const TOPIC =
  process.env.MQTT_TOPIC ||
  "smartcitywaste/bacs/+/mesure";

let clientMQTT = null;

const creerNotificationAlerte = async ({
  bac,
  ancienEtat,
  nouvelEtat,
  superviseur,
  transaction,
}) => {
  if (!superviseur) {
    console.log(
      `Aucun superviseur associé à la zone du bac ${bac.reference}.`
    );

    return;
  }

  if (ancienEtat === nouvelEtat) {
    return;
  }

  if (nouvelEtat === "NORMAL") {
    return;
  }

  let contenu = "";

  if (nouvelEtat === "ALERTE") {
    contenu =
      `Alerte : le bac ${bac.reference} a atteint ` +
      `${bac.niveau_remplissage}% de remplissage. ` +
      `Une intervention peut être planifiée.`;
  }

  if (nouvelEtat === "PLEIN") {
    contenu =
      `Urgence : le bac ${bac.reference} est plein ` +
      `avec un niveau de remplissage de ` +
      `${bac.niveau_remplissage}%. ` +
      `Une intervention est nécessaire.`;
  }

  if (!contenu) {
    return;
  }

  await Notification.create(
    {
      contenu,
      dateNotification: new Date(),
      lu: false,
      idUtilisateur:
        superviseur.idUtilisateur,
      id_bac: bac.id_bac,
    },
    {
      transaction,
    }
  );

  console.log(
    `Notification créée pour le superviseur ${superviseur.idUtilisateur} - ${bac.reference} - ${nouvelEtat}`
  );

  return superviseur.idUtilisateur;
};

const traiterMesureMQTT = async (
  topic,
  message
) => {
  try {
    const parties = topic.split("/");

    if (parties.length !== 4) {
      console.error(
        "Topic MQTT invalide :",
        topic
      );

      return;
    }

    const referenceBac = parties[2];

    let donnees;

    try {
      donnees = JSON.parse(
        message.toString()
      );
    } catch (error) {
      console.error(
        "Message MQTT JSON invalide :",
        message.toString()
      );

      return;
    }

    const distance = Number(
      donnees.distance
    );

    if (
      Number.isNaN(distance) ||
      distance < 0
    ) {
      console.error(
        "Distance MQTT invalide :",
        donnees.distance
      );

      return;
    }

    const transaction =
      await sequelize.transaction();

    try {
      const bac = await Bac.findOne({
        where: {
          reference: referenceBac,
        },
        include: [
          {
            model: Zone,
            as: "zone",
            required: true,
            include: [
              {
                model: Utilisateur,
                as: "superviseur",
                required: false,
                attributes: [
                  "idUtilisateur",
                  "nom",
                  "prenom",
                  "email",
                  "role",
                  "statutCompte",
                ],
              },
            ],
          },
        ],
        transaction,
      });

      if (!bac) {
        await transaction.rollback();

        console.error(
          `Aucun bac trouvé pour la référence ${referenceBac}.`
        );

        return;
      }

      const ancienEtat = bac.etat;

      const resultat =
        calculerRemplissage({
          distance,
          hauteur: bac.hauteur,
        });

      await Mesure.create(
        {
          id_bac: bac.id_bac,
          distance:
            resultat.distance,
          niveau:
            resultat.niveau,
          pourcentage:
            resultat.pourcentage,
          qualiteMesure:
            donnees.qualiteMesure ||
            "BONNE",
        },
        {
          transaction,
        }
      );

      await bac.update(
        {
          niveau_remplissage:
            resultat.pourcentage,
          etat: resultat.etat,
        },
        {
          transaction,
        }
      );

      const superviseur =
        bac.zone?.superviseur ||
        null;

      const idDestinataire = await creerNotificationAlerte({
        bac: {
          id_bac: bac.id_bac,
          reference: bac.reference,
          niveau_remplissage:
            resultat.pourcentage,
        },
        ancienEtat,
        nouvelEtat:
          resultat.etat,
        superviseur,
        transaction,
      });

      await transaction.commit();

      diffuser(
        "mesure",
        {
          id_bac: bac.id_bac,
          reference: bac.reference,
          pourcentage: resultat.pourcentage,
          etat: resultat.etat,
        },
        { idZone: bac.id_zone }
      );

      if (idDestinataire) {
        diffuserAUtilisateur(idDestinataire, "notification", {});
      }

      console.log(
        `Mesure enregistrée - ${referenceBac} : ${resultat.pourcentage}% - ${resultat.etat}`
      );
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error(
      "Erreur lors du traitement de la mesure MQTT :",
      error.message
    );
  }
};

const demarrerMqtt = () => {
  clientMQTT =
    mqtt.connect(BROKER_URL);

  clientMQTT.on(
    "connect",
    () => {
      console.log(
        "Connexion au broker MQTT réussie."
      );

      clientMQTT.subscribe(
        TOPIC,
        (error) => {
          if (error) {
            console.error(
              "Erreur lors de l'abonnement MQTT :",
              error.message
            );

            return;
          }

          console.log(
            `Abonnement MQTT effectué : ${TOPIC}`
          );
        }
      );
    }
  );

  clientMQTT.on(
    "message",
    async (
      topic,
      message
    ) => {
      await traiterMesureMQTT(
        topic,
        message
      );
    }
  );

  clientMQTT.on(
    "error",
    (error) => {
      console.error(
        "Erreur MQTT :",
        error.message
      );
    }
  );

  clientMQTT.on(
    "reconnect",
    () => {
      console.log(
        "Reconnexion au broker MQTT..."
      );
    }
  );

  clientMQTT.on(
    "offline",
    () => {
      console.log(
        "Client MQTT hors ligne."
      );
    }
  );

  return clientMQTT;
};

const publierMessageMQTT = (
  topic,
  donnees
) => {
  if (
    !clientMQTT ||
    !clientMQTT.connected
  ) {
    throw new Error(
      "Le client MQTT n'est pas connecté au broker."
    );
  }

  const message =
    typeof donnees === "string"
      ? donnees
      : JSON.stringify(donnees);

  clientMQTT.publish(
    topic,
    message
  );
};

module.exports = {
  demarrerMqtt,
  publierMessageMQTT,
  traiterMesureMQTT,
};