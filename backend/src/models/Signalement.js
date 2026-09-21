const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Signalement = sequelize.define(
  "Signalement",
  {
    idSignalement: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    typeProbleme: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    statut: {
      type: DataTypes.ENUM(
        "EN_ATTENTE",
        "EN_COURS",
        "TRAITE",
        "REJETE"
      ),
      allowNull: false,
      defaultValue: "EN_ATTENTE",
    },
    dateSignalement: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    id_agent: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "signalements",
    timestamps: false,
  }
);

module.exports = Signalement;