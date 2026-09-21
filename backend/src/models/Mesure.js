const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Mesure = sequelize.define(
  "Mesure",
  {
    idMesure: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    distance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    niveau: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    pourcentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },

    dateMesure: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    qualiteMesure: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    id_bac: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "mesures",
    timestamps: false,
  }
);

module.exports = Mesure;