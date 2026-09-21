import api from "./api";

export interface NotificationAgent {
  idNotification: number;
  contenu: string;
  dateNotification: string;
  lu: boolean;
  idUtilisateur: number;
  id_bac?: number | null;
  bac?: {
    id_bac: number;
    reference: string;
    latitude: number | string | null;
    longitude: number | string | null;
    niveau_remplissage: number | string;
    etat: "NORMAL" | "ALERTE" | "PLEIN";
  } | null;
  mission?: { idMission: number; statut: string } | null;
}

export interface NotificationsAgentResponse {
  total: number;
  nonLues: number;
  notifications: NotificationAgent[];
}

export const listerNotificationsAgent = async (): Promise<NotificationsAgentResponse> => {
  const response = await api.get<NotificationsAgentResponse>(
    "/notifications"
  );

  return {
    total: response.data?.total ?? 0,
    nonLues: response.data?.nonLues ?? 0,
    notifications: Array.isArray(response.data?.notifications)
      ? response.data.notifications
      : [],
  };
};

export const marquerNotificationAgentLue = async (idNotification: number) => {
  const response = await api.put(
    `/notifications/${idNotification}/lire`
  );

  return response.data;
};

export const marquerToutesNotificationsAgentLues = async () => {
  const response = await api.put("/notifications/lire-toutes");

  return response.data;
};
