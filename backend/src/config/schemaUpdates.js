const { DataTypes } = require("sequelize");

const sequelize = require("./database");

const nomsTables = async () =>
  (await sequelize.getQueryInterface().showAllTables()).map((table) =>
    String(typeof table === "object" ? Object.values(table)[0] : table).toLowerCase()
  );

// Crée uniquement les tables absentes de la base. Les tables existantes ne sont
// jamais modifiées (contrairement à sequelize.sync() qui réécrit leurs clés).
const creerTablesManquantes = async () => {
  const existantes = await nomsTables();

  for (const modele of Object.values(sequelize.models)) {
    const nomTable = String(modele.getTableName()).toLowerCase();

    if (!existantes.includes(nomTable)) {
      await modele.sync();
      console.log(`Table créée : ${nomTable}`);
    }
  }
};

// Ajoute une colonne (avec sa clé étrangère) si elle est absente.
const ajouterColonneSiAbsente = async (table, colonne, definition, reference) => {
  const interfaceBd = sequelize.getQueryInterface();
  const description = await interfaceBd.describeTable(table);

  if (description[colonne]) {
    return;
  }

  await interfaceBd.addColumn(table, colonne, definition);

  if (reference) {
    await interfaceBd.addConstraint(table, {
      fields: [colonne],
      type: "foreign key",
      name: `fk_${table}_${colonne}`,
      references: reference,
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
  }

  console.log(`Colonne ajoutée : ${table}.${colonne}`);
};

const mettreAJourSchema = async () => {
  await creerTablesManquantes();

  // Relation « Bac occasionne Notification » du diagramme de classes.
  await ajouterColonneSiAbsente(
    "notifications",
    "id_bac",
    { type: DataTypes.INTEGER, allowNull: true },
    { table: "bacs", field: "id_bac" }
  );

  // Suivi de la position de l'agent pendant une mission.
  await ajouterColonneSiAbsente("missions", "latitudeAgent", {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
  });
  await ajouterColonneSiAbsente("missions", "longitudeAgent", {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
  });
  await ajouterColonneSiAbsente("missions", "datePositionAgent", {
    type: DataTypes.DATE,
    allowNull: true,
  });
};

module.exports = { mettreAJourSchema };
