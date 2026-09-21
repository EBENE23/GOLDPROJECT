const {
  sequelize,
  Zone,
  Utilisateur,
} = require("../models");

const affecterSuperviseur = async (
  req,
  res
) => {
  const transaction =
    await sequelize.transaction();

  try {
    const zone = await Zone.findByPk(
      req.params.id,
      { transaction }
    );

    if (!zone) {
      await transaction.rollback();

      return res.status(404).json({
        message: "Zone introuvable.",
      });
    }

    const {
      id_superviseur,
    } = req.body;

    if (!id_superviseur) {
      await transaction.rollback();

      return res.status(400).json({
        message:
          "L'identifiant du superviseur est requis.",
      });
    }

    const superviseur =
      await Utilisateur.findByPk(
        id_superviseur,
        { transaction }
      );

    if (!superviseur) {
      await transaction.rollback();

      return res.status(404).json({
        message:
          "Superviseur introuvable.",
      });
    }

    if (
      superviseur.role !==
      "SUPERVISEUR"
    ) {
      await transaction.rollback();

      return res.status(400).json({
        message:
          "L'utilisateur sélectionné n'est pas un superviseur.",
      });
    }

    if (
      superviseur.statutCompte !==
      "ACTIF"
    ) {
      await transaction.rollback();

      return res.status(400).json({
        message:
          "Le compte du superviseur n'est pas actif.",
      });
    }

    const autreZone =
      await Zone.findOne({
        where: {
          id_superviseur:
            superviseur.idUtilisateur,
        },
        transaction,
      });

    if (
      autreZone &&
      autreZone.idZone !== zone.idZone
    ) {
      await transaction.rollback();

      return res.status(409).json({
        message:
          "Ce superviseur est déjà affecté à une autre zone.",
      });
    }

    await zone.update(
      {
        id_superviseur:
          superviseur.idUtilisateur,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(200).json({
      message:
        "Superviseur affecté à la zone.",
      zone,
    });
  } catch (error) {
    await transaction.rollback();

    return res.status(500).json({
      message:
        "Erreur lors de l'affectation du superviseur.",
      erreur: error.message,
    });
  }
};

const retirerSuperviseur = async (
  req,
  res
) => {
  try {
    const zone = await Zone.findByPk(
      req.params.id
    );

    if (!zone) {
      return res.status(404).json({
        message: "Zone introuvable.",
      });
    }

    await zone.update({
      id_superviseur: null,
    });

    return res.status(200).json({
      message:
        "Superviseur retiré de la zone.",
      zone,
    });
  } catch (error) {
    return res.status(500).json({
      message:
        "Erreur lors du retrait du superviseur.",
      erreur: error.message,
    });
  }
};

module.exports = {
  affecterSuperviseur,
  retirerSuperviseur,
};