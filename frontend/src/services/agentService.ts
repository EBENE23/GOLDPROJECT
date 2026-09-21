import api from "./api";

export interface ZoneAgent {
  idZone: number;
  nomZone: string;
  description?: string | null;
}

export interface BacAgent {
  id_bac: number;
  reference: string;
  capacite?: number | string;
  hauteur?: number | string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  niveau_remplissage: number | string;
  seuil_alerte?: number | string;
  etat: "NORMAL" | "ALERTE" | "PLEIN";
  id_zone?: number;
  zone?: ZoneAgent;
}

export interface SuperviseurAgent {
  idUtilisateur: number;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string | null;
  role?: string;
}

export interface InterventionAgent {
  idIntervention: number;
  dateCreation?: string;
  datePrevue?: string | null;
  priorite:
    | "NORMALE"
    | "MOYENNE"
    | "HAUTE"
    | "CRITIQUE";
  motif?: string | null;
  statut:
    | "EN_ATTENTE"
    | "PLANIFIEE"
    | "EN_COURS"
    | "TERMINEE"
    | "ANNULEE";
  id_bac: number;
  id_superviseur: number;
  bac?: BacAgent;
  superviseur?: SuperviseurAgent;
}

export interface AgentMission {
  idMission: number;
  dateAffectation?: string;
  dateDebut?: string | null;
  dateFin?: string | null;
  statut:
    | "AFFECTEE"
    | "EN_COURS"
    | "SUSPENDUE"
    | "TERMINEE"
    | "ANNULEE";
  observation?: string | null;
  id_intervention: number;
  id_agent: number;
  intervention?: InterventionAgent;
}

export interface StatistiquesAgent {
  totalMissions: number;
  missionsAffectees: number;
  missionsEnCours: number;
  missionsSuspendues: number;
  missionsTerminees: number;
  missionsAnnulees: number;
}

export interface AgentDashboard {
  agent: {
    idUtilisateur: number;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string | null;
    role: string;
    statutCompte: string;
    id_zone?: number | null;
  };
  statistiques: StatistiquesAgent;
  missions: AgentMission[];
}

export interface LocalisationMission {
  mission: {
    idMission: number;
    statut: AgentMission["statut"];
    dateAffectation?: string;
    dateDebut?: string | null;
    dateFin?: string | null;
  };
  pointCollecte: {
    id_bac: number;
    reference: string;
    latitude?: number | string | null;
    longitude?: number | string | null;
    niveau_remplissage: number | string;
    etat: "NORMAL" | "ALERTE" | "PLEIN";
    zone?: ZoneAgent;
  };
}

export interface LocalisationBacsAgent {
  zone: ZoneAgent | null;
  total: number;
  bacs: BacAgent[];
  message?: string;
}

export const obtenirDashboardAgent =
  async (): Promise<AgentDashboard> => {
    const response =
      await api.get("/agent/dashboard");

    const data = response.data;

    return {
      agent: data.agent,
      statistiques: {
        totalMissions:
          data.statistiques?.total ?? 0,
        missionsAffectees:
          data.statistiques?.affectees ?? 0,
        missionsEnCours:
          data.statistiques?.enCours ?? 0,
        missionsSuspendues:
          data.statistiques?.suspendues ?? 0,
        missionsTerminees:
          data.statistiques?.terminees ?? 0,
        missionsAnnulees:
          data.statistiques?.annulees ?? 0,
      },
      missions: Array.isArray(
        data.missions
      )
        ? data.missions
        : [],
    };
  };

export const listerMissionsAgent =
  async (): Promise<{
    totalMissions: number;
    missions: AgentMission[];
  }> => {
    const response =
      await api.get("/agent/missions");

    return {
      totalMissions:
        response.data?.totalMissions ?? 0,
      missions: Array.isArray(
        response.data?.missions
      )
        ? response.data.missions
        : [],
    };
  };

export const consulterMissionAgent =
  async (
    id: number
  ): Promise<AgentMission> => {
    const response =
      await api.get(
        `/agent/missions/${id}`
      );

    return response.data.mission;
  };

export const obtenirLocalisationMission =
  async (
    id: number
  ): Promise<LocalisationMission> => {
    const response =
      await api.get(
        `/agent/missions/${id}/localisation`
      );

    return response.data;
  };

export const obtenirLocalisationBacsAgent =
  async (): Promise<LocalisationBacsAgent> => {
    const response =
      await api.get(
        "/agent/localisation"
      );

    return response.data;
  };

export const demarrerMission =
  async (id: number) => {
    const response =
      await api.put(
        `/missions/${id}/demarrer`
      );

    return response.data;
  };

export const suspendreMission =
  async (
    id: number,
    observation?: string
  ) => {
    const response =
      await api.put(
        `/missions/${id}/suspendre`,
        {
          observation,
        }
      );

    return response.data;
  };

export const reprendreMission =
  async (id: number) => {
    const response =
      await api.put(
        `/missions/${id}/reprendre`
      );

    return response.data;
  };

export const terminerMission =
  async (
    id: number,
    observation?: string
  ) => {
    const response =
      await api.put(
        `/missions/${id}/terminer`,
        {
          observation,
        }
      );

    return response.data;
  };

export const annulerMission =
  async (
    id: number,
    observation?: string
  ) => {
    const response =
      await api.put(
        `/missions/${id}/annuler`,
        {
          observation,
        }
      );

    return response.data;
  };
export const envoyerPositionMission = async (
  idMission: number,
  latitude: number,
  longitude: number
) => {
  const response = await api.put(
    `/agent/missions/${idMission}/position`,
    { latitude, longitude }
  );

  return response.data;
};
