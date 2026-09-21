const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Zone = sequelize.define(
  "Zone",
  {
    idZone: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    nomZone: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    id_superviseur: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true,
    },
  },
  {
    tableName: "zones",
    timestamps: false,
  }
);

module.exports = Zone;