import api from "./api";

export interface Zone {
  idZone: number;
  nomZone: string;
  description?: string | null;
}

export interface Bac {
  id_bac: number;
  reference: string;
  capacite?: number | string;
  hauteur?: number | string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  niveau_remplissage: number | string;
  seuil_alerte: number | string;
  etat: "NORMAL" | "ALERTE" | "PLEIN";
  date_installation?: string | null;
  id_zone: number;
  zone?: Zone;
}

export interface Agent {
  idUtilisateur: number;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string | null;
  statutCompte: string;
  role?: "AGENT_COLLECTE";
  id_zone?: number | null;
  // Renseignés par GET /superviseur/agents
  missionsActives?: number;
  limiteMissions?: number;
  disponible?: boolean;
  missions?: {
    idMission: number;
    statut: string;
    priorite: string;
    bac?: { id_bac: number; reference: string };
  }[];
}

export interface Mission {
  idMission: number;
  latitudeAgent?: number | string | null;
  longitudeAgent?: number | string | null;
  datePositionAgent?: string | null;
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
  agent?: Agent;
}

export interface Intervention {
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
  bac?: Bac;
  mission?: Mission | null;
}

export interface StatistiquesSuperviseur {
  totalBacs: number;
  bacsNormaux: number;
  bacsAlerte: number;
  bacsPleins: number;
  pourcentageMoyen: number;
  interventionsEnAttente: number;
  interventionsEnCours: number;
  interventionsTerminees: number;
  totalInterventions: number;
}

export interface DashboardSuperviseur {
  zone: Zone;
  statistiques: StatistiquesSuperviseur;
  bacs: Bac[];
  interventions: Intervention[];
}

export interface StatistiquesDetaillees {
  nombreBacs: number;
  nombreMesures: number;
  nombreInterventions: number;
  repartitionEtat: {
    NORMAL: number;
    ALERTE: number;
    PLEIN: number;
  };
  repartitionInterventions: {
    EN_ATTENTE: number;
    PLANIFIEE: number;
    EN_COURS: number;
    TERMINEE: number;
    ANNULEE: number;
  };
  parBac: Array<{
    id_bac: number;
    reference: string;
    etat: string;
    niveau_actuel: number;
    moyenne_remplissage: number;
    nombre_mesures: number;
  }>;
}

export interface ListeBacsResponse {
  zone: Zone;
  total: number;
  bacs: Bac[];
}

export interface ListeAlertesResponse {
  total: number;
  alertes: Bac[];
}

export interface ListeInterventionsResponse {
  totalInterventions: number;
  interventions: Intervention[];
}

export interface ListeAgentsResponse {
  zone?: Zone;
  totalAgents: number;
  agents: Agent[];
}

export interface ListeMissionsResponse {
  totalMissions: number;
  missions: Mission[];
}

export interface NotificationsResponse {
  total: number;
  nonLues: number;
  notifications: Notification[];
}

export interface Notification {
  idNotification: number;
  contenu: string;
  dateNotification: string;
  lu: boolean;
  idUtilisateur: number;
}

export interface CreerInterventionData {
  id_bac: number;
  id_agent?: number;
  datePrevue?: string | null;
  priorite?:
    | "NORMALE"
    | "MOYENNE"
    | "HAUTE"
    | "CRITIQUE";
  motif?: string | null;
}

export interface AffecterInterventionData {
  id_agent: number;
}

export const obtenirDashboardSuperviseur =
  async (): Promise<DashboardSuperviseur> => {
    const response = await api.get(
      "/superviseur/dashboard"
    );

    return response.data;
  };

export const listerBacsSuperviseur =
  async (): Promise<ListeBacsResponse> => {
    const response = await api.get(
      "/superviseur/bacs"
    );

    return response.data;
  };

export const consulterBacSuperviseur =
  async (
    id: number
  ): Promise<Bac> => {
    const response = await api.get(
      `/superviseur/bacs/${id}`
    );

    return response.data;
  };

export const obtenirAlertesSuperviseur =
  async (): Promise<ListeAlertesResponse> => {
    const response = await api.get(
      "/superviseur/alertes"
    );

    return response.data;
  };

export const obtenirLocalisationBacs =
  async (): Promise<ListeBacsResponse> => {
    const response = await api.get(
      "/superviseur/localisation"
    );

    return response.data;
  };

export const obtenirStatistiquesSuperviseur =
  async (periode?: { debut?: string; fin?: string }): Promise<{
    zone: Zone;
    statistiques: StatistiquesDetaillees;
  }> => {
    const response = await api.get(
      "/superviseur/statistiques",
      {
        params: {
          ...(periode?.debut ? { dateDebut: periode.debut } : {}),
          ...(periode?.fin ? { dateFin: periode.fin } : {}),
        },
      }
    );

    return response.data;
  };

export const listerInterventionsSuperviseur =
  async (): Promise<ListeInterventionsResponse> => {
    const response = await api.get(
      "/interventions"
    );

    return response.data;
  };

export const consulterInterventionSuperviseur =
  async (
    id: number
  ): Promise<{
    intervention: Intervention;
  }> => {
    const response = await api.get(
      `/interventions/${id}`
    );

    return response.data;
  };

export const creerInterventionSuperviseur =
  async (
    donnees: CreerInterventionData
  ) => {
    const response = await api.post(
      "/interventions",
      donnees
    );

    return response.data;
  };

export const affecterInterventionSuperviseur =
  async (
    idIntervention: number,
    donnees: AffecterInterventionData
  ) => {
    const response = await api.post(
      `/interventions/${idIntervention}/affecter`,
      donnees
    );

    return response.data;
  };

export const modifierInterventionSuperviseur =
  async (
    idIntervention: number,
    donnees: Partial<{
      datePrevue: string | null;
      priorite:
        | "NORMALE"
        | "MOYENNE"
        | "HAUTE"
        | "CRITIQUE";
      motif: string | null;
    }>
  ) => {
    const response = await api.put(
      `/interventions/${idIntervention}`,
      donnees
    );

    return response.data;
  };

export const annulerInterventionSuperviseur =
  async (
    idIntervention: number
  ) => {
    const response = await api.put(
      `/interventions/${idIntervention}/annuler`
    );

    return response.data;
  };

export const listerAgentsSuperviseur =
  async (): Promise<ListeAgentsResponse> => {
    const response = await api.get<ListeAgentsResponse>(
      "/superviseur/agents"
    );

    return {
      zone: response.data?.zone,
      totalAgents: response.data?.totalAgents ?? 0,
      agents: Array.isArray(response.data?.agents)
        ? response.data.agents
        : [],
    };
  };

export const listerMissionsSuperviseur =
  async (): Promise<ListeMissionsResponse> => {
    const response = await api.get(
      "/missions"
    );

    return response.data;
  };

export const consulterMissionSuperviseur =
  async (
    idMission: number
  ) => {
    const response = await api.get(
      `/missions/${idMission}`
    );

    return response.data;
  };

export const annulerMissionSuperviseur =
  async (
    idMission: number
  ) => {
    const response = await api.put(
      `/missions/${idMission}/annuler`
    );

    return response.data;
  };

export const listerNotificationsSuperviseur =
  async (): Promise<NotificationsResponse> => {
    const response = await api.get(
      "/notifications"
    );

    return response.data;
  };

export const marquerNotificationLue =
  async (
    idNotification: number
  ) => {
    const response = await api.put(
      `/notifications/${idNotification}/lire`
    );

    return response.data;
  };

export const marquerToutesNotificationsLues =
  async () => {
    const response = await api.put(
      "/notifications/lire-toutes"
    );

    return response.data;
  };
export interface SuiviInterventionsResponse {
  zone?: Zone;
  total: number;
  interventions: Intervention[];
}

export const suivreInterventionsSuperviseur =
  async (): Promise<SuiviInterventionsResponse> => {
    const response = await api.get<SuiviInterventionsResponse>(
      "/superviseur/suivi"
    );

    return {
      zone: response.data?.zone,
      total: response.data?.total ?? 0,
      interventions: Array.isArray(response.data?.interventions)
        ? response.data.interventions
        : [],
    };
  };
