const { Mesure, Bac, Zone, Utilisateur } = require("../models");
const { Op } = require("sequelize");

const listerMesures = async (req, res) => {
  try {
    const {
      id_bac,
      limite,
      dateDebut,
      dateFin
    } = req.query;

    const where = {};

    if (id_bac) {
      where.id_bac = id_bac;
    }

    if (dateDebut || dateFin) {
      where.dateMesure = {};

      if (dateDebut) {
        where.dateMesure[Op.gte] =
          new Date(dateDebut);
      }

      if (dateFin) {
        where.dateMesure[Op.lte] =
          new Date(dateFin);
      }
    }

    const utilisateur =
      req.user;

    // Restreint les mesures aux bacs de la zone du superviseur / de l'agent.
    if (
      utilisateur.role ===
        "SUPERVISEUR" ||
      utilisateur.role ===
        "AGENT_COLLECTE"
    ) {
      let idZone = null;

      if (utilisateur.role === "SUPERVISEUR") {
        const zone =
          await Zone.findOne({
            where: {
              id_superviseur:
                utilisateur.idUtilisateur
            }
          });

        if (!zone) {
          return res.status(404).json({
            message:
              "Aucune zone n'est affectée à ce superviseur."
          });
        }

        idZone = zone.idZone;
      } else {
        const agent =
          await Utilisateur.findByPk(
            utilisateur.idUtilisateur,
            { attributes: ["id_zone"] }
          );

        idZone = agent?.id_zone ?? null;
      }

      const bacs = idZone
        ? await Bac.findAll({
            where: { id_zone: idZone },
            attributes: ["id_bac"]
          })
        : [];

      const idsBacs =
        bacs.map(
          (bac) => bac.id_bac
        );

      if (id_bac) {
        // Un bac hors périmètre donne simplement une liste vide.
        where.id_bac = idsBacs.includes(Number(id_bac))
          ? Number(id_bac)
          : { [Op.in]: [] };
      } else {
        where.id_bac = {
          [Op.in]: idsBacs
        };
      }
    }

    const nombre =
      Number(limite) > 0
        ? Number(limite)
        : 100;

    const mesures =
      await Mesure.findAll({
        where,
        include: [
          {
            model: Bac,
            as: "bac",
            attributes: [
              "id_bac",
              "reference",
              "capacite",
              "hauteur",
              "latitude",
              "longitude",
              "etat"
            ],
            include: [
              {
                model: Zone,
                as: "zone",
                attributes: [
                  "idZone",
                  "nomZone"
                ]
              }
            ]
          }
        ],
        order: [
          ["dateMesure", "DESC"]
        ],
        limit: nombre
      });

    return res.status(200).json({
      totalMesures:
        mesures.length,
      mesures
    });
  } catch (error) {
    console.error(
      "Erreur liste mesures :",
      error
    );

    return res.status(500).json({
      message:
        "Impossible de récupérer les mesures."
    });
  }
};

const consulterMesure = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const mesure =
      await Mesure.findByPk(id, {
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
          }
        ]
      });

    if (!mesure) {
      return res.status(404).json({
        message:
          "Mesure introuvable."
      });
    }

    if (
      req.user.role ===
      "SUPERVISEUR"
    ) {
      const zone =
        await Zone.findOne({
          where: {
            id_superviseur:
              req.user.idUtilisateur
          }
        });

      if (
        !zone ||
        mesure.bac?.id_zone !==
          zone.idZone
      ) {
        return res.status(403).json({
          message:
            "Cette mesure ne relève pas de votre zone."
        });
      }
    }

    if (
      req.user.role ===
      "AGENT_COLLECTE"
    ) {
      if (
        mesure.bac?.id_zone !==
        req.user.id_zone
      ) {
        return res.status(403).json({
          message:
            "Cette mesure ne relève pas de votre zone."
        });
      }
    }

    return res.status(200).json({
      mesure
    });
  } catch (error) {
    console.error(
      "Erreur consultation mesure :",
      error
    );

    return res.status(500).json({
      message:
        "Impossible de consulter la mesure."
    });
  }
};

const obtenirHistoriqueBac =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const bac =
        await Bac.findByPk(id, {
          include: [
            {
              model: Zone,
              as: "zone"
            }
          ]
        });

      if (!bac) {
        return res.status(404).json({
          message:
            "Bac introuvable."
        });
      }

      if (
        req.user.role ===
        "SUPERVISEUR"
      ) {
        const zone =
          await Zone.findOne({
            where: {
              id_superviseur:
                req.user.idUtilisateur
            }
          });

        if (
          !zone ||
          bac.id_zone !==
            zone.idZone
        ) {
          return res.status(403).json({
            message:
              "Ce bac ne relève pas de votre zone."
          });
        }
      }

      if (
        req.user.role ===
        "AGENT_COLLECTE" &&
        bac.id_zone !==
          req.user.id_zone
      ) {
        return res.status(403).json({
          message:
            "Ce bac ne relève pas de votre zone."
        });
      }

      // Filtrage par période (AAAA-MM-JJ, bornes incluses) et nombre maximal de mesures.
      const { dateDebut, dateFin, limite } = req.query;
      const filtre = { id_bac: bac.id_bac };

      if (dateDebut || dateFin) {
        filtre.dateMesure = {};

        if (dateDebut) {
          filtre.dateMesure[Op.gte] = new Date(`${dateDebut}T00:00:00`);
        }

        if (dateFin) {
          filtre.dateMesure[Op.lte] = new Date(`${dateFin}T23:59:59.999`);
        }
      }

      const nombreMax = Math.min(
        Math.max(Number(limite) || 200, 1),
        1000
      );

      const mesures =
        await Mesure.findAll({
          where: filtre,
          order: [
            ["dateMesure", "DESC"]
          ],
          limit: nombreMax
        });

      return res.status(200).json({
        bac,
        totalMesures:
          mesures.length,
        mesures
      });
    } catch (error) {
      console.error(
        "Erreur historique bac :",
        error
      );

      return res.status(500).json({
        message:
          "Impossible de récupérer l'historique du bac."
      });
    }
  };

module.exports = {
  listerMesures,
  consulterMesure,
  obtenirHistoriqueBac
};