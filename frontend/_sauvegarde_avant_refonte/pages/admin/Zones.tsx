import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  MapPin,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import api from "../../services/api";

interface Zone {
  idZone: number;
  nomZone: string;
  description?: string | null;
  id_superviseur?: number | null;
}

interface Utilisateur {
  idUtilisateur: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  statutCompte: string;
}

interface Bac {
  id_bac: number;
  id_zone: number;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (
    error &&
    typeof error === "object" &&
    "response" in error
  ) {
    const response = error.response;

    if (
      response &&
      typeof response === "object" &&
      "data" in response &&
      response.data &&
      typeof response.data === "object" &&
      "message" in response.data &&
      typeof response.data.message === "string"
    ) {
      return response.data.message;
    }
  }

  return fallback;
};

export default function Zones() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [utilisateurs, setUtilisateurs] =
    useState<Utilisateur[]>([]);
  const [bacs, setBacs] = useState<Bac[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  const [selectedZone, setSelectedZone] =
    useState<Zone | null>(null);

  const [
    superviseurSelectionne,
    setSuperviseurSelectionne,
  ] = useState("");

  const [affectationLoading, setAffectationLoading] =
    useState(false);

  const [affectationMessage, setAffectationMessage] =
    useState("");

  const chargerDonnees = async (
    refresh = false
  ) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [
        zonesResponse,
        utilisateursResponse,
        bacsResponse,
      ] = await Promise.all([
        api.get("/zones"),
        api.get("/utilisateurs"),
        api.get("/bacs"),
      ]);

      setZones(
        Array.isArray(zonesResponse.data)
          ? zonesResponse.data
          : zonesResponse.data.zones || []
      );

      setUtilisateurs(
        Array.isArray(
          utilisateursResponse.data
        )
          ? utilisateursResponse.data
          : utilisateursResponse.data
              .utilisateurs || []
      );

      setBacs(
        Array.isArray(bacsResponse.data)
          ? bacsResponse.data
          : bacsResponse.data.bacs || []
      );
    } catch (err: unknown) {
      setError(
        getErrorMessage(err, "Impossible de charger les zones.")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    chargerDonnees();

    const interval =
      window.setInterval(() => {
        chargerDonnees(true);
      }, 30000);

    return () =>
      window.clearInterval(interval);
  }, []);

  const superviseurs = useMemo(
    () =>
      utilisateurs.filter(
        (utilisateur) =>
          utilisateur.role ===
            "SUPERVISEUR" &&
          utilisateur.statutCompte ===
            "ACTIF"
      ),
    [utilisateurs]
  );

  const zonesFiltrees = useMemo(() => {
    const terme = search
      .trim()
      .toLowerCase();

    return zones.filter((zone) => {
      if (!terme) return true;

      return (
        zone.nomZone
          ?.toLowerCase()
          .includes(terme) ||
        zone.description
          ?.toLowerCase()
          .includes(terme)
      );
    });
  }, [zones, search]);

  const getSuperviseur = (id: number | null | undefined) =>
    utilisateurs.find(
      (utilisateur) =>
        Number(
          utilisateur.idUtilisateur
        ) === Number(id)
    );

  const getBacsZone = (idZone: number) =>
    bacs.filter(
      (bac) =>
        Number(bac.id_zone) ===
        Number(idZone)
    );

  const ouvrirZone = (zone: Zone) => {
    setSelectedZone(zone);
    setSuperviseurSelectionne(
      zone.id_superviseur
        ? String(zone.id_superviseur)
        : ""
    );
    setAffectationMessage("");
  };

  const affecter = async () => {
    if (!selectedZone) return;

    if (!superviseurSelectionne) {
      setAffectationMessage(
        "Veuillez sélectionner un superviseur."
      );
      return;
    }

    try {
      setAffectationLoading(true);
      setAffectationMessage("");

      await api.put(
        `/zones/${selectedZone.idZone}/superviseur`,
        {
          id_superviseur:
            Number(
              superviseurSelectionne
            ),
        }
      );

      setAffectationMessage(
        "Superviseur affecté avec succès."
      );

      await chargerDonnees(true);

      const zoneActualisee =
        (
          await api.get(
            `/zones/${selectedZone.idZone}`
          )
        ).data;

      setSelectedZone(
        zoneActualisee.zone ||
          zoneActualisee
      );
    } catch (err: unknown) {
      setAffectationMessage(
        getErrorMessage(err, "Impossible d'affecter le superviseur.")
      );
    } finally {
      setAffectationLoading(false);
    }
  };

  const retirer = async () => {
    if (!selectedZone) return;

    try {
      setAffectationLoading(true);
      setAffectationMessage("");

      await api.delete(
        `/zones/${selectedZone.idZone}/superviseur`
      );

      setAffectationMessage(
        "Superviseur retiré de la zone."
      );

      await chargerDonnees(true);

      const zoneActualisee =
        (
          await api.get(
            `/zones/${selectedZone.idZone}`
          )
        ).data;

      setSelectedZone(
        zoneActualisee.zone ||
          zoneActualisee
      );

      setSuperviseurSelectionne("");
    } catch (err: unknown) {
      setAffectationMessage(
        getErrorMessage(err, "Impossible de retirer le superviseur.")
      );
    } finally {
      setAffectationLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-600">
              Administration
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Gestion des zones
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Consultez les zones et affectez leur
              superviseur.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              chargerDonnees(true)
            }
            disabled={refreshing}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 sm:w-auto"
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Actualiser
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">
              Zones
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {zones.length}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs text-emerald-700">
              Superviseurs actifs
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-700">
              {superviseurs.length}
            </p>
          </div>

          <div className="col-span-2 rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:col-span-1">
            <p className="text-xs text-blue-700">
              Bacs
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-700">
              {bacs.length}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Rechercher une zone..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(
              (item) => (
                <div
                  key={item}
                  className="h-64 animate-pulse rounded-2xl bg-white shadow-sm"
                />
              )
            )}
          </div>
        ) : zonesFiltrees.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <MapPin
              size={32}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-4 font-semibold text-slate-900">
              Aucune zone trouvée
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Aucune zone ne correspond à votre
              recherche.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {zonesFiltrees.map((zone) => {
              const superviseur =
                getSuperviseur(
                  zone.id_superviseur
                );

              const bacsZone =
                getBacsZone(
                  zone.idZone
                );

              return (
                <article
                  key={zone.idZone}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                        <MapPin size={21} />
                      </div>

                      <div className="min-w-0">
                        <h2 className="truncate font-bold text-slate-900">
                          {zone.nomZone}
                        </h2>

                        <p className="text-xs text-slate-400">
                          Zone #{zone.idZone}
                        </p>
                      </div>
                    </div>

                    {superviseur ? (
                      <CheckCircle2
                        size={19}
                        className="shrink-0 text-emerald-500"
                      />
                    ) : (
                      <AlertTriangle
                        size={19}
                        className="shrink-0 text-amber-500"
                      />
                    )}
                  </div>

                  <p className="mt-4 min-h-10 text-sm text-slate-500">
                    {zone.description ||
                      "Aucune description disponible."}
                  </p>

                  <div className="mt-5 space-y-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                        <UserRound size={14} />
                        Superviseur
                      </div>

                      {superviseur ? (
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {superviseur.prenom}{" "}
                          {superviseur.nom}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm font-medium text-amber-600">
                          Aucun superviseur
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                        <Trash2 size={14} />
                        Bacs
                      </div>

                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {bacsZone.length} bac
                        {bacsZone.length > 1
                          ? "s"
                          : ""}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      ouvrirZone(zone)
                    }
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Eye size={17} />
                    Consulter
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {selectedZone && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-xl sm:rounded-3xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-5">
              <div>
                <p className="text-xs font-medium text-emerald-600">
                  Gestion de la zone
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {selectedZone.nomZone}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedZone(null)
                }
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <MapPin
                    size={18}
                    className="text-emerald-600"
                  />

                  <h3 className="font-semibold text-slate-900">
                    Informations
                  </h3>
                </div>

                <p className="mt-3 text-sm text-slate-600">
                  {selectedZone.description ||
                    "Aucune description disponible."}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center gap-2">
                  <UserRound
                    size={18}
                    className="text-emerald-600"
                  />

                  <h3 className="font-semibold text-slate-900">
                    Superviseur de la zone
                  </h3>
                </div>

                <select
                  value={
                    superviseurSelectionne
                  }
                  onChange={(event) =>
                    setSuperviseurSelectionne(
                      event.target.value
                    )
                  }
                  className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">
                    Aucun superviseur
                  </option>

                  {superviseurs.map(
                    (superviseur) => (
                      <option
                        key={
                          superviseur.idUtilisateur
                        }
                        value={
                          superviseur.idUtilisateur
                        }
                      >
                        {superviseur.prenom}{" "}
                        {superviseur.nom} —{" "}
                        {superviseur.email}
                      </option>
                    )
                  )}
                </select>

                {affectationMessage && (
                  <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                    {affectationMessage}
                  </p>
                )}

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={affecter}
                    disabled={
                      affectationLoading ||
                      !superviseurSelectionne
                    }
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 size={17} />
                    {affectationLoading
                      ? "Enregistrement..."
                      : "Affecter"}
                  </button>

                  {selectedZone.id_superviseur && (
                    <button
                      type="button"
                      onClick={retirer}
                      disabled={
                        affectationLoading
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <X size={17} />
                      Retirer
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center gap-2">
                  <Users
                    size={18}
                    className="text-emerald-600"
                  />

                  <h3 className="font-semibold text-slate-900">
                    Agents de collecte
                  </h3>
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  Les agents seront gérés selon leur
                  affectation à cette zone.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}