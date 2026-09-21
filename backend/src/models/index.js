const sequelize = require("../config/database");

const Utilisateur = require("./Utilisateur");
const DemandeInscription = require("./DemandeInscription");
const Zone = require("./Zone");
const Bac = require("./Bac");
const Mesure = require("./Mesure");
const Intervention = require("./Intervention");
const Mission = require("./Mission");
const Notification = require("./Notification");
const Incident = require("./Incident");

Utilisateur.hasMany(Mission, {
  foreignKey: "id_agent",
  as: "missions",
});

Mission.belongsTo(Utilisateur, {
  foreignKey: "id_agent",
  as: "agent",
});

Utilisateur.hasMany(Intervention, {
  foreignKey: "id_superviseur",
  as: "interventionsSuperviseur",
});

Intervention.belongsTo(Utilisateur, {
  foreignKey: "id_superviseur",
  as: "superviseur",
});

Utilisateur.hasOne(Zone, {
  foreignKey: "id_superviseur",
  as: "zoneSupervisee",
});

Zone.belongsTo(Utilisateur, {
  foreignKey: "id_superviseur",
  as: "superviseur",
});

Zone.hasMany(Bac, {
  foreignKey: "id_zone",
  as: "bacs",
});

Bac.belongsTo(Zone, {
  foreignKey: "id_zone",
  as: "zone",
});

Bac.hasMany(Mesure, {
  foreignKey: "id_bac",
  as: "mesures",
});

Mesure.belongsTo(Bac, {
  foreignKey: "id_bac",
  as: "bac",
});

Bac.hasMany(Intervention, {
  foreignKey: "id_bac",
  as: "interventions",
});

Intervention.belongsTo(Bac, {
  foreignKey: "id_bac",
  as: "bac",
});

Intervention.hasOne(Mission, {
  foreignKey: "id_intervention",
  as: "mission",
});

Mission.belongsTo(Intervention, {
  foreignKey: "id_intervention",
  as: "intervention",
});

Mission.hasMany(Incident, {
  foreignKey: "id_mission",
  as: "incidents",
});

Incident.belongsTo(Mission, {
  foreignKey: "id_mission",
  as: "mission",
});

Utilisateur.hasMany(Incident, {
  foreignKey: "id_agent",
  as: "incidents",
});

Incident.belongsTo(Utilisateur, {
  foreignKey: "id_agent",
  as: "agent",
});

Zone.hasMany(Utilisateur, {
  foreignKey: "id_zone",
  as: "agents",
});

Utilisateur.belongsTo(Zone, {
  foreignKey: "id_zone",
  as: "zoneAffectation",
});

DemandeInscription.belongsTo(Utilisateur, {
  foreignKey: "idUtilisateur",
  as: "utilisateur",
});

Utilisateur.hasMany(Notification, {
  foreignKey: "idUtilisateur",
  as: "notifications",
});

Notification.belongsTo(Utilisateur, {
  foreignKey: "idUtilisateur",
  as: "utilisateur",
});

Bac.hasMany(Notification, {
  foreignKey: "id_bac",
  as: "notifications",
});

Notification.belongsTo(Bac, {
  foreignKey: "id_bac",
  as: "bac",
});

module.exports = {
  sequelize,
  Utilisateur,
  DemandeInscription,
  Zone,
  Bac,
  Mesure,
  Intervention,
  Mission,
  Notification,
  Incident,
};