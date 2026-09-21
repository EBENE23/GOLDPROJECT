require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const {
  sequelize,
} = require("./src/models");

const authRoutes = require("./src/routes/authRoutes");
const utilisateurRoutes = require("./src/routes/utilisateurRoutes");
const demandeInscriptionRoutes = require("./src/routes/demandeInscriptionRoutes");
const zoneRoutes = require("./src/routes/zoneRoutes");
const zoneSuperviseurRoutes = require("./src/routes/zoneSuperviseurRoutes");
const bacRoutes = require("./src/routes/bacRoutes");
const mesureRoutes = require("./src/routes/mesureRoutes");
const interventionRoutes = require("./src/routes/interventionRoutes");
const missionRoutes = require("./src/routes/missionRoutes");
const superviseurRoutes = require("./src/routes/superviseurRoutes");
const agentRoutes = require("./src/routes/agentRoutes");
const incidentRoutes = require("./src/routes/incidentRoutes");
const profilRoutes = require("./src/routes/profilRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const evenementRoutes = require("./src/routes/evenementRoutes");
const { diffuser } = require("./src/services/evenementsService");

const {
  mettreAJourSchema,
} = require("./src/config/schemaUpdates");

const {
  demarrerMqtt,
} = require("./src/services/mqttService");

const app = express();

const PORT =
  process.env.PORT || 3000;

app.use(helmet());

// CORS_ORIGINS="https://mon-site.cm,https://admin.mon-site.cm" pour restreindre
// en production. Sans valeur, toutes les origines sont acceptées (développement).
const originesAutorisees = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origine) => origine.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: originesAutorisees.length > 0 ? originesAutorisees : true,
  })
);

app.use(
  express.json({
    limit: "6mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

// Après toute écriture réussie, prévient les applications connectées afin
// qu'elles rechargent les données concernées (temps réel).
const RESSOURCES_SUIVIES = [
  "interventions",
  "missions",
  "incidents",
  "bacs",
  "zones",
  "utilisateurs",
  "demandes-inscription",
  "agent",
];

app.use("/api", (req, res, next) => {
  if (req.method !== "GET" && req.method !== "OPTIONS") {
    res.on("finish", () => {
      const ressource = req.path.split("/")[1];

      if (res.statusCode < 400 && RESSOURCES_SUIVIES.includes(ressource)) {
        diffuser("maj", { ressource });
      }
    });
  }

  next();
});

app.get("/api/test", (req, res) => {
  res.json({
    message:
      "API SmartCityWaste opérationnelle.",
  });
});

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/utilisateurs",
  utilisateurRoutes
);

app.use(
  "/api/demandes-inscription",
  demandeInscriptionRoutes
);

app.use(
  "/api/zones",
  zoneSuperviseurRoutes
);

app.use(
  "/api/zones",
  zoneRoutes
);

app.use(
  "/api/bacs",
  bacRoutes
);

app.use(
  "/api/mesures",
  mesureRoutes
);

app.use(
  "/api/interventions",
  interventionRoutes
);

app.use(
  "/api/missions",
  missionRoutes
);

app.use(
  "/api/superviseur",
  superviseurRoutes
);

app.use(
  "/api/agent",
  agentRoutes
);

app.use(
  "/api/incidents",
  incidentRoutes
);

app.use(
  "/api/profil",
  profilRoutes
);

app.use(
  "/api/notifications",
  notificationRoutes
);

app.use(
  "/api/evenements",
  evenementRoutes
);

app.use((req, res) => {
  res.status(404).json({
    message: "Route introuvable.",
    method: req.method,
    path: req.originalUrl,
  });
});

app.use(
  (error, req, res, next) => {
    console.error(
      "Erreur serveur :",
      error
    );

    res.status(
      error.status || 500
    ).json({
      message:
        error.message ||
        "Une erreur interne est survenue.",
    });
  }
);

const demarrerServeur =
  async () => {
    try {
      await sequelize.authenticate();

      console.log(
        "Connexion à la base de données réussie."
      );

      await mettreAJourSchema();

      demarrerMqtt();

      app.listen(
        PORT,
        () => {
          console.log(
            `Serveur SmartCityWaste démarré sur le port ${PORT}.`
          );

          console.log(
            `API disponible sur http://localhost:${PORT}/api`
          );
        }
      );
    } catch (error) {
      console.error(
        "Impossible de démarrer le serveur :",
        error
      );

      process.exit(1);
    }
  };

demarrerServeur();