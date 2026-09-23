const { Op } = require("sequelize");

const { Utilisateur, Zone } = require("../models");

// Règles d'organisation d'une zone (diagramme de classes) :
//  - une zone est supervisée par un seul superviseur, obligatoirement ;
//  - une zone compte au plus MAX_AGENTS_PAR_ZONE agents de collecte.
const MAX_AGENTS_PAR_ZONE = Number(process.env.MAX_AGENTS_PAR_ZONE || 5);

const compterAgents = (idZone, { exclure, transaction } = {}) => {
  const where = { role: "AGENT_COLLECTE", id_zone: idZone };

  if (exclure) {
    where.idUtilisateur = { [Op.ne]: exclure };
  }

  return Utilisateur.count({ where, transaction });
};

// Le superviseur actuel de la zone (ou null si le poste est vacant).
const trouverSuperviseur = async (zone, { transaction } = {}) => {
  if (zone.id_superviseur) {
    const superviseur = await Utilisateur.findByPk(zone.id_superviseur, { transaction });
    if (superviseur) return superviseur;
  }

  return Utilisateur.findOne({
    where: { role: "SUPERVISEUR", id_zone: zone.idZone },
    transaction,
  });
};

// Vérifie qu'une zone peut accueillir un nouveau membre du rôle donné.
// Retourne un message d'erreur, ou null si c'est possible.
const verifierPlaceDansZone = async (zone, role, { exclure, transaction } = {}) => {
  if (role === "SUPERVISEUR") {
    const existant = await trouverSuperviseur(zone, { transaction });
    if (existant && existant.idUtilisateur !== exclure) {
      return `La zone « ${zone.nomZone} » a déjà un superviseur (${existant.prenom} ${existant.nom}). Une zone n'a qu'un seul superviseur.`;
    }
    return null;
  }

  const agents = await compterAgents(zone.idZone, { exclure, transaction });
  if (agents >= MAX_AGENTS_PAR_ZONE) {
    return `La zone « ${zone.nomZone} » est complète : ${MAX_AGENTS_PAR_ZONE} agents de collecte au maximum.`;
  }

  return null;
};

// Occupation de chaque zone, pour aider l'administrateur à choisir.
const occupationDesZones = async () => {
  const zones = await Zone.findAll({ order: [["idZone", "ASC"]] });
  const utilisateurs = await Utilisateur.findAll({
    where: { role: ["SUPERVISEUR", "AGENT_COLLECTE"] },
    attributes: ["idUtilisateur", "nom", "prenom", "role", "id_zone", "photoProfil"],
  });

  return zones.map((zone) => {
    // Le superviseur d'une zone est désigné par zone.id_superviseur (source de référence).
    const superviseur =
      utilisateurs.find((u) => u.idUtilisateur === zone.id_superviseur) ||
      utilisateurs.find((u) => u.role === "SUPERVISEUR" && u.id_zone === zone.idZone) ||
      null;
    const agents = utilisateurs.filter((u) => u.role === "AGENT_COLLECTE" && u.id_zone === zone.idZone);

    return {
      idZone: zone.idZone,
      nomZone: zone.nomZone,
      superviseur: superviseur
        ? {
            idUtilisateur: superviseur.idUtilisateur,
            nom: superviseur.nom,
            prenom: superviseur.prenom,
            photoProfil: superviseur.photoProfil,
          }
        : null,
      nbAgents: agents.length,
      maxAgents: MAX_AGENTS_PAR_ZONE,
      superviseurLibre: !superviseur,
      placesAgents: Math.max(0, MAX_AGENTS_PAR_ZONE - agents.length),
    };
  });
};

module.exports = {
  MAX_AGENTS_PAR_ZONE,
  verifierPlaceDansZone,
  occupationDesZones,
};
