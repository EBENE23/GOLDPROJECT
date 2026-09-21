const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DemandeInscription = sequelize.define(
  "DemandeInscription",
  {
    idDemande: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    nom: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    prenom: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    motDePasse: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    telephone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },

    roleDemande: {
      type: DataTypes.ENUM(
        "SUPERVISEUR",
        "AGENT_COLLECTE"
      ),
      allowNull: false,
    },

    statut: {
      type: DataTypes.ENUM(
        "EN_ATTENTE",
        "APPROUVEE",
        "REFUSEE"
      ),
      allowNull: false,
      defaultValue: "EN_ATTENTE",
    },

    dateDemande: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    idUtilisateur: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "demandes_inscription",
    timestamps: false,
  }
);

module.exports = DemandeInscription;