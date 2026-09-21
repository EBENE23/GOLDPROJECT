const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Mission = sequelize.define(
  "Mission",
  {
    idMission: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    dateAffectation: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    dateDebut: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    dateFin: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    statut: {
      type: DataTypes.ENUM(
        "AFFECTEE",
        "EN_COURS",
        "SUSPENDUE",
        "TERMINEE",
        "ANNULEE"
      ),
      allowNull: false,
      defaultValue: "AFFECTEE",
    },

    observation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Dernière position GPS de l'agent, transmise pendant la mission (suivi).
    latitudeAgent: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },

    longitudeAgent: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },

    datePositionAgent: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    id_intervention: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },

    id_agent: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "missions",
    timestamps: false,
  }
);

module.exports = Mission;