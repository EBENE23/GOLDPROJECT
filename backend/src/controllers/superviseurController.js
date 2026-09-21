const { Op } = require("sequelize");
const { SEUIL_ALERTE } = require("../services/mesureService");
const {
  Bac,
  Mesure,
  Zone,
  Intervention,
  Mission,
  Utilisateur,
} = require("../models");

const verifierSuperviseur = (req, res) => {
  if (!req.user || req.user.role !== "SUPERVISEUR") {
    res.status(403).json({
      message: "Accès réservé au superviseur.",
    });
    return false;
  }

  return true;
};

const obtenirZoneSuperviseur = async (idUtilisateur) => {
  return Zone.findOne({
    where: {
      id_superviseur: idUtilisateur,
    },
  });
};

// Agents de collecte affectés à la zone du superviseur, avec leur charge de travail.
const listerAgentsZone = async (req, res) => {
  try {
    if (!verifierSuperviseur(req, res)) {
      return;
    }

    const zone = await obtenirZoneSuperviseur(req.user.idUtilisateur);

    if (!zone) {
      return res.status(404).json({
        message: "Aucune zone n'est affectée à ce superviseur.",
      });
    }

    const agents = await Utilisateur.findAll({
      where: { role: "AGENT_COLLECTE", id_zone: zone.idZone },
      attributes: { exclude: ["motDePasse"] },
      order: [["nom", "ASC"], ["prenom", "ASC"]],
    });

    const missionsActives = agents.length
      ? await Mission.findAll({
          where: {
            id_agent: { [Op.in]: agents.map((agent) => agent.idUtilisateur) },
            statut: { [Op.in]: ["AFFECTEE", "EN_COURS", "SUSPENDUE"] },
          },
          include: [
            {
              model: Intervention,
              as: "intervention",
              required: true,
              include: [{ model: Bac, as: "bac", attributes: ["id_bac", "reference"] }],
            },
          ],
          order: [["dateAffectation", "DESC"]],
        })
      : [];

    const limite = Number(process.env.MAX_MISSIONS_ACTIVES || 5);

    const resultat = agents.map((agent) => {
      const missions = missionsActives.filter(
        (mission) => mission.id_agent === agent.idUtilisateur
      );

      return {
        ...agent.toJSON(),
        missionsActives: missions.length,
        limiteMissions: limite,
        disponible: agent.statutCompte === "ACTIF" && missions.length < limite,
        missions: missions.map((mission) => ({
          idMission: mission.idMission,
          statut: mission.statut,
          priorite: mission.intervention.priorite,
          bac: mission.intervention.bac,
        })),
      };
    });

    return res.status(200).json({
      zone,
      totalAgents: resultat.length,
      agents: resultat,
    });
  } catch (error) {
    console.error("Erreur liste agents de la zone :", error);

    return res.status(500).json({
      message: "Erreur lors de la récupération des agents de la zone.",
    });
  }
};

// Interventions actives de la zone, avec bac, agent et dernière position de l'agent.
const suivreInterventions = async (req, res) => {
  try {
    if (!verifierSuperviseur(req, res)) {
      return;
    }

    const zone = await obtenirZoneSuperviseur(req.user.idUtilisateur);

    if (!zone) {
      return res.status(404).json({
        message: "Aucune zone n'est affectée à ce superviseur.",
      });
    }

    const interventions = await Intervention.findAll({
      where: {
        id_superviseur: req.user.idUtilisateur,
        statut: { [Op.in]: ["EN_ATTENTE", "PLANIFIEE", "EN_COURS"] },
      },
      include: [
        {
          model: Bac,
          as: "bac",
          attributes: ["id_bac", "reference", "latitude", "longitude", "niveau_remplissage", "etat"],
        },
        {
          model: Mission,
          as: "mission",
          required: false,
          include: [
            {
              model: Utilisateur,
              as: "agent",
              attributes: ["idUtilisateur", "nom", "prenom", "telephone"],
            },
          ],
        },
      ],
      order: [["dateCreation", "DESC"]],
    });

    return res.status(200).json({
      zone,
      total: interventions.length,
      interventions,
    });
  } catch (error) {
    console.error("Erreur suivi interventions :", error);

    return res.status(500).json({
      message: "Erreur lors du suivi des interventions.",
    });
  }
};

const consulterTableauSuperviseur = async (req, res) => {
  try {
    if (!verifierSuperviseur(req, res)) {
      return;
    }

    const zone = await obtenirZoneSuperviseur(
      req.user.idUtilisateur
    );

    if (!zone) {
      return res.status(404).json({
        message: "Aucune zone n'est affectée à ce superviseur.",
      });
    }

    const bacs = await Bac.findAll({
      where: {
        id_zone: zone.idZone,
      },
      order: [
        ["niveau_remplissage", "DESC"],
      ],
    });

    const interventions = await Intervention.findAll({
      where: {
        id_superviseur: req.user.idUtilisateur,
      },
      include: [
        {
          model: Bac,
          as: "bac",
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
      order: [
        ["dateCreation", "DESC"],
      ],
    });

    const totalBacs = bacs.length;

    const bacsNormaux = bacs.filter(
      (bac) => bac.etat === "NORMAL"
    ).length;

    const bacsAlerte = bacs.filter(
      (bac) => bac.etat === "ALERTE"
    ).length;

    const bacsPleins = bacs.filter(
      (bac) => bac.etat === "PLEIN"
    ).length;

    const interventionsEnAttente =
      interventions.filter(
        (intervention) =>
          intervention.statut === "EN_ATTENTE"
      ).length;

    const interventionsEnCours =
      interventions.filter(
        (intervention) =>
          intervention.statut === "EN_COURS"
      ).length;

    const interventionsTerminees =
      interventions.filter(
        (intervention) =>
          intervention.statut === "TERMINEE"
      ).length;

    const pourcentageMoyen =
      totalBacs > 0
        ? Number(
            (
              bacs.reduce(
                (total, bac) =>
                  total +
                  Number(
                    bac.niveau_remplissage || 0
                  ),
                0
              ) / totalBacs
            ).toFixed(2)
          )
        : 0;

    return res.status(200).json({
      zone,
      statistiques: {
        totalBacs,
        bacsNormaux,
        bacsAlerte,
        bacsPleins,
        pourcentageMoyen,
        interventionsEnAttente,
        interventionsEnCours,
        interventionsTerminees,
        totalInterventions: interventions.length,
      },
      bacs,
      interventions,
    });
  } catch (error) {
    console.error(
      "Erreur tableau superviseur :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la récupération du tableau de bord.",
    });
  }
};

const listerBacsSuperviseur = async (req, res) => {
  try {
    if (!verifierSuperviseur(req, res)) {
      return;
    }

    const zone = await obtenirZoneSuperviseur(
      req.user.idUtilisateur
    );

    if (!zone) {
      return res.status(404).json({
        message: "Aucune zone n'est affectée à ce superviseur.",
      });
    }

    const bacs = await Bac.findAll({
      where: {
        id_zone: zone.idZone,
      },
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
      order: [
        ["niveau_remplissage", "DESC"],
      ],
    });

    return res.status(200).json({
      zone,
      total: bacs.length,
      bacs,
    });
  } catch (error) {
    console.error(
      "Erreur liste bacs superviseur :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la récupération des bacs.",
    });
  }
};

const consulterBacSuperviseur = async (req, res) => {
  try {
    if (!verifierSuperviseur(req, res)) {
      return;
    }

    const { id } = req.params;

    const zone = await obtenirZoneSuperviseur(
      req.user.idUtilisateur
    );

    if (!zone) {
      return res.status(404).json({
        message: "Aucune zone n'est affectée à ce superviseur.",
      });
    }

    const bac = await Bac.findOne({
      where: {
        id_bac: id,
        id_zone: zone.idZone,
      },
      include: [
        {
          model: Zone,
          as: "zone",
        },
        {
          model: Mesure,
          as: "mesures",
          separate: true,
          limit: 20,
          order: [
            ["dateMesure", "DESC"],
          ],
        },
        {
          model: Intervention,
          as: "interventions",
          separate: true,
          order: [
            ["dateCreation", "DESC"],
          ],
          include: [
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
    });

    if (!bac) {
      return res.status(404).json({
        message: "Bac introuvable dans votre zone.",
      });
    }

    return res.status(200).json(bac);
  } catch (error) {
    console.error(
      "Erreur consultation bac superviseur :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la consultation du bac.",
    });
  }
};

const consulterAlertesSuperviseur = async (req, res) => {
  try {
    if (!verifierSuperviseur(req, res)) {
      return;
    }

    const zone = await obtenirZoneSuperviseur(
      req.user.idUtilisateur
    );

    if (!zone) {
      return res.status(404).json({
        message: "Aucune zone n'est affectée à ce superviseur.",
      });
    }

    const bacs = await Bac.findAll({
      where: {
        id_zone: zone.idZone,
        etat: {
          [Op.in]: [
            "ALERTE",
            "PLEIN",
          ],
        },
      },
      include: [
        {
          model: Zone,
          as: "zone",
        },
      ],
      order: [
        ["niveau_remplissage", "DESC"],
      ],
    });

    return res.status(200).json({
      total: bacs.length,
      alertes: bacs,
    });
  } catch (error) {
    console.error(
      "Erreur alertes superviseur :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la récupération des alertes.",
    });
  }
};

const consulterLocalisationBacs = async (req, res) => {
  try {
    if (!verifierSuperviseur(req, res)) {
      return;
    }

    const zone = await obtenirZoneSuperviseur(
      req.user.idUtilisateur
    );

    if (!zone) {
      return res.status(404).json({
        message: "Aucune zone n'est affectée à ce superviseur.",
      });
    }

    const bacs = await Bac.findAll({
      where: {
        id_zone: zone.idZone,
      },
      attributes: [
        "id_bac",
        "reference",
        "latitude",
        "longitude",
        "niveau_remplissage",
        "etat",
        "id_zone",
      ],
      order: [
        ["niveau_remplissage", "DESC"],
      ],
    });

    const localisation = bacs.map((bac) => ({
      id_bac: bac.id_bac,
      reference: bac.reference,
      latitude: bac.latitude,
      longitude: bac.longitude,
      niveau_remplissage:
        bac.niveau_remplissage,
      etat: bac.etat,
      seuil_alerte: SEUIL_ALERTE,
      id_zone: bac.id_zone,
    }));

    return res.status(200).json({
      zone,
      total: localisation.length,
      bacs: localisation,
    });
  } catch (error) {
    console.error(
      "Erreur localisation bacs :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la récupération des localisations.",
    });
  }
};

const consulterStatistiquesSuperviseur = async (
  req,
  res
) => {
  try {
    if (!verifierSuperviseur(req, res)) {
      return;
    }

    const zone = await obtenirZoneSuperviseur(
      req.user.idUtilisateur
    );

    if (!zone) {
      return res.status(404).json({
        message: "Aucune zone n'est affectée à ce superviseur.",
      });
    }

    // Période facultative (AAAA-MM-JJ, bornes incluses) appliquée aux mesures et aux interventions.
    const { dateDebut, dateFin } = req.query;

    const bornesDates = (colonne) => {
      if (!dateDebut && !dateFin) {
        return {};
      }

      const bornes = {};

      if (dateDebut) {
        bornes[Op.gte] = new Date(`${dateDebut}T00:00:00`);
      }

      if (dateFin) {
        bornes[Op.lte] = new Date(`${dateFin}T23:59:59.999`);
      }

      return { [colonne]: bornes };
    };

    const bacs = await Bac.findAll({
      where: {
        id_zone: zone.idZone,
      },
    });

    const idsBacs = bacs.map(
      (bac) => bac.id_bac
    );

    let mesures = [];

    if (idsBacs.length > 0) {
      mesures = await Mesure.findAll({
        where: {
          id_bac: {
            [Op.in]: idsBacs,
          },
          ...(bornesDates("dateMesure")),
        },
        order: [
          ["dateMesure", "ASC"],
        ],
      });
    }

    const interventions =
      await Intervention.findAll({
        where: {
          id_superviseur:
            req.user.idUtilisateur,
          ...(bornesDates("dateCreation")),
        },
      });

    const statistiquesParBac = bacs.map(
      (bac) => {
        const mesuresBac = mesures.filter(
          (mesure) =>
            mesure.id_bac === bac.id_bac
        );

        const moyenne =
          mesuresBac.length > 0
            ? Number(
                (
                  mesuresBac.reduce(
                    (total, mesure) =>
                      total +
                      Number(
                        mesure.pourcentage || 0
                      ),
                    0
                  ) /
                  mesuresBac.length
                ).toFixed(2)
              )
            : 0;

        return {
          id_bac: bac.id_bac,
          reference: bac.reference,
          etat: bac.etat,
          niveau_actuel:
            Number(
              bac.niveau_remplissage || 0
            ),
          moyenne_remplissage:
            moyenne,
          nombre_mesures:
            mesuresBac.length,
        };
      }
    );

    const repartitionEtat = {
      NORMAL: bacs.filter(
        (bac) => bac.etat === "NORMAL"
      ).length,
      ALERTE: bacs.filter(
        (bac) => bac.etat === "ALERTE"
      ).length,
      PLEIN: bacs.filter(
        (bac) => bac.etat === "PLEIN"
      ).length,
    };

    const repartitionInterventions = {
      EN_ATTENTE:
        interventions.filter(
          (intervention) =>
            intervention.statut === "EN_ATTENTE"
        ).length,
      PLANIFIEE:
        interventions.filter(
          (intervention) =>
            intervention.statut === "PLANIFIEE"
        ).length,
      EN_COURS:
        interventions.filter(
          (intervention) =>
            intervention.statut === "EN_COURS"
        ).length,
      TERMINEE:
        interventions.filter(
          (intervention) =>
            intervention.statut === "TERMINEE"
        ).length,
      ANNULEE:
        interventions.filter(
          (intervention) =>
            intervention.statut === "ANNULEE"
        ).length,
    };

    return res.status(200).json({
      zone,
      statistiques: {
        nombreBacs: bacs.length,
        nombreMesures: mesures.length,
        nombreInterventions:
          interventions.length,
        repartitionEtat,
        repartitionInterventions,
        parBac: statistiquesParBac,
      },
    });
  } catch (error) {
    console.error(
      "Erreur statistiques superviseur :",
      error
    );

    return res.status(500).json({
      message:
        "Erreur lors de la récupération des statistiques.",
    });
  }
};

module.exports = {
  suivreInterventions,
  listerAgentsZone,
  consulterTableauSuperviseur,
  listerBacsSuperviseur,
  consulterBacSuperviseur,
  consulterAlertesSuperviseur,
  consulterLocalisationBacs,
  consulterStatistiquesSuperviseur,
};