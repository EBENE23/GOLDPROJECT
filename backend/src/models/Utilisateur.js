const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Utilisateur = sequelize.define(
  "Utilisateur",
  {
    idUtilisateur: {
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
      unique: true,
      validate: {
        isEmail: true,
      },
    },

    motDePasse: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    telephone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },

    statutCompte: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "ACTIF",
    },

    dateCreation: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    role: {
      type: DataTypes.ENUM(
        "ADMINISTRATEUR",
        "SUPERVISEUR",
        "AGENT_COLLECTE"
      ),
      allowNull: false,
    },

    id_zone: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "utilisateurs",
    timestamps: false,
  }
);

module.exports = Utilisateur;