const {
  Bac,
  Zone,
  Mesure,
  Intervention,
  Mission,
  Utilisateur,
} = require("../models");

const verifierAccesZoneSuperviseur = async (
  idUtilisateur,
  idZone
) => {
  const zone = await Zone.findOne({
    where: {
      idZone,
      id_superviseur: idUtilisateur,
    },
  });

  return !!zone;
};

const validerNombre = (
  valeur,
  nom,
  options = {}
) => {
  if (
    valeur === undefined ||
    valeur === null ||
    valeur === ""
  ) {
    return {
      valide: false,
      message: `${nom} est obligatoire.`,
    };
  }

  const nombre = Number(valeur);

  if (!Number.isFinite(nombre)) {
    return {
      valide: false,
      message: `${nom} doit être une valeur numérique valide.`,
    };
  }

  if (
    options.min !== undefined &&
    nombre < options.min
  ) {
    return {
      valide: false,
      message: `${nom} doit être supérieur ou égal à ${options.min}.`,
    };
  }

  if (
    options.max !== undefined &&
    nombre > options.max
  ) {
    return {
      valide: false,
      message: `${nom} doit être inférieur ou égal à ${options.max}.`,
    };
  }

  return {
    valide: true,
    valeur: nombre,
  };
};

const validerDonneesBac = ({
  capacite,
  hauteur,
  latitude,
  longitude,
}) => {
  const capaciteValidation =
    validerNombre(
      capacite,
      "La capacité",
      { min: 0 }
    );

  if (!capaciteValidation.valide) {
    return capaciteValidation;
  }

  const hauteurValidation =
    validerNombre(
      hauteur,
      "La hauteur",
      { min: 0 }
    );

  if (!hauteurValidation.valide) {
    return hauteurValidation;
  }

  const latitudeValidation =
    validerNombre(
      latitude,
      "La latitude",
      {
        min: -90,
        max: 90,
      }
    );

  if (!latitudeValidation.valide) {
    return latitudeValidation;
  }

  const longitudeValidation =
    validerNombre(
      longitude,
      "La longitude",
      {
        min: -180,
        max: 180,
      }
    );

  if (!longitudeValidation.valide) {
    return longitudeValidation;
  }

  if (
    hauteurValidation.valeur === 0
  ) {
    return {
      valide: false,
      message:
        "La hauteur du bac doit être supérieure à zéro.",
    };
  }

  return {
    valide: true,
  };
};

const listerBacs = async (
  req,
  res
) => {
  try {
    const where = {};

    if (
      req.user.role ===
      "SUPERVISEUR"
    ) {
      const zone =
        await Zone.findOne({
          where: {
            id_superviseur:
              req.user.idUtilisateur,
          },
        });

      if (!zone) {
        return res.status(200).json([]);
      }

      where.id_zone =
        zone.idZone;
    }

    if (
      req.user.role ===
      "AGENT_COLLECTE"
    ) {
      const utilisateur =
        await Utilisateur.findByPk(
          req.user.idUtilisateur
        );

      if (
        !utilisateur ||
        !utilisateur.id_zone
      ) {
        return res.status(200).json([]);
      }

      where.id_zone =
        utilisateur.id_zone;
    }

    const bacs =
      await Bac.findAll({
        where,
        include: [
          {
            model: Zone,
            as: "zone",
            attributes: [
              "idZone",
              "nomZone",
              "description",
            ],
          },
          {
            model: Mesure,
            as: "mesures",
            separate: true,
            limit: 1,
            order: [
              [
                "dateMesure",
                "DESC",
              ],
            ],
          },
        ],
        order: [
          ["reference", "ASC"],
        ],
      });

    return res.status(200).json(
      bacs
    );
  } catch (error) {
    console.error(
      "Erreur liste bacs :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la récupération des bacs.",
      erreur: error.message,
    });
  }
};

const consulterBac = async (
  req,
  res
) => {
  try {
    const bac =
      await Bac.findByPk(
        req.params.id,
        {
          include: [
            {
              model: Zone,
              as: "zone",
              attributes: [
                "idZone",
                "nomZone",
                "description",
                "id_superviseur",
              ],
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
                  ],
                  where: {
                    role: "AGENT_COLLECTE",
                  },
                  required: false,
                },
              ],
            },
            {
              model: Mesure,
              as: "mesures",
              separate: true,
              order: [
                [
                  "dateMesure",
                  "DESC",
                ],
              ],
              limit: 20,
            },
            {
              model: Intervention,
              as: "interventions",
              separate: true,
              order: [
                [
                  "dateCreation",
                  "DESC",
                ],
              ],
              include: [
                {
                  model: Utilisateur,
                  as: "superviseur",
                  attributes: [
                    "idUtilisateur",
                    "nom",
                    "prenom",
                  ],
                },
                {
                  model: Mission,
                  as: "mission",
                  include: [
                    {
                      model: Utilisateur,
                      as: "agent",
                      attributes: [
                        "idUtilisateur",
                        "nom",
                        "prenom",
                        "telephone",
                        "statutCompte",
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        }
      );

    if (!bac) {
      return res.status(404).json({
        message:
          "Bac introuvable.",
      });
    }

    if (
      req.user.role ===
      "SUPERVISEUR"
    ) {
      const acces =
        await verifierAccesZoneSuperviseur(
          req.user.idUtilisateur,
          bac.id_zone
        );

      if (!acces) {
        return res.status(403).json({
          message:
            "Ce bac n'appartient pas à votre zone de supervision.",
        });
      }
    }

    if (
      req.user.role ===
      "AGENT_COLLECTE"
    ) {
      const utilisateur =
        await Utilisateur.findByPk(
          req.user.idUtilisateur
        );

      if (
        !utilisateur ||
        utilisateur.id_zone !==
          bac.id_zone
      ) {
        return res.status(403).json({
          message:
            "Ce bac n'appartient pas à votre zone.",
        });
      }

      const mission =
        await Mission.findOne({
          where: {
            id_agent:
              req.user.idUtilisateur,
            statut: [
              "AFFECTEE",
              "EN_COURS",
              "SUSPENDUE",
              "TERMINEE",
            ],
          },
          include: [
            {
              model: Intervention,
              as: "intervention",
              where: {
                id_bac:
                  bac.id_bac,
              },
            },
          ],
        });

      if (!mission) {
        return res.status(403).json({
          message:
            "Ce bac n'est pas associé à l'une de vos missions.",
        });
      }
    }

    return res.status(200).json(
      bac
    );
  } catch (error) {
    console.error(
      "Erreur consultation bac :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la consultation du bac.",
      erreur: error.message,
    });
  }
};

const creerBac = async (
  req,
  res
) => {
  try {
    const {
      reference,
      capacite,
      hauteur,
      latitude,
      longitude,
      date_installation,
      id_zone,
    } = req.body;

    if (
      !reference ||
      capacite === undefined ||
      hauteur === undefined ||
      latitude === undefined ||
      longitude === undefined ||
      !id_zone
    ) {
      return res.status(400).json({
        message:
          "Les informations obligatoires du bac sont requises.",
      });
    }

    const validation =
      validerDonneesBac({
        capacite,
        hauteur,
        latitude,
        longitude,
      });

    if (!validation.valide) {
      return res.status(400).json({
        message:
          validation.message,
      });
    }

    const zone =
      await Zone.findByPk(
        id_zone
      );

    if (!zone) {
      return res.status(404).json({
        message:
          "Zone introuvable.",
      });
    }

    const bacExistant =
      await Bac.findOne({
        where: {
          reference:
            String(reference).trim(),
        },
      });

    if (bacExistant) {
      return res.status(409).json({
        message:
          "Cette référence de bac existe déjà.",
      });
    }

    const bac =
      await Bac.create({
        reference:
          String(reference).trim(),
        capacite,
        hauteur,
        latitude,
        longitude,
        date_installation:
          date_installation ||
          null,
        id_zone,
        niveau_remplissage: 0,
        etat: "NORMAL",
      });

    return res.status(201).json({
      message:
        "Bac créé avec succès.",
      bac,
    });
  } catch (error) {
    console.error(
      "Erreur création bac :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la création du bac.",
      erreur: error.message,
    });
  }
};

const modifierBac = async (
  req,
  res
) => {
  try {
    const bac =
      await Bac.findByPk(
        req.params.id
      );

    if (!bac) {
      return res.status(404).json({
        message:
          "Bac introuvable.",
      });
    }

    const {
      reference,
      capacite,
      hauteur,
      latitude,
      longitude,
      date_installation,
      id_zone,
    } = req.body;

    const nouvellesDonnees = {
      capacite:
        capacite !== undefined
          ? capacite
          : bac.capacite,
      hauteur:
        hauteur !== undefined
          ? hauteur
          : bac.hauteur,
      latitude:
        latitude !== undefined
          ? latitude
          : bac.latitude,
      longitude:
        longitude !== undefined
          ? longitude
          : bac.longitude,
    };

    const validation =
      validerDonneesBac(
        nouvellesDonnees
      );

    if (!validation.valide) {
      return res.status(400).json({
        message:
          validation.message,
      });
    }

    if (
      reference &&
      String(reference).trim() !==
        bac.reference
    ) {
      const existant =
        await Bac.findOne({
          where: {
            reference:
              String(reference).trim(),
          },
        });

      if (existant) {
        return res.status(409).json({
          message:
            "Cette référence de bac existe déjà.",
        });
      }
    }

    if (id_zone !== undefined) {
      const zone =
        await Zone.findByPk(
          id_zone
        );

      if (!zone) {
        return res.status(404).json({
          message:
            "Zone introuvable.",
        });
      }
    }

    await bac.update({
      reference:
        reference !== undefined
          ? String(reference).trim()
          : bac.reference,
      capacite:
        capacite !== undefined
          ? capacite
          : bac.capacite,
      hauteur:
        hauteur !== undefined
          ? hauteur
          : bac.hauteur,
      latitude:
        latitude !== undefined
          ? latitude
          : bac.latitude,
      longitude:
        longitude !== undefined
          ? longitude
          : bac.longitude,
      date_installation:
        date_installation !==
        undefined
          ? date_installation
          : bac.date_installation,
      id_zone:
        id_zone !== undefined
          ? id_zone
          : bac.id_zone,
    });

    return res.status(200).json({
      message:
        "Bac modifié avec succès.",
      bac,
    });
  } catch (error) {
    console.error(
      "Erreur modification bac :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la modification du bac.",
      erreur: error.message,
    });
  }
};

const supprimerBac = async (
  req,
  res
) => {
  try {
    const bac =
      await Bac.findByPk(
        req.params.id
      );

    if (!bac) {
      return res.status(404).json({
        message:
          "Bac introuvable.",
      });
    }

    const interventionCount =
      await Intervention.count({
        where: {
          id_bac:
            bac.id_bac,
        },
      });

    if (
      interventionCount > 0
    ) {
      return res.status(409).json({
        message:
          "Ce bac ne peut pas être supprimé car il possède des interventions.",
      });
    }

    const mesureCount =
      await Mesure.count({
        where: {
          id_bac:
            bac.id_bac,
        },
      });

    if (mesureCount > 0) {
      return res.status(409).json({
        message:
          "Ce bac ne peut pas être supprimé car il possède des mesures.",
      });
    }

    await bac.destroy();

    return res.status(200).json({
      message:
        "Bac supprimé avec succès.",
    });
  } catch (error) {
    console.error(
      "Erreur suppression bac :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la suppression du bac.",
      erreur: error.message,
    });
  }
};

module.exports = {
  listerBacs,
  consulterBac,
  creerBac,
  modifierBac,
  supprimerBac,
};