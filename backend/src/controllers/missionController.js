const {
  Mission,
  Intervention,
  Bac,
  Zone,
  Utilisateur,
} = require("../models");

const {
  notifierAffectationMission,
  notifierSuperviseur,
} = require("../services/notificationService");

const {
  SEUIL_ALERTE,
  calculerEtatBac,
} = require("../services/mesureService");

const nomAgent = async (idAgent) => {
  const agent = await Utilisateur.findByPk(idAgent, {
    attributes: ["nom", "prenom"],
  });

  return agent ? `${agent.prenom} ${agent.nom}`.trim() : "L'agent";
};

const MAX_MISSIONS_ACTIVES = Number(
  process.env.MAX_MISSIONS_ACTIVES || 5
);

const missionsActives = [
  "AFFECTEE",
  "EN_COURS",
  "SUSPENDUE"
];

const obtenirMissionAgent = async (
  idMission,
  idAgent
) => {
  return await Mission.findOne({
    where: {
      idMission,
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
                as: "zone"
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
};

const creerMission = async (
  req,
  res
) => {
  try {
    const {
      id_intervention,
      id_agent
    } = req.body || {};

    const id_superviseur =
      req.user.idUtilisateur;

    if (!id_intervention || !id_agent) {
      return res.status(400).json({
        message:
          "L'intervention et l'agent sont obligatoires."
      });
    }

    const intervention =
      await Intervention.findOne({
        where: {
          idIntervention:
            id_intervention,
          id_superviseur
        },
        include: [
          {
            model: Bac,
            as: "bac"
          }
        ]
      });

    if (!intervention) {
      return res.status(404).json({
        message:
          "Intervention introuvable ou non autorisée."
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
          "Cette intervention ne peut pas recevoir une mission."
      });
    }

    const agent =
      await Utilisateur.findOne({
        where: {
          idUtilisateur: id_agent,
          role: "AGENT_COLLECTE",
          statutCompte: "ACTIF"
        }
      });

    if (!agent) {
      return res.status(404).json({
        message:
          "Agent actif introuvable."
      });
    }

    if (
      !intervention.bac ||
      intervention.bac.id_zone !==
        agent.id_zone
    ) {
      return res.status(403).json({
        message:
          "L'agent et le bac doivent appartenir à la même zone."
      });
    }

    const missionExistante =
      await Mission.findOne({
        where: {
          id_intervention
        }
      });

    if (missionExistante) {
      return res.status(409).json({
        message:
          "Une mission existe déjà pour cette intervention."
      });
    }

    const totalActives =
      await Mission.count({
        where: {
          id_agent,
          statut: missionsActives
        }
      });

    if (
      totalActives >=
      MAX_MISSIONS_ACTIVES
    ) {
      return res.status(409).json({
        message:
          `L'agent a atteint la limite de ${MAX_MISSIONS_ACTIVES} missions actives.`
      });
    }

    const mission =
      await Mission.create({
        dateAffectation:
          new Date(),
        statut: "AFFECTEE",
        id_intervention,
        id_agent
      });

    await intervention.update({
      statut: "PLANIFIEE"
    });

    await notifierAffectationMission({
      mission,
      intervention,
      agent,
      bac: intervention.bac,
      superviseur: req.user,
    });

    const missionComplete =
      await obtenirMissionAgent(
        mission.idMission,
        id_agent
      );

    return res.status(201).json({
      message:
        "Mission créée et affectée avec succès.",
      mission: missionComplete
    });
  } catch (error) {
    console.error(
      "Erreur création mission :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la création de la mission."
    });
  }
};

const listerMissions = async (
  req,
  res
) => {
  try {
    const where = {};

    if (
      req.user.role ===
      "AGENT_COLLECTE"
    ) {
      where.id_agent =
        req.user.idUtilisateur;
    }

    if (
      req.user.role ===
      "SUPERVISEUR"
    ) {
      const interventions =
        await Intervention.findAll({
          where: {
            id_superviseur:
              req.user.idUtilisateur
          },
          attributes: [
            "idIntervention"
          ]
        });

      where.id_intervention =
        interventions.map(
          (intervention) =>
            intervention.idIntervention
        );
    }

    const missions =
      await Mission.findAll({
        where,
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
                    as: "zone"
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
      "Erreur liste missions :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la récupération des missions."
    });
  }
};

const consulterMission = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const mission =
      await Mission.findByPk(id, {
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
                    as: "zone"
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
          "Mission introuvable."
      });
    }

    if (
      req.user.role ===
        "AGENT_COLLECTE" &&
      mission.id_agent !==
        req.user.idUtilisateur
    ) {
      return res.status(403).json({
        message:
          "Cette mission ne vous est pas affectée."
      });
    }

    if (
      req.user.role ===
        "SUPERVISEUR" &&
      (
        !mission.intervention ||
        mission.intervention.id_superviseur !==
          req.user.idUtilisateur
      )
    ) {
      return res.status(403).json({
        message:
          "Cette mission ne relève pas de votre supervision."
      });
    }

    return res.status(200).json({
      mission
    });
  } catch (error) {
    console.error(
      "Erreur consultation mission :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la consultation de la mission."
    });
  }
};

const demarrerMission = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const mission =
      await obtenirMissionAgent(
        id,
        req.user.idUtilisateur
      );

    if (!mission) {
      return res.status(404).json({
        message:
          "Mission introuvable ou non affectée à cet agent."
      });
    }

    if (
      mission.statut !==
      "AFFECTEE"
    ) {
      return res.status(409).json({
        message:
          "Seule une mission affectée peut être démarrée."
      });
    }

    await mission.update({
      statut: "EN_COURS",
      dateDebut: new Date()
    });

    if (mission.intervention) {
      await mission.intervention.update({
        statut: "EN_COURS"
      });
    }

    await notifierSuperviseur({
      idSuperviseur: mission.intervention?.id_superviseur,
      idBac: mission.intervention?.id_bac,
      contenu:
        `Mission démarrée : ${await nomAgent(mission.id_agent)} est en route vers le bac ` +
        `${mission.intervention?.bac?.reference ?? ""}.`,
    }).catch((erreur) =>
      console.error("Notification de démarrage non créée :", erreur.message)
    );

    return res.status(200).json({
      message:
        "Mission démarrée avec succès.",
      mission
    });
  } catch (error) {
    console.error(
      "Erreur démarrage mission :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors du démarrage de la mission."
    });
  }
};

const suspendreMission = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const mission =
      await obtenirMissionAgent(
        id,
        req.user.idUtilisateur
      );

    if (!mission) {
      return res.status(404).json({
        message:
          "Mission introuvable ou non affectée à cet agent."
      });
    }

    if (
      mission.statut !==
      "EN_COURS"
    ) {
      return res.status(409).json({
        message:
          "Seule une mission en cours peut être suspendue."
      });
    }

    const observation =
      req.body?.observation;

    await mission.update({
      statut: "SUSPENDUE",
      observation:
        observation ||
        mission.observation ||
        null
    });

    return res.status(200).json({
      message:
        "Mission suspendue avec succès.",
      mission
    });
  } catch (error) {
    console.error(
      "Erreur suspension mission :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la suspension de la mission."
    });
  }
};

const reprendreMission = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const mission =
      await obtenirMissionAgent(
        id,
        req.user.idUtilisateur
      );

    if (!mission) {
      return res.status(404).json({
        message:
          "Mission introuvable ou non affectée à cet agent."
      });
    }

    if (
      mission.statut !==
      "SUSPENDUE"
    ) {
      return res.status(409).json({
        message:
          "Seule une mission suspendue peut être reprise."
      });
    }

    const observation =
      req.body?.observation;

    await mission.update({
      statut: "EN_COURS",
      observation:
        observation ||
        mission.observation ||
        null
    });

    if (mission.intervention) {
      await mission.intervention.update({
        statut: "EN_COURS"
      });
    }

    return res.status(200).json({
      message:
        "Mission reprise avec succès.",
      mission
    });
  } catch (error) {
    console.error(
      "Erreur reprise mission :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la reprise de la mission."
    });
  }
};

const terminerMission = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const mission =
      await obtenirMissionAgent(
        id,
        req.user.idUtilisateur
      );

    if (!mission) {
      return res.status(404).json({
        message:
          "Mission introuvable ou non affectée à cet agent."
      });
    }

    if (
      ![
        "EN_COURS",
        "SUSPENDUE"
      ].includes(mission.statut)
    ) {
      return res.status(409).json({
        message:
          "Cette mission ne peut pas être terminée dans son état actuel."
      });
    }

    // Règle métier : tant que le capteur ne signale pas le bac à l'état normal,
    // la collecte n'est pas considérée comme faite.
    const bacMission = mission.intervention?.bac;

    if (
      bacMission &&
      calculerEtatBac(bacMission.niveau_remplissage) !== "NORMAL"
    ) {
      return res.status(409).json({
        code: "BAC_NON_VIDE",
        message:
          `Le bac ${bacMission.reference} est encore rempli à ` +
          `${Math.round(Number(bacMission.niveau_remplissage))} %. ` +
          "La mission ne peut être terminée que lorsque le capteur indique " +
          `que le bac est revenu à l'état normal (${SEUIL_ALERTE} % ou moins).`,
        bac: {
          id_bac: bacMission.id_bac,
          reference: bacMission.reference,
          niveau_remplissage: bacMission.niveau_remplissage,
          etat: bacMission.etat,
        },
      });
    }

    const observation =
      req.body?.observation;

    await mission.update({
      statut: "TERMINEE",
      dateFin: new Date(),
      observation:
        observation ||
        mission.observation ||
        null
    });

    if (mission.intervention) {
      await mission.intervention.update({
        statut: "TERMINEE"
      });
    }

    await notifierSuperviseur({
      idSuperviseur: mission.intervention?.id_superviseur,
      idBac: mission.intervention?.id_bac,
      contenu:
        `Mission terminée : ${await nomAgent(mission.id_agent)} a vidé le bac ` +
        `${bacMission?.reference ?? ""} (${Math.round(Number(bacMission?.niveau_remplissage) || 0)} %).`,
    }).catch((erreur) =>
      console.error("Notification de fin de mission non créée :", erreur.message)
    );

    return res.status(200).json({
      message:
        "Mission terminée avec succès.",
      mission
    });
  } catch (error) {
    console.error(
      "Erreur terminaison mission :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la terminaison de la mission."
    });
  }
};

const annulerMission = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const mission =
      await Mission.findByPk(id, {
        include: [
          {
            model: Intervention,
            as: "intervention"
          }
        ]
      });

    if (!mission) {
      return res.status(404).json({
        message:
          "Mission introuvable."
      });
    }

    const autorise =
      req.user.role ===
        "ADMINISTRATEUR" ||
      mission.id_agent ===
        req.user.idUtilisateur ||
      (
        req.user.role ===
          "SUPERVISEUR" &&
        mission.intervention &&
        mission.intervention
          .id_superviseur ===
          req.user.idUtilisateur
      );

    if (!autorise) {
      return res.status(403).json({
        message:
          "Vous n'êtes pas autorisé à annuler cette mission."
      });
    }

    if (
      mission.statut ===
      "TERMINEE"
    ) {
      return res.status(409).json({
        message:
          "Une mission terminée ne peut pas être annulée."
      });
    }

    await mission.update({
      statut: "ANNULEE"
    });

    if (mission.intervention) {
      await mission.intervention.update({
        statut: "ANNULEE"
      });
    }

    return res.status(200).json({
      message:
        "Mission annulée avec succès.",
      mission
    });
  } catch (error) {
    console.error(
      "Erreur annulation mission :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de l'annulation de la mission."
    });
  }
};

module.exports = {
  creerMission,
  listerMissions,
  consulterMission,
  demarrerMission,
  suspendreMission,
  reprendreMission,
  terminerMission,
  annulerMission
};