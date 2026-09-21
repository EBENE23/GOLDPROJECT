require("dotenv").config();

const bcrypt = require("bcrypt");
const {
  sequelize,
  Utilisateur,
  Zone,
} = require("../src/models");

const creerSuperviseurTest = async () => {
  try {
    await sequelize.authenticate();

    const email = "superviseur@smartcitywaste.cm";
    const motDePasse = "Superviseur@2026";

    const motDePasseHash =
      await bcrypt.hash(motDePasse, 10);

    let superviseur =
      await Utilisateur.findOne({
        where: { email },
      });

    if (!superviseur) {
      superviseur =
        await Utilisateur.create({
          nom: "NGONO",
          prenom: "Patrick",
          email,
          motDePasse: motDePasseHash,
          telephone: "690000000",
          statutCompte: "ACTIF",
          role: "SUPERVISEUR",
        });
    } else {
      await superviseur.update({
        nom: "NGONO",
        prenom: "Patrick",
        motDePasse: motDePasseHash,
        telephone: "690000000",
        statutCompte: "ACTIF",
        role: "SUPERVISEUR",
      });
    }

    let zone = await Zone.findOne({
      where: {
        idZone: 2,
      },
    });

    if (!zone) {
      zone = await Zone.create({
        nomZone: "Zone 2",
        description:
          "Zone de supervision de test",
        id_superviseur:
          superviseur.idUtilisateur,
      });
    } else {
      await zone.update({
        id_superviseur:
          superviseur.idUtilisateur,
      });
    }

    console.log(
      "Superviseur configuré avec succès."
    );

    console.log(
      `ID : ${superviseur.idUtilisateur}`
    );

    console.log(
      `Email : ${email}`
    );

    console.log(
      `Mot de passe : ${motDePasse}`
    );

    console.log(
      `Zone : ${zone.idZone}`
    );

    await sequelize.close();
  } catch (error) {
    console.error(
      "Erreur :",
      error.message
    );

    await sequelize.close();
    process.exit(1);
  }
};

creerSuperviseurTest();