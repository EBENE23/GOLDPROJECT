const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Incident = sequelize.define("Incident", {
  idIncident: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  description: { type: DataTypes.TEXT, allowNull: false },
  statut: { type: DataTypes.ENUM("OUVERT", "TRAITE"), defaultValue: "OUVERT" },
  latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  dateCreation: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  id_mission: { type: DataTypes.INTEGER, allowNull: false },
  id_agent: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: "incidents", timestamps: false });

module.exports = Incident;
