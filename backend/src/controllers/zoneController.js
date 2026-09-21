const { Zone, Utilisateur, Bac } = require("../models");

const listerZones = async (req, res) => {
  try {
    const zones = await Zone.findAll({
      include: [
        {
          model: Utilisateur,
          as: "superviseur",
          attributes: [
            "idUtilisateur",
            "nom",
            "prenom",
            "email",
            "telephone",
            "statutCompte",
          ],
          required: false,
        },
        {
          model: Bac,
          as: "bacs",
          attributes: [
            "id_bac",
            "reference",
            "niveau_remplissage",
            "etat",
            "latitude",
            "longitude",
          ],
          required: false,
        },
        {
          model: Utilisateur,
          as: "agents",
          attributes: [
            "idUtilisateur",
            "nom",
            "prenom",
            "email",
            "telephone",
            "statutCompte",
            "role",
          ],
          required: false,
        },
      ],
      order: [
        ["idZone", "ASC"],
      ],
    });

    return res.status(200).json(zones);
  } catch (error) {
    console.error(
      "Erreur liste zones :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la récupération des zones.",
    });
  }
};

const consulterZone = async (req, res) => {
  try {
    const { id } = req.params;

    const zone = await Zone.findByPk(id, {
      include: [
        {
          model: Utilisateur,
          as: "superviseur",
          attributes: [
            "idUtilisateur",
            "nom",
            "prenom",
            "email",
            "telephone",
            "statutCompte",
          ],
          required: false,
        },
        {
          model: Bac,
          as: "bacs",
          required: false,
        },
        {
          model: Utilisateur,
          as: "agents",
          attributes: [
            "idUtilisateur",
            "nom",
            "prenom",
            "email",
            "telephone",
            "statutCompte",
            "role",
          ],
          required: false,
        },
      ],
    });

    if (!zone) {
      return res.status(404).json({
        message: "Zone introuvable.",
      });
    }

    return res.status(200).json(zone);
  } catch (error) {
    console.error(
      "Erreur consultation zone :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la consultation de la zone.",
    });
  }
};

module.exports = {
  listerZones,
  consulterZone,
};