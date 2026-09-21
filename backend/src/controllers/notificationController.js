const { Op } = require("sequelize");
const { Notification, Bac, Mission, Intervention } = require("../models");

const listerNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: {
        idUtilisateur: req.user.idUtilisateur,
      },
      include: [
        {
          model: Bac,
          as: "bac",
          required: false,
          attributes: [
            "id_bac",
            "reference",
            "latitude",
            "longitude",
            "niveau_remplissage",
            "etat",
          ],
        },
      ],
      order: [["dateNotification", "DESC"]],
      limit: 50,
    });

    // Pour un agent, rattache à chaque notification la mission correspondante
    // afin de pouvoir l'ouvrir directement (mission non terminée en priorité).
    const missionParBac = new Map();

    if (req.user.role === "AGENT_COLLECTE") {
      const idsBacs = [
        ...new Set(
          notifications.map((n) => n.id_bac).filter(Boolean)
        ),
      ];

      if (idsBacs.length > 0) {
        const missions = await Mission.findAll({
          where: { id_agent: req.user.idUtilisateur },
          attributes: ["idMission", "statut", "dateAffectation"],
          include: [
            {
              model: Intervention,
              as: "intervention",
              required: true,
              attributes: ["id_bac"],
              where: { id_bac: { [Op.in]: idsBacs } },
            },
          ],
          order: [["dateAffectation", "DESC"]],
        });

        for (const mission of missions) {
          const idBac = mission.intervention.id_bac;
          const actuelle = missionParBac.get(idBac);

          if (!actuelle || (actuelle.statut === "TERMINEE" && mission.statut !== "TERMINEE")) {
            missionParBac.set(idBac, {
              idMission: mission.idMission,
              statut: mission.statut,
            });
          }
        }
      }
    }

    const resultat = notifications.map((notification) => ({
      ...notification.toJSON(),
      mission: missionParBac.get(notification.id_bac) || null,
    }));

    const nonLues = resultat.filter(
      (notification) => !notification.lu
    ).length;

    return res.status(200).json({
      total: resultat.length,
      nonLues,
      notifications: resultat,
    });
  } catch (error) {
    console.error(
      "Erreur liste notifications :",
      error
    );

    return res.status(500).json({
      message:
        "Impossible de charger les notifications.",
    });
  }
};

const marquerNotificationLue = async (
  req,
  res
) => {
  try {
    const notification =
      await Notification.findOne({
        where: {
          idNotification: req.params.id,
          idUtilisateur:
            req.user.idUtilisateur,
        },
      });

    if (!notification) {
      return res.status(404).json({
        message:
          "Notification introuvable.",
      });
    }

    await notification.update({
      lu: true,
    });

    return res.status(200).json({
      message:
        "Notification marquée comme lue.",
      notification,
    });
  } catch (error) {
    console.error(
      "Erreur lecture notification :",
      error
    );

    return res.status(500).json({
      message:
        "Impossible de modifier la notification.",
    });
  }
};

const marquerToutesNotificationsLues =
  async (req, res) => {
    try {
      await Notification.update(
        {
          lu: true,
        },
        {
          where: {
            idUtilisateur:
              req.user.idUtilisateur,
            lu: false,
          },
        }
      );

      return res.status(200).json({
        message:
          "Toutes les notifications ont été marquées comme lues.",
      });
    } catch (error) {
      console.error(
        "Erreur lecture notifications :",
        error
      );

      return res.status(500).json({
        message:
          "Impossible de modifier les notifications.",
      });
    }
  };

module.exports = {
  listerNotifications,
  marquerNotificationLue,
  marquerToutesNotificationsLues,
};