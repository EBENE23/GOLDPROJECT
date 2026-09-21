import api from "./api";

export interface IncidentAgent {
  idIncident: number;
  description: string;
  statut: "OUVERT" | "TRAITE";
  latitude?: number | string | null;
  longitude?: number | string | null;
  dateCreation: string;
  id_mission: number;
  id_agent: number;
}

export interface CreationIncident {
  description: string;
  latitude?: number | null;
  longitude?: number | null;
}

export const listerIncidentsAgent = async (): Promise<
  IncidentAgent[]
> => {
  const response = await api.get("/incidents");

  return Array.isArray(response.data)
    ? response.data
    : [];
};

export const creerIncidentAgent = async (
  idMission: number,
  donnees: CreationIncident
) => {
  const response = await api.post(
    `/incidents/mission/${idMission}`,
    donnees
  );

  return response.data;
};