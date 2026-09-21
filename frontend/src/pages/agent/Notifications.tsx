import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, MapPin, Navigation, RefreshCw, Trash2 } from "lucide-react";

import {
  BandeauErreur,
  Card,
  Chargement,
  EtatBadge,
  EtatVide,
  PageHeader,
  PrimaryButton,
  RefPill,
  SecondaryButton,
  dateRelative,
} from "../../components/ui/kit";
import { useAuthStore } from "../../stores/authStore";
import {
  listerNotificationsAgent,
  marquerNotificationAgentLue,
  marquerToutesNotificationsAgentLues,
  type NotificationAgent,
} from "../../services/notificationService";
import { obtenirCategorieNiveauBac } from "../../utils/bacLevel";
import { useTempsReel } from "../../hooks/useTempsReel";

/** Notifications de l'utilisateur connecté (agent ou superviseur). */
export default function Notifications() {
  const estSuperviseur = useAuthStore((state) => state.utilisateur?.role) === "SUPERVISEUR";
  const [notifications, setNotifications] = useState<NotificationAgent[]>([]);
  const [nonLues, setNonLues] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const charger = useCallback(async (actualisation = false) => {
    try {
      setError("");
      if (actualisation) setRefreshing(true);
      const resultat = await listerNotificationsAgent();
      setNotifications(resultat.notifications);
      setNonLues(resultat.nonLues);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Impossible de charger les notifications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    charger();
    const intervalle = window.setInterval(() => charger(), 15000);
    return () => window.clearInterval(intervalle);
  }, [charger]);

  useTempsReel(() => charger());

  const marquerLue = async (notification: NotificationAgent) => {
    if (notification.lu) return;

    try {
      await marquerNotificationAgentLue(notification.idNotification);
      setNotifications((liste) => liste.map((n) => (n.idNotification === notification.idNotification ? { ...n, lu: true } : n)));
      setNonLues((total) => Math.max(0, total - 1));
    } catch {
      /* la lecture sera retentée au prochain clic */
    }
  };

  const toutLire = async () => {
    if (nonLues === 0) return;

    try {
      await marquerToutesNotificationsAgentLues();
      setNotifications((liste) => liste.map((n) => ({ ...n, lu: true })));
      setNonLues(0);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Impossible de marquer les notifications comme lues.");
    }
  };

  if (loading) return <Chargement texte="Chargement des notifications..." />;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        titre="Notifications"
        description={
          estSuperviseur
            ? "Alertes de remplissage des bacs et signalements de vos agents."
            : "Nouvelles missions et informations de votre superviseur."
        }
        actions={
          <>
            <SecondaryButton icone={RefreshCw} chargement={refreshing} onClick={() => charger(true)}>
              Actualiser
            </SecondaryButton>
            <PrimaryButton icone={CheckCheck} onClick={toutLire} disabled={nonLues === 0}>
              Tout lire
            </PrimaryButton>
          </>
        }
      />

      {error && <BandeauErreur message={error} onReessayer={() => charger()} />}

      <p className="text-sm font-medium text-slate-500">{nonLues} non lue(s)</p>

      {notifications.length === 0 ? (
        <Card>
          <EtatVide icone={Bell} titre="Aucune notification" description="Les nouvelles notifications apparaîtront ici." />
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.idNotification}
              severite={notification.bac ? obtenirCategorieNiveauBac(notification.bac.niveau_remplissage) : undefined}
              className={`cursor-pointer p-4 transition hover:shadow-md ${notification.lu ? "" : "bg-emerald-50/40"}`}
            >
              <div role="button" tabIndex={0} onClick={() => marquerLue(notification)} onKeyDown={(e) => e.key === "Enter" && marquerLue(notification)}>
                <div className="flex items-start justify-between gap-3">
                  <p className={`text-sm ${notification.lu ? "font-medium text-slate-600" : "font-bold text-slate-900"}`}>
                    {notification.contenu}
                  </p>
                  {!notification.lu && (
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" aria-label="Non lue" />
                  )}
                </div>

                {notification.bac && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <RefPill>
                      <Trash2 size={11} className="mr-1" />
                      {notification.bac.reference}
                    </RefPill>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {Math.round(Number(notification.bac.niveau_remplissage))}% rempli
                    </span>
                    <EtatBadge niveau={notification.bac.niveau_remplissage} />
                  </div>
                )}

                <p className="mt-2 text-xs text-slate-400">{dateRelative(notification.dateNotification)}</p>
              </div>

              {(notification.mission || (estSuperviseur && notification.bac)) && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  {notification.mission && (
                    <>
                      <Link
                        to={`/agent/missions/${notification.mission.idMission}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-900"
                      >
                        Voir la mission
                      </Link>
                      <Link
                        to={`/agent/missions/${notification.mission.idMission}/localisation`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                      >
                        <Navigation size={13} />
                        Itinéraire
                      </Link>
                    </>
                  )}
                  {estSuperviseur && notification.bac && (
                    <>
                      <Link
                        to={`/superviseur/interventions?ouvrir=1&bac=${notification.bac.id_bac}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-900"
                      >
                        Planifier une intervention
                      </Link>
                      <Link
                        to="/superviseur/localisation"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                      >
                        <MapPin size={13} />
                        Voir sur la carte
                      </Link>
                    </>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
