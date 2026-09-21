const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Notification = sequelize.define(
  "Notification",
  {
    idNotification: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    contenu: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    dateNotification: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    lu: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    idUtilisateur: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    id_bac: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "notifications",
    timestamps: false,
  }
);

module.exports = Notification;