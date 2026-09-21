const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Intervention = sequelize.define(
  "Intervention",
  {
    idIntervention: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    dateCreation: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    datePrevue: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    priorite: {
      type: DataTypes.ENUM(
        "NORMALE",
        "MOYENNE",
        "HAUTE",
        "CRITIQUE"
      ),
      allowNull: false,
      defaultValue: "NORMALE",
    },

    motif: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    statut: {
      type: DataTypes.ENUM(
        "EN_ATTENTE",
        "PLANIFIEE",
        "EN_COURS",
        "TERMINEE",
        "ANNULEE"
      ),
      allowNull: false,
      defaultValue: "EN_ATTENTE",
    },

    id_bac: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    id_superviseur: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "interventions",
    timestamps: false,
  }
);

module.exports = Intervention;