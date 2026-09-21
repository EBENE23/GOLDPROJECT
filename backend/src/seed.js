require("dotenv").config();

const {
    sequelize,
    Zone
} = require("./models");

const zonesYaounde = [
    {
        nomZone: "Yaoundé 1",
        description:
            "Arrondissement de Yaoundé 1"
    },
    {
        nomZone: "Yaoundé 2",
        description:
            "Arrondissement de Yaoundé 2"
    },
    {
        nomZone: "Yaoundé 3",
        description:
            "Arrondissement de Yaoundé 3"
    },
    {
        nomZone: "Yaoundé 4",
        description:
            "Arrondissement de Yaoundé 4"
    },
    {
        nomZone: "Yaoundé 5",
        description:
            "Arrondissement de Yaoundé 5"
    },
    {
        nomZone: "Yaoundé 6",
        description:
            "Arrondissement de Yaoundé 6"
    },
    {
        nomZone: "Yaoundé 7",
        description:
            "Arrondissement de Yaoundé 7"
    }
];

const initialiserZones = async () => {
    try {
        await sequelize.authenticate();

        console.log(
            "Connexion MySQL réussie."
        );

        await sequelize.sync();

        for (
            const zoneData
            of zonesYaounde
        ) {
            const [zone, created] =
                await Zone.findOrCreate({
                    where: {
                        nomZone:
                            zoneData.nomZone
                    },
                    defaults: {
                        description:
                            zoneData.description,
                        id_superviseur:
                            null
                    }
                });

            if (created) {
                console.log(
                    `Zone créée : ${zone.nomZone}`
                );
            } else {
                console.log(
                    `Zone déjà existante : ${zone.nomZone}`
                );
            }
        }

        console.log(
            "Initialisation des zones terminée."
        );
    } catch (error) {
        console.error(
            "Erreur lors de l'initialisation des zones :",
            error
        );
    } finally {
        await sequelize.close();
    }
};

initialiserZones();