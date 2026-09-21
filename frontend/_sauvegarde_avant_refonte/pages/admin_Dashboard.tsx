// frontend/src/pages/admin/Dashboard.tsx

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  MapPin,
  RefreshCw,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import {
  obtenirClasseFondNiveauBac,
  obtenirClasseTexteNiveauBac,
  normaliserNiveauBac,
} from "../../utils/bacLevel";

interface Bac {
  id_bac: number;
  reference: string;
  niveau_remplissage: number;
  seuil_alerte: number;
  etat: string;
  id_zone: number;
}

interface Zone {
  idZone: number;
  nomZone: string;
}

interface Utilisateur {
  idUtilisateur: number;
  nom: string;
  prenom: string;
  role: string;
  statutCompte: string;
}

interface Demande {
  idDemande: number;
  nom: string;
  prenom: string;
  email: string;
  roleDemande: string;
  statut: string;
  dateDemande: string;
}

interface Intervention {
  idIntervention: number;
  motif: string;
  priorite: string;
  statut: string;
  id_bac: number;
  dateCreation: string;
}

interface DashboardBacsResponse {
  bacs?: Bac[];
}

interface DashboardUsersResponse {
  utilisateurs?: Utilisateur[];
}

interface DashboardInterventionsResponse {
  interventions?: Intervention[];
}

export default function Dashboard() {
  const [bacs, setBacs] = useState<Bac[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (manual = false) => {
    try {
      setError("");
      if (manual) setRefreshing(true);
      else setLoading(true);

      const [
        bacsResponse,
        zonesResponse,
        usersResponse,
        demandesResponse,
        interventionsResponse,
      ] = await Promise.all([
        api.get<Bac[] | DashboardBacsResponse>("/bacs"),
        api.get<Zone[]>("/zones"),
        api.get<Utilisateur[] | DashboardUsersResponse>("/utilisateurs"),
        api.get<Demande[] | { demandes?: Demande[] }>("/demandes-inscription"),
        api.get<Intervention[] | DashboardInterventionsResponse>("/interventions"),
      ]);

      setBacs(
        Array.isArray(bacsResponse.data)
          ? bacsResponse.data
          : bacsResponse.data?.bacs ?? []
      );
      setZones(Array.isArray(zonesResponse.data) ? zonesResponse.data : []);
      setUsers(
        Array.isArray(usersResponse.data)
          ? usersResponse.data
          : usersResponse.data?.utilisateurs ?? []
      );
      setDemandes(
        Array.isArray(demandesResponse.data)
          ? demandesResponse.data
          : demandesResponse.data?.demandes ?? []
      );
      setInterventions(
        Array.isArray(interventionsResponse.data)
          ? interventionsResponse.data
          : interventionsResponse.data?.interventions ?? []
      );
    } catch (requestError: any) {
      console.error("Erreur chargement dashboard admin :", requestError);
      setError(
        requestError?.response?.data?.message ||
          "Impossible de charger toutes les données du tableau de bord."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();

    const interval = window.setInterval(() => {
      loadDashboard();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [loadDashboard]);

  const stats = useMemo(() => {
    const average =
      bacs.length > 0
        ? bacs.reduce(
            (total, bac) => total + Number(bac.niveau_remplissage || 0),
            0
          ) / bacs.length
        : 0;

    return {
      totalBacs: bacs.length,
      normalBacs: bacs.filter((bac) => bac.etat === "NORMAL").length,
      alertBacs: bacs.filter((bac) => bac.etat === "ALERTE").length,
      fullBacs: bacs.filter((bac) => bac.etat === "PLEIN").length,
      totalZones: zones.length,
      activeUsers: users.filter(
        (user) => user.statutCompte === "ACTIF"
      ).length,
      pendingRequests: demandes.filter(
        (demande) => demande.statut === "EN_ATTENTE"
      ).length,
      activeInterventions: interventions.filter(
        (item) => item.statut === "EN_COURS"
      ).length,
      average,
    };
  }, [bacs, demandes, interventions, users, zones]);

  const criticalBacs = bacs
    .filter(
      (bac) =>
        normaliserNiveauBac(bac.niveau_remplissage) > 50
    )
    .sort(
      (a, b) =>
        Number(b.niveau_remplissage) -
        Number(a.niveau_remplissage)
    )
    .slice(0, 5);

  const recentRequests = demandes
    .filter((item) => item.statut === "EN_ATTENTE")
    .slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-full bg-[#f7f9f8] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1500px] rounded-2xl border border-slate-200 bg-white p-16 text-center text-sm text-slate-500 shadow-sm">
          Chargement du tableau de bord...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f7f9f8] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
              <Activity size={16} />
              SmartCityWaste
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Vue d'ensemble
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Suivez l'état opérationnel de votre plateforme.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:border-emerald-200 hover:text-emerald-700 disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
            Actualiser
          </button>
        </div>

        {error && (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => loadDashboard(true)}
              className="shrink-0 font-semibold underline underline-offset-2"
            >
              Réessayer
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <Activity className="mb-3 text-blue-600" size={20} />
            <p className="text-xs text-slate-500">Bacs connectés</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {stats.totalBacs}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
            <CheckCircle2 className="mb-3 text-emerald-600" size={20} />
            <p className="text-xs text-slate-500">Bacs normaux</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {stats.normalBacs}
            </p>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
            <AlertTriangle className="mb-3 text-orange-600" size={20} />
            <p className="text-xs text-slate-500">Bacs en alerte</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {stats.alertBacs}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm">
            <AlertTriangle className="mb-3 text-red-600" size={20} />
            <p className="text-xs text-slate-500">Bacs pleins</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {stats.fullBacs}
            </p>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
            <MapPin className="mb-3 text-violet-600" size={20} />
            <p className="text-xs text-slate-500">Zones</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {stats.totalZones}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
            <TrendingUp className="mb-3 text-blue-600" size={20} />
            <p className="text-xs text-slate-500">Niveau moyen</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {stats.average.toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold text-slate-900">
                  Bacs nécessitant une attention
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Les niveaux les plus élevés actuellement.
                </p>
              </div>

              <Link
                to="/admin/bacs"
                className="hidden items-center gap-1 text-xs font-bold text-emerald-700 sm:flex"
              >
                Voir tous
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="space-y-3">
              {criticalBacs.length === 0 ? (
                <div className="rounded-xl bg-emerald-50 p-5 text-center text-sm font-medium text-emerald-700">
                  Aucun bac critique actuellement.
                </div>
              ) : (
                criticalBacs.map((bac) => {
                  const level = Number(bac.niveau_remplissage || 0);

                  return (
                    <div
                      key={bac.id_bac}
                      className="rounded-xl border border-slate-100 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${obtenirClasseTexteNiveauBac(
                              level
                            )} bg-slate-50`}
                          >
                            <Activity size={17} />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-800">
                              {bac.reference}
                            </p>
                            <p className="text-xs text-slate-500">
                              Zone #{bac.id_zone}
                            </p>
                          </div>
                        </div>

                        <p
                          className={`text-lg font-bold ${obtenirClasseTexteNiveauBac(
                            level
                          )}`}
                        >
                          {level.toFixed(0)}%
                        </p>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${obtenirClasseFondNiveauBac(
                            level
                          )}`}
                          style={{
                            width: `${Math.min(level, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="font-bold text-slate-900">
                Activité administrative
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Éléments nécessitant votre attention.
              </p>
            </div>

            <div className="space-y-3">
              <Link
                to="/admin/demandes"
                className="flex items-center justify-between rounded-xl bg-orange-50 p-4 transition hover:bg-orange-100"
              >
                <div className="flex items-center gap-3">
                  <Clock3 className="text-orange-600" size={19} />
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Demandes en attente
                    </p>
                    <p className="text-xs text-slate-500">
                      Inscriptions à traiter
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-orange-600 px-2.5 py-1 text-xs font-bold text-white">
                  {stats.pendingRequests}
                </span>
              </Link>

              <Link
                to="/admin/utilisateurs"
                className="flex items-center justify-between rounded-xl bg-blue-50 p-4 transition hover:bg-blue-100"
              >
                <div className="flex items-center gap-3">
                  <Users className="text-blue-600" size={19} />
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Comptes actifs
                    </p>
                    <p className="text-xs text-slate-500">
                      Utilisateurs autorisés
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold text-blue-700">
                  {stats.activeUsers}
                </span>
              </Link>

              <Link
                to="/admin/interventions"
                className="flex items-center justify-between rounded-xl bg-violet-50 p-4 transition hover:bg-violet-100"
              >
                <div className="flex items-center gap-3">
                  <Activity className="text-violet-600" size={19} />
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Interventions en cours
                    </p>
                    <p className="text-xs text-slate-500">
                      Suivi opérationnel
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold text-violet-700">
                  {stats.activeInterventions}
                </span>
              </Link>
            </div>
          </section>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-bold text-slate-900">
                  Dernières demandes
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Demandes d'inscription à traiter.
                </p>
              </div>
              <UserPlus size={19} className="text-slate-400" />
            </div>

            <div className="divide-y divide-slate-100">
              {recentRequests.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  Aucune demande en attente.
                </div>
              ) : (
                recentRequests.map((request) => (
                  <div
                    key={request.idDemande}
                    className="flex items-center justify-between gap-3 px-5 py-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xs font-bold text-emerald-700">
                        {request.prenom?.[0]}
                        {request.nom?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {request.prenom} {request.nom}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {request.roleDemande}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-700">
                      En attente
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-bold text-slate-900">
                  État global
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Synthèse rapide de l'exploitation.
                </p>
              </div>
              <Activity size={19} className="text-slate-400" />
            </div>

            <div className="grid grid-cols-2 gap-3 p-5">
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-xs font-medium text-emerald-700">
                  Fonctionnement normal
                </p>
                <p className="mt-2 text-2xl font-bold text-emerald-800">
                  {stats.totalBacs > 0
                    ? ((stats.normalBacs / stats.totalBacs) * 100).toFixed(0)
                    : 0}
                  %
                </p>
              </div>

              <div className="rounded-xl bg-orange-50 p-4">
                <p className="text-xs font-medium text-orange-700">
                  Situation à surveiller
                </p>
                <p className="mt-2 text-2xl font-bold text-orange-800">
                  {stats.alertBacs + stats.fullBacs}
                </p>
                <p className="mt-1 text-[11px] text-orange-700">
                  bac(s)
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-xs font-medium text-blue-700">
                  Utilisateurs actifs
                </p>
                <p className="mt-2 text-2xl font-bold text-blue-800">
                  {stats.activeUsers}
                </p>
              </div>

              <div className="rounded-xl bg-violet-50 p-4">
                <p className="text-xs font-medium text-violet-700">
                  Interventions actives
                </p>
                <p className="mt-2 text-2xl font-bold text-violet-800">
                  {stats.activeInterventions}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}