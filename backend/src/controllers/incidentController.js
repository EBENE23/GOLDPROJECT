const { diffuserAUtilisateur } = require("../services/evenementsService");
const { Incident, Mission, Intervention, Bac, Notification, Utilisateur } = require("../models");

const listerIncidents = async (req, res) => {
  try {
    const isAgent = req.user.role === "AGENT_COLLECTE";
    const isSupervisor = req.user.role === "SUPERVISEUR";
    const incidents = await Incident.findAll({
      where: isAgent ? { id_agent: req.user.idUtilisateur } : {},
      include: isSupervisor ? [{
        model: Mission,
        as: "mission",
        required: true,
        include: [{
          model: Intervention,
          as: "intervention",
          required: true,
          where: { id_superviseur: req.user.idUtilisateur },
        }],
      }] : [],
      order: [["dateCreation", "DESC"]],
    });
    return res.status(200).json(incidents);
  } catch (error) {
    console.error("Erreur liste incidents :", error);
    return res.status(500).json({ message: "Impossible de charger les signalements." });
  }
};

const creerIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, latitude, longitude } = req.body || {};
    if (!description || !String(description).trim()) {
      return res.status(400).json({ message: "La description du problème est obligatoire." });
    }
    const mission = await Mission.findOne({
      where: { idMission: id, id_agent: req.user.idUtilisateur },
    });
    if (!mission) return res.status(404).json({ message: "Mission introuvable ou non affectée à votre compte." });
    const incident = await Incident.create({
      description: String(description).trim(),
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      id_mission: mission.idMission,
      id_agent: req.user.idUtilisateur,
    });

    // Prévient le superviseur de l'intervention concernée ; l'échec de la
    // notification ne doit pas annuler le signalement déjà enregistré.
    try {
      const intervention = await Intervention.findByPk(mission.id_intervention, {
        include: [{ model: Bac, as: "bac", attributes: ["reference"] }],
      });
      const agent = await Utilisateur.findByPk(req.user.idUtilisateur, { attributes: ["nom", "prenom"] });

      if (intervention?.id_superviseur) {
        await Notification.create({
          contenu:
            `Incident signalé par ${agent?.prenom ?? ""} ${agent?.nom ?? ""}`.trim() +
            ` sur la mission du bac ${intervention.bac?.reference ?? "inconnu"} : ` +
            String(description).trim().slice(0, 200),
          dateNotification: new Date(),
          lu: false,
          idUtilisateur: intervention.id_superviseur,
          id_bac: intervention.id_bac,
        });
        diffuserAUtilisateur(intervention.id_superviseur, "notification", {});
      }
    } catch (erreurNotification) {
      console.error("Notification d'incident non créée :", erreurNotification.message);
    }

    return res.status(201).json({ message: "Incident signalé au superviseur.", incident });
  } catch (error) {
    console.error("Erreur création incident :", error);
    return res.status(500).json({ message: "Impossible d'enregistrer le signalement." });
  }
};

module.exports = { listerIncidents, creerIncident };
