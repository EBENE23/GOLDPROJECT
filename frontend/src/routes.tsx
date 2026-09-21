import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";

import PublicLayout from "./layouts/PublicLayout";
import Home from "./pages/public/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUtilisateurs from "./pages/admin/Utilisateurs";
import AdminDemandes from "./pages/admin/Demandes";
import AdminZones from "./pages/admin/Zones";
import AdminBacs from "./pages/admin/Bacs";
import AdminInterventions from "./pages/admin/Interventions";
import AdminRapports from "./pages/admin/Rapports";
import MonProfil from "./pages/compte/MonProfil";
import Preferences from "./pages/compte/Preferences";

import SuperviseurLayout from "./layouts/SuperviseurLayout";
import SuperviseurDashboard from "./pages/superviseur/Dashboard";
import SuperviseurBacs from "./pages/superviseur/Bacs";
import SuperviseurAlertes from "./pages/superviseur/Alertes";
import SuperviseurHistoriques from "./pages/superviseur/Historiques";
import SuperviseurInterventions from "./pages/superviseur/Interventions";
import CarteDesBacs from "./pages/carte/CarteDesBacs";
import SuperviseurStatistiques from "./pages/superviseur/Statistiques";
import SuperviseurSuivi from "./pages/superviseur/Suivi";
import SuperviseurAgents from "./pages/superviseur/Agents";

import AgentLayout from "./layouts/AgentLayout";
import AgentDashboard from "./pages/agent/Dashboard";
import AgentHistorique from "./pages/agent/Historique";
import AgentMissionLocalisation from "./pages/agent/MissionLocalisation";
import AgentMissionDetails from "./pages/agent/MissionDetails";
import AgentMissions from "./pages/agent/Missions";
import AgentSignalements from "./pages/agent/Signalements";
import AgentNotifications from "./pages/agent/Notifications";

const RoutesApp = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/home" replace />}
      />

      <Route element={<PublicLayout />}>
        <Route
          path="/home"
          element={<Home />}
        />
      </Route>

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        element={
          <ProtectedRoute
            roles={["ADMINISTRATEUR"]}
          />
        }
      >
        <Route
          path="/admin"
          element={<AdminLayout />}
        >
          <Route
            index
            element={<AdminDashboard />}
          />

          <Route
            path="utilisateurs"
            element={<AdminUtilisateurs />}
          />

          <Route
            path="demandes"
            element={<AdminDemandes />}
          />

          <Route
            path="zones"
            element={<AdminZones />}
          />

          <Route
            path="bacs"
            element={<AdminBacs />}
          />

          <Route
            path="interventions"
            element={<AdminInterventions />}
          />

          <Route
            path="rapports"
            element={<AdminRapports />}
          />

          <Route
            path="parametres"
            element={<Preferences />}
          />

          <Route
            path="profil"
            element={<MonProfil />}
          />
        </Route>
      </Route>

      <Route
        element={
          <ProtectedRoute
            roles={["SUPERVISEUR"]}
          />
        }
      >
        <Route
          path="/superviseur"
          element={<SuperviseurLayout />}
        >
          <Route
            index
            element={<SuperviseurDashboard />}
          />

          <Route
            path="bacs"
            element={<SuperviseurBacs />}
          />

          <Route
            path="alertes"
            element={<SuperviseurAlertes />}
          />

          <Route
            path="historiques"
            element={<SuperviseurHistoriques />}
          />

          <Route
            path="interventions"
            element={<SuperviseurInterventions />}
          />

          <Route
            path="localisation"
            element={<CarteDesBacs role="SUPERVISEUR" />}
          />

          <Route
            path="statistiques"
            element={<SuperviseurStatistiques />}
          />

          <Route
            path="suivi"
            element={<SuperviseurSuivi />}
          />

          <Route
            path="agents"
            element={<SuperviseurAgents />}
          />

          <Route
            path="notifications"
            element={<AgentNotifications />}
          />

          <Route
            path="profil"
            element={<MonProfil />}
          />

          <Route
            path="parametres"
            element={<Preferences />}
          />
        </Route>
      </Route>

      <Route
        element={
          <ProtectedRoute
            roles={["AGENT_COLLECTE"]}
          />
        }
      >
        <Route
          path="/agent"
          element={<AgentLayout />}
        >
          <Route
            index
            element={<AgentDashboard />}
          />

          <Route
            path="missions"
            element={<AgentMissions />}
          />

          <Route
            path="missions/:id"
            element={<AgentMissionDetails />}
          />

          <Route
            path="missions/:id/localisation"
            element={<AgentMissionLocalisation />}
          />

          <Route
            path="localisation"
            element={<CarteDesBacs role="AGENT_COLLECTE" />}
          />

          <Route
            path="historique"
            element={<AgentHistorique />}
          />

          <Route
            path="signalements"
            element={<AgentSignalements />}
          />

          <Route
            path="notifications"
            element={<AgentNotifications />}
          />

          <Route
            path="profil"
            element={<MonProfil />}
          />

          <Route
            path="parametres"
            element={<Preferences />}
          />
        </Route>
      </Route>

      <Route
        path="/unauthorized"
        element={
          <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900">
                Accès refusé
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Vous n'avez pas les droits nécessaires pour accéder à cette page.
              </p>

              <button
                type="button"
                onClick={() =>
                  window.history.back()
                }
                className="mt-6 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
              >
                Retour
              </button>
            </div>
          </div>
        }
      />

      <Route
        path="*"
        element={<Navigate to="/home" replace />}
      />
    </Routes>
  );
};

export default RoutesApp;