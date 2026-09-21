const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Bac = sequelize.define(
  "Bac",
  {
    id_bac: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    reference: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    capacite: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    hauteur: {
      type: DataTypes.DECIMAL(10, 2),
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

    niveau_remplissage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },

    etat: {
      type: DataTypes.ENUM(
        "NORMAL",
        "ALERTE",
        "PLEIN"
      ),
      allowNull: false,
      defaultValue: "NORMAL",
    },

    date_installation: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    id_zone: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "bacs",
    timestamps: false,
  }
);

module.exports = Bac;