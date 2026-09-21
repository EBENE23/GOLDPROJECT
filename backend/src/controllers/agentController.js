const {
  Mission,
  Intervention,
  Bac,
  Zone,
  Utilisateur
} = require("../models");

const verifierAgent = async (idUtilisateur) => {
  return await Utilisateur.findOne({
    where: {
      idUtilisateur,
      role: "AGENT_COLLECTE",
      statutCompte: "ACTIF"
    }
  });
};

const consulterTableauAgent = async (req, res) => {
  try {
    const idAgent = req.user.idUtilisateur;

    const agent = await verifierAgent(idAgent);

    if (!agent) {
      return res.status(404).json({
        message: "Agent introuvable ou compte inactif."
      });
    }

    const missions = await Mission.findAll({
      where: {
        id_agent: idAgent
      },
      include: [
        {
          model: Intervention,
          as: "intervention",
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
                    "description"
                  ]
                }
              ]
            }
          ]
        }
      ],
      order: [["dateAffectation", "DESC"]]
    });

    const statistiques = {
      total: missions.length,
      affectees: missions.filter(
        (mission) =>
          mission.statut === "AFFECTEE"
      ).length,
      enCours: missions.filter(
        (mission) =>
          mission.statut === "EN_COURS"
      ).length,
      suspendues: missions.filter(
        (mission) =>
          mission.statut === "SUSPENDUE"
      ).length,
      terminees: missions.filter(
        (mission) =>
          mission.statut === "TERMINEE"
      ).length,
      annulees: missions.filter(
        (mission) =>
          mission.statut === "ANNULEE"
      ).length
    };

    return res.status(200).json({
      agent: {
        idUtilisateur:
          agent.idUtilisateur,
        nom: agent.nom,
        prenom: agent.prenom,
        email: agent.email,
        telephone: agent.telephone,
        role: agent.role,
        statutCompte:
          agent.statutCompte,
        id_zone: agent.id_zone
      },
      statistiques,
      missions
    });
  } catch (error) {
    console.error(
      "Erreur tableau de bord agent :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la récupération du tableau de bord."
    });
  }
};

const consulterMissionsAgent = async (
  req,
  res
) => {
  try {
    const idAgent = req.user.idUtilisateur;

    const agent =
      await verifierAgent(idAgent);

    if (!agent) {
      return res.status(404).json({
        message:
          "Agent introuvable ou compte inactif."
      });
    }

    const missions =
      await Mission.findAll({
        where: {
          id_agent: idAgent
        },
        include: [
          {
            model: Intervention,
            as: "intervention",
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
                      "description"
                    ]
                  }
                ]
              }
            ]
          }
        ],
        order: [
          ["dateAffectation", "DESC"]
        ]
      });

    return res.status(200).json({
      totalMissions:
        missions.length,
      missions
    });
  } catch (error) {
    console.error(
      "Erreur missions agent :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la récupération des missions."
    });
  }
};

const consulterMissionAgent = async (
  req,
  res
) => {
  try {
    const idAgent = req.user.idUtilisateur;
    const { id } = req.params;

    const agent =
      await verifierAgent(idAgent);

    if (!agent) {
      return res.status(404).json({
        message:
          "Agent introuvable ou compte inactif."
      });
    }

    const mission =
      await Mission.findOne({
        where: {
          idMission: id,
          id_agent: idAgent
        },
        include: [
          {
            model: Intervention,
            as: "intervention",
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
                      "description"
                    ]
                  }
                ]
              },
              {
                model: Utilisateur,
                as: "superviseur",
                attributes: [
                  "idUtilisateur",
                  "nom",
                  "prenom",
                  "email",
                  "telephone",
                  "role"
                ]
              }
            ]
          },
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
              "statutCompte"
            ]
          }
        ]
      });

    if (!mission) {
      return res.status(404).json({
        message:
          "Mission introuvable ou non affectée à cet agent."
      });
    }

    return res.status(200).json({
      mission
    });
  } catch (error) {
    console.error(
      "Erreur détail mission agent :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la consultation de la mission."
    });
  }
};

const consulterLocalisationMission = async (
  req,
  res
) => {
  try {
    const idAgent = req.user.idUtilisateur;
    const { id } = req.params;

    const agent =
      await verifierAgent(idAgent);

    if (!agent) {
      return res.status(404).json({
        message:
          "Agent introuvable ou compte inactif."
      });
    }

    const mission =
      await Mission.findOne({
        where: {
          idMission: id,
          id_agent: idAgent
        },
        include: [
          {
            model: Intervention,
            as: "intervention",
            include: [
              {
                model: Bac,
                as: "bac",
                attributes: [
                  "id_bac",
                  "reference",
                  "latitude",
                  "longitude",
                  "niveau_remplissage",
                  "etat"
                ],
                include: [
                  {
                    model: Zone,
                    as: "zone",
                    attributes: [
                      "idZone",
                      "nomZone",
                      "description"
                    ]
                  }
                ]
              }
            ]
          }
        ]
      });

    if (!mission) {
      return res.status(404).json({
        message:
          "Mission introuvable ou non affectée à cet agent."
      });
    }

    if (
      !mission.intervention ||
      !mission.intervention.bac
    ) {
      return res.status(404).json({
        message:
          "Point de collecte introuvable."
      });
    }

    const bac =
      mission.intervention.bac;

    return res.status(200).json({
      mission: {
        idMission:
          mission.idMission,
        statut: mission.statut,
        dateAffectation:
          mission.dateAffectation,
        dateDebut:
          mission.dateDebut,
        dateFin:
          mission.dateFin
      },
      pointCollecte: {
        id_bac: bac.id_bac,
        reference: bac.reference,
        latitude: bac.latitude,
        longitude: bac.longitude,
        niveau_remplissage:
          bac.niveau_remplissage,
        etat: bac.etat,
        zone: bac.zone
      }
    });
  } catch (error) {
    console.error(
      "Erreur localisation mission agent :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la récupération de la localisation."
    });
  }
};

const consulterLocalisationBacsAgent = async (
  req,
  res
) => {
  try {
    const idAgent = req.user.idUtilisateur;

    const agent =
      await verifierAgent(idAgent);

    if (!agent) {
      return res.status(404).json({
        message:
          "Agent introuvable ou compte inactif."
      });
    }

    if (!agent.id_zone) {
      return res.status(200).json({
        zone: null,
        total: 0,
        bacs: [],
        message:
          "Aucune zone n'est affectée à cet agent."
      });
    }

    const zone =
      await Zone.findOne({
        where: {
          idZone: agent.id_zone
        },
        attributes: [
          "idZone",
          "nomZone",
          "description"
        ]
      });

    if (!zone) {
      return res.status(404).json({
        message:
          "La zone affectée à cet agent est introuvable."
      });
    }

    const bacs =
      await Bac.findAll({
        where: {
          id_zone: agent.id_zone
        },
        include: [
          {
            model: Zone,
            as: "zone",
            attributes: [
              "idZone",
              "nomZone",
              "description"
            ]
          }
        ],
        order: [
          ["reference", "ASC"]
        ]
      });

    return res.status(200).json({
      zone,
      total: bacs.length,
      bacs
    });
  } catch (error) {
    console.error(
      "Erreur localisation bacs agent :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la récupération de la localisation des bacs."
    });
  }
};

// Enregistre la dernière position de l'agent pour une mission en cours.
const mettreAJourPositionMission = async (req, res) => {
  try {
    const latitude = Number(req.body?.latitude);
    const longitude = Number(req.body?.longitude);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        message: "Coordonnées GPS invalides."
      });
    }

    const mission = await Mission.findOne({
      where: {
        idMission: req.params.id,
        id_agent: req.user.idUtilisateur
      }
    });

    if (!mission) {
      return res.status(404).json({
        message: "Mission introuvable ou non affectée à votre compte."
      });
    }

    if (mission.statut !== "EN_COURS") {
      return res.status(409).json({
        message: "La position n'est suivie que pour une mission en cours."
      });
    }

    await mission.update({
      latitudeAgent: latitude,
      longitudeAgent: longitude,
      datePositionAgent: new Date()
    });

    return res.status(200).json({
      message: "Position enregistrée."
    });
  } catch (error) {
    console.error("Erreur position mission :", error);

    return res.status(500).json({
      message: "Impossible d'enregistrer la position."
    });
  }
};

module.exports = {
  mettreAJourPositionMission,
  consulterTableauAgent,
  consulterMissionsAgent,
  consulterMissionAgent,
  consulterLocalisationMission,
  consulterLocalisationBacsAgent
};