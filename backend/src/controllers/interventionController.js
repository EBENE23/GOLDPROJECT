const { Op } = require("sequelize");

const {
  Intervention,
  Bac,
  Zone,
  Utilisateur,
  Mission,
  sequelize,
} = require("../models");

const {
  notifierAffectationMission,
} = require("../services/notificationService");

const obtenirZoneSuperviseur = async (
  idUtilisateur
) => {
  return await Zone.findOne({
    where: {
      id_superviseur: idUtilisateur,
    },
  });
};

const verifierAgentDisponible = async (
  id_agent,
  idZone,
  transaction
) => {
  return await Utilisateur.findOne({
    where: {
      idUtilisateur: id_agent,
      role: "AGENT_COLLECTE",
      statutCompte: "ACTIF",
      id_zone: idZone,
    },
    transaction,
  });
};

const verifierLimiteMissions = async (
  id_agent,
  transaction
) => {
  const limite = Number(
    process.env.MAX_MISSIONS_ACTIVES || 5
  );

  const missionsActives =
    await Mission.count({
      where: {
        id_agent,
        statut: {
          [Op.in]: [
            "AFFECTEE",
            "EN_COURS",
            "SUSPENDUE",
          ],
        },
      },
      transaction,
    });

  return {
    limite,
    missionsActives,
    disponible:
      missionsActives < limite,
  };
};

const creerMissionPourIntervention =
  async ({
    intervention,
    id_agent,
    idZone,
    bac,
    transaction,
  }) => {
    const agent =
      await verifierAgentDisponible(
        id_agent,
        idZone,
        transaction
      );

    if (!agent) {
      throw new Error(
        "Agent actif introuvable dans votre zone."
      );
    }

    const limite =
      await verifierLimiteMissions(
        id_agent,
        transaction
      );

    if (!limite.disponible) {
      throw new Error(
        `Cet agent possède déjà ${limite.missionsActives} missions actives. La limite autorisée est de ${limite.limite}.`
      );
    }

    const missionExistante =
      await Mission.findOne({
        where: {
          id_intervention:
            intervention.idIntervention,
        },
        transaction,
      });

    if (missionExistante) {
      throw new Error(
        "Une mission existe déjà pour cette intervention."
      );
    }

    const mission =
      await Mission.create(
        {
          dateAffectation: new Date(),
          statut: "AFFECTEE",
          id_intervention:
            intervention.idIntervention,
          id_agent,
        },
        {
          transaction,
        }
      );

    await intervention.update(
      {
        statut: "PLANIFIEE",
      },
      {
        transaction,
      }
    );

    await notifierAffectationMission({
      mission,
      intervention,
      agent,
      bac,
      transaction,
    });

    return {
      mission,
      agent,
    };
  };

const creerIntervention = async (
  req,
  res
) => {
  const transaction =
    await sequelize.transaction();

  try {
    const {
      id_bac,
      datePrevue,
      priorite,
      motif,
      id_agent,
    } = req.body || {};

    const id_superviseur =
      req.user.idUtilisateur;

    if (!id_bac) {
      await transaction.rollback();

      return res.status(400).json({
        message:
          "Le bac est obligatoire.",
      });
    }

    const zone =
      await obtenirZoneSuperviseur(
        id_superviseur
      );

    if (!zone) {
      await transaction.rollback();

      return res.status(404).json({
        message:
          "Aucune zone n'est affectée à ce superviseur.",
      });
    }

    const bac =
      await Bac.findOne({
        where: {
          id_bac,
          id_zone: zone.idZone,
        },
        transaction,
      });

    if (!bac) {
      await transaction.rollback();

      return res.status(404).json({
        message:
          "Bac introuvable dans votre zone.",
      });
    }

    const interventionExistante =
      await Intervention.findOne({
        where: {
          id_bac,
          statut: {
            [Op.in]: [
              "EN_ATTENTE",
              "PLANIFIEE",
              "EN_COURS",
            ],
          },
        },
        transaction,
      });

    if (interventionExistante) {
      await transaction.rollback();

      return res.status(409).json({
        message:
          "Une intervention active existe déjà pour ce bac.",
      });
    }

    const intervention =
      await Intervention.create(
        {
          dateCreation: new Date(),
          datePrevue:
            datePrevue || null,
          priorite:
            priorite || "NORMALE",
          motif: motif || null,
          statut: id_agent
            ? "PLANIFIEE"
            : "EN_ATTENTE",
          id_bac,
          id_superviseur,
        },
        {
          transaction,
        }
      );

    let mission = null;
    let agent = null;

    if (id_agent) {
      const resultat =
        await creerMissionPourIntervention({
          intervention,
          id_agent,
          idZone: zone.idZone,
          bac,
          transaction,
        });

      mission =
        resultat.mission;

      agent =
        resultat.agent;
    }

    await transaction.commit();

    return res.status(201).json({
      message:
        mission
          ? "Intervention et mission créées avec succès."
          : "Intervention créée avec succès.",
      intervention,
      mission,
      bac,
      agent: agent
        ? {
            idUtilisateur:
              agent.idUtilisateur,
            nom: agent.nom,
            prenom: agent.prenom,
            email: agent.email,
            telephone:
              agent.telephone,
          }
        : null,
    });
  } catch (error) {
    await transaction.rollback();

    console.error(
      "Erreur création intervention :",
      error
    );

    return res.status(400).json({
      message:
        error.message ||
        "Erreur lors de la création de l'intervention.",
    });
  }
};

const affecterIntervention = async (
  req,
  res
) => {
  const transaction =
    await sequelize.transaction();

  try {
    const { id } = req.params;
    const { id_agent } =
      req.body || {};

    const id_superviseur =
      req.user.idUtilisateur;

    if (!id_agent) {
      await transaction.rollback();

      return res.status(400).json({
        message:
          "L'agent est obligatoire.",
      });
    }

    const zone =
      await obtenirZoneSuperviseur(
        id_superviseur
      );

    if (!zone) {
      await transaction.rollback();

      return res.status(404).json({
        message:
          "Aucune zone n'est affectée à ce superviseur.",
      });
    }

    const intervention =
      await Intervention.findOne({
        where: {
          idIntervention: id,
          id_superviseur,
        },
        transaction,
      });

    if (!intervention) {
      await transaction.rollback();

      return res.status(404).json({
        message:
          "Intervention introuvable.",
      });
    }

    if (
      intervention.statut ===
        "TERMINEE" ||
      intervention.statut ===
        "ANNULEE"
    ) {
      await transaction.rollback();

      return res.status(409).json({
        message:
          "Cette intervention ne peut plus être affectée.",
      });
    }

    const missionExistante =
      await Mission.findOne({
        where: {
          id_intervention:
            intervention.idIntervention,
        },
        transaction,
      });

    if (missionExistante) {
      await transaction.rollback();

      return res.status(409).json({
        message:
          "Une mission est déjà affectée à cette intervention.",
      });
    }

    const resultat =
      await creerMissionPourIntervention({
        intervention,
        id_agent,
        idZone: zone.idZone,
        transaction,
      });


    await transaction.commit();

    return res.status(201).json({
      message:
        "Agent affecté et mission créée avec succès.",
      intervention,
      mission:
        resultat.mission,
      agent: {
        idUtilisateur:
          resultat.agent.idUtilisateur,
        nom:
          resultat.agent.nom,
        prenom:
          resultat.agent.prenom,
        email:
          resultat.agent.email,
        telephone:
          resultat.agent.telephone,
      },
    });
  } catch (error) {
    await transaction.rollback();

    console.error(
      "Erreur affectation intervention :",
      error
    );

    return res.status(400).json({
      message:
        error.message ||
        "Erreur lors de l'affectation de l'agent.",
    });
  }
};

const listerInterventions = async (
  req,
  res
) => {
  try {
    const idUtilisateur =
      req.user.idUtilisateur;

    const role =
      req.user.role;

    const where = {};

    if (role === "SUPERVISEUR") {
      where.id_superviseur =
        idUtilisateur;
    }

    if (role === "AGENT_COLLECTE") {
      const missions =
        await Mission.findAll({
          attributes: [
            "id_intervention",
          ],
          where: {
            id_agent:
              idUtilisateur,
            statut: {
              [Op.in]: [
                "AFFECTEE",
                "EN_COURS",
                "SUSPENDUE",
                "TERMINEE",
                "ANNULEE",
              ],
            },
          },
          raw: true,
        });

      const idsInterventions =
        missions
          .map(
            (mission) =>
              mission.id_intervention
          )
          .filter(
            (id) =>
              id !== null &&
              id !== undefined
          );

      if (
        idsInterventions.length ===
        0
      ) {
        return res.status(200).json({
          totalInterventions: 0,
          interventions: [],
        });
      }

      where.idIntervention = {
        [Op.in]:
          idsInterventions,
      };
    }

    const interventions =
      await Intervention.findAll({
        where,
        include: [
          {
            model: Bac,
            as: "bac",
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
            ],
          },
          {
            model: Utilisateur,
            as: "superviseur",
            attributes: [
              "idUtilisateur",
              "nom",
              "prenom",
              "email",
              "role",
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
                  "email",
                  "telephone",
                  "role",
                  "statutCompte",
                ],
              },
            ],
          },
        ],
        order: [
          ["dateCreation", "DESC"],
        ],
      });

    return res.status(200).json({
      totalInterventions:
        interventions.length,
      interventions,
    });
  } catch (error) {
    console.error(
      "Erreur liste interventions :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la récupération des interventions.",
    });
  }
};

const consulterIntervention = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const intervention =
      await Intervention.findByPk(
        id,
        {
          include: [
            {
              model: Bac,
              as: "bac",
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
              ],
            },
            {
              model: Utilisateur,
              as: "superviseur",
              attributes: [
                "idUtilisateur",
                "nom",
                "prenom",
                "email",
                "role",
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
                    "email",
                    "telephone",
                    "role",
                    "statutCompte",
                  ],
                },
              ],
            },
          ],
        }
      );

    if (!intervention) {
      return res.status(404).json({
        message:
          "Intervention introuvable.",
      });
    }

    if (
      req.user.role ===
        "SUPERVISEUR" &&
      Number(
        intervention.id_superviseur
      ) !==
        Number(
          req.user.idUtilisateur
        )
    ) {
      return res.status(403).json({
        message:
          "Cette intervention ne relève pas de votre supervision.",
      });
    }

    if (
      req.user.role ===
        "AGENT_COLLECTE" &&
      (!intervention.mission ||
        Number(
          intervention.mission.id_agent
        ) !==
          Number(
            req.user.idUtilisateur
          ))
    ) {
      return res.status(403).json({
        message:
          "Cette intervention ne vous est pas affectée.",
      });
    }

    return res.status(200).json({
      intervention,
    });
  } catch (error) {
    console.error(
      "Erreur consultation intervention :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la consultation de l'intervention.",
    });
  }
};

const modifierIntervention = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const id_superviseur =
      req.user.idUtilisateur;

    const intervention =
      await Intervention.findOne({
        where: {
          idIntervention: id,
          id_superviseur,
        },
      });

    if (!intervention) {
      return res.status(404).json({
        message:
          "Intervention introuvable.",
      });
    }

    if (
      intervention.statut ===
        "TERMINEE" ||
      intervention.statut ===
        "ANNULEE"
    ) {
      return res.status(409).json({
        message:
          "Cette intervention ne peut plus être modifiée.",
      });
    }

    const champsAutorises = [
      "datePrevue",
      "priorite",
      "motif",
    ];

    const modifications = {};

    for (
      const champ of champsAutorises
    ) {
      if (
        req.body?.[champ] !==
        undefined
      ) {
        modifications[champ] =
          req.body[champ];
      }
    }

    if (
      Object.keys(modifications)
        .length === 0
    ) {
      return res.status(400).json({
        message:
          "Aucune modification valide fournie.",
      });
    }

    await intervention.update(
      modifications
    );

    return res.status(200).json({
      message:
        "Intervention modifiée avec succès.",
      intervention,
    });
  } catch (error) {
    console.error(
      "Erreur modification intervention :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la modification de l'intervention.",
    });
  }
};

const annulerIntervention = async (
  req,
  res
) => {
  const transaction =
    await sequelize.transaction();

  try {
    const { id } =
      req.params;

    const id_superviseur =
      req.user.idUtilisateur;

    const intervention =
      await Intervention.findOne({
        where: {
          idIntervention: id,
          id_superviseur,
        },
        include: [
          {
            model: Mission,
            as: "mission",
          },
        ],
        transaction,
      });

    if (!intervention) {
      await transaction.rollback();

      return res.status(404).json({
        message:
          "Intervention introuvable.",
      });
    }

    if (
      intervention.statut ===
        "TERMINEE" ||
      intervention.statut ===
        "ANNULEE"
    ) {
      await transaction.rollback();

      return res.status(409).json({
        message:
          "Cette intervention ne peut plus être annulée.",
      });
    }

    await intervention.update(
      {
        statut: "ANNULEE",
      },
      {
        transaction,
      }
    );

    if (
      intervention.mission &&
      intervention.mission.statut !==
        "TERMINEE"
    ) {
      await intervention.mission.update(
        {
          statut: "ANNULEE",
        },
        {
          transaction,
        }
      );
    }

    await transaction.commit();

    return res.status(200).json({
      message:
        "Intervention annulée avec succès.",
      intervention,
    });
  } catch (error) {
    await transaction.rollback();

    console.error(
      "Erreur annulation intervention :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de l'annulation de l'intervention.",
    });
  }
};

module.exports = {
  creerIntervention,
  affecterIntervention,
  listerInterventions,
  consulterIntervention,
  modifierIntervention,
  annulerIntervention,
};