import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Eye,
  LocateFixed,
  MapPin,
  Pencil,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../services/api";
import {
  obtenirClasseFondNiveauBac,
  obtenirClasseTexteNiveauBac,
} from "../../utils/bacLevel";
import { useConfirmation } from "../../hooks/useConfirmation";

interface Bac {
  id_bac: number;
  reference: string;
  capacite: number;
  hauteur: number;
  latitude?: number | null;
  longitude?: number | null;
  niveau_remplissage: number;
  etat: "NORMAL" | "ALERTE" | "PLEIN";
  date_installation?: string | null;
  id_zone: number;
}

interface Zone {
  idZone: number;
  nomZone: string;
}

interface BacForm {
  reference: string;
  capacite: string;
  hauteur: string;
  latitude: string;
  longitude: string;
  id_zone: string;
}

interface BacsResponse {
  bacs?: Bac[];
}

const initialForm: BacForm = {
  reference: "",
  capacite: "",
  hauteur: "",
  latitude: "",
  longitude: "",
  id_zone: "",
};

const getStateClass = (etat: Bac["etat"]) => {
  if (etat === "PLEIN") {
    return "bg-red-50 text-red-700";
  }

  if (etat === "ALERTE") {
    return "bg-orange-50 text-orange-700";
  }

  return "bg-emerald-50 text-emerald-700";
};

const getLevelClass = (level: number) => {
  return obtenirClasseTexteNiveauBac(level);
};

const getProgressClass = (level: number) => {
  return obtenirClasseFondNiveauBac(level);
};

const getStateLabel = (etat: Bac["etat"]) => {
  if (etat === "PLEIN") {
    return "Plein";
  }

  if (etat === "ALERTE") {
    return "Alerte";
  }

  return "Normal";
};

const AddBacIcon = ({
  size = 19,
  color = "#000000",
}: {
  size?: number;
  color?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 12V16M10 14H14M18 6L17.1991 18.0129C17.129 19.065 17.0939 19.5911 16.8667 19.99C16.6666 20.3412 16.3648 20.6235 16.0011 20.7998C15.588 21 15.0607 21 14.0062 21H9.99377C8.93927 21 8.41202 21 7.99889 20.7998C7.63517 20.6235 7.33339 20.3412 7.13332 19.99C6.90607 19.5911 6.871 19.065 6.80086 18.0129L6 6M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function Bacs() {
  const { confirmer, dialogue } = useConfirmation();
  const [bacs, setBacs] = useState<Bac[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("TOUS");
  const [selected, setSelected] = useState<Bac | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  // Bac en cours de modification (null = création d'un nouveau bac).
  const [editing, setEditing] = useState<Bac | null>(null);
  const [form, setForm] = useState<BacForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [localisation, setLocalisation] = useState(false);

  const loadData = useCallback(async (manual = false) => {
    try {
      if (manual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [bacsResponse, zonesResponse] = await Promise.all([
        api.get<Bac[] | BacsResponse>("/bacs"),
        api.get<Zone[]>("/zones"),
      ]);

      setBacs(
        Array.isArray(bacsResponse.data)
          ? bacsResponse.data
          : bacsResponse.data?.bacs ?? []
      );

      setZones(
        Array.isArray(zonesResponse.data)
          ? zonesResponse.data
          : []
      );
    } catch {
      setMessage("Impossible de charger les bacs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredBacs = useMemo(() => {
    const value = search.trim().toLowerCase();

    return bacs.filter((bac) => {
      const matchesSearch =
        !value ||
        bac.reference.toLowerCase().includes(value);

      const matchesState =
        stateFilter === "TOUS" ||
        bac.etat === stateFilter;

      return matchesSearch && matchesState;
    });
  }, [bacs, search, stateFilter]);

  const ouvrirCreation = () => {
    setEditing(null);
    setForm(initialForm);
    setMessage("");
    setShowCreate(true);
  };

  const ouvrirModification = (bac: Bac) => {
    setEditing(bac);
    setForm({
      reference: bac.reference,
      capacite: String(bac.capacite),
      hauteur: String(bac.hauteur),
      latitude: bac.latitude != null ? String(bac.latitude) : "",
      longitude: bac.longitude != null ? String(bac.longitude) : "",
      id_zone: String(bac.id_zone),
    });
    setMessage("");
    setShowCreate(true);
  };

  const fermerFormulaire = () => {
    setShowCreate(false);
    setEditing(null);
  };

  // Remplit latitude/longitude avec la position actuelle du téléphone ou de l'ordinateur.
  // Utile pour recaler un bac connecté après l'avoir déplacé (ex. maison → lieu de soutenance).
  const utiliserMaPosition = () => {
    if (!("geolocation" in navigator) || !window.isSecureContext) {
      toast.warning("La localisation n'est pas disponible sur cette connexion.");
      return;
    }

    setLocalisation(true);
    navigator.geolocation.getCurrentPosition(
      (resultat) => {
        setForm((f) => ({
          ...f,
          latitude: String(resultat.coords.latitude),
          longitude: String(resultat.coords.longitude),
        }));
        setLocalisation(false);
        toast.success("Position actuelle appliquée au bac.", { autoClose: 2000 });
      },
      () => {
        setLocalisation(false);
        toast.error("Impossible d'obtenir votre position. Vérifiez l'autorisation de localisation.");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const enregistrerBac = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setMessage("");

      const donnees = {
        reference: form.reference.trim(),
        capacite: Number(form.capacite),
        hauteur: Number(form.hauteur),
        latitude: form.latitude
          ? Number(form.latitude)
          : null,
        longitude: form.longitude
          ? Number(form.longitude)
          : null,
        id_zone: Number(form.id_zone),
      };

      if (editing) {
        await api.put(`/bacs/${editing.id_bac}`, donnees);
        toast.success("Bac modifié avec succès.");
      } else {
        await api.post("/bacs", donnees);
        toast.success("Bac créé avec succès.");
      }

      setForm(initialForm);
      fermerFormulaire();

      await loadData(true);
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message ||
          `Impossible de ${editing ? "modifier" : "créer"} le bac.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const deleteBac = async (id: number) => {
    if (
      !(await confirmer({
        titre: "Supprimer ce bac ?",
        message:
          "Le bac et son historique de mesures seront supprimés définitivement.",
        libelle: "Supprimer",
        danger: true,
      }))
    ) {
      return;
    }

    try {
      setDeleting(id);
      setMessage("");

      await api.delete(`/bacs/${id}`);

      setSelected(null);

      await loadData(true);
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message ||
          "Impossible de supprimer le bac."
      );
    } finally {
      setDeleting(null);
    }
  };

  const getZoneName = (idZone: number) =>
    zones.find(
      (zone) => zone.idZone === idZone
    )?.nomZone || `Zone #${idZone}`;

  return (
    <div>
      <div >
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
              <Activity size={16} />
              Administration
            </div>

            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Gestion des bacs
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Supervisez les bacs connectés et leur niveau de remplissage.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 disabled:opacity-60"
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

            <button
              type="button"
              onClick={ouvrirCreation}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <AddBacIcon />

              <span className="hidden sm:inline">
                Nouveau bac
              </span>

              <span className="sm:hidden">
                Ajouter
              </span>
            </button>
          </div>
        </div>

        {message && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{message}</span>

            <button
              type="button"
              onClick={() => setMessage("")}
              className="ml-3 shrink-0"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <Activity
              className="mb-3 text-blue-600"
              size={20}
            />

            <p className="text-xs text-slate-500">
              Total
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {bacs.length}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
            <CheckCircle2
              className="mb-3 text-emerald-600"
              size={20}
            />

            <p className="text-xs text-slate-500">
              Normaux
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {
                bacs.filter(
                  (bac) =>
                    bac.etat === "NORMAL"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
            <AlertTriangle
              className="mb-3 text-orange-600"
              size={20}
            />

            <p className="text-xs text-slate-500">
              En alerte
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {
                bacs.filter(
                  (bac) =>
                    bac.etat === "ALERTE"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm">
            <AlertTriangle
              className="mb-3 text-red-600"
              size={20}
            />

            <p className="text-xs text-slate-500">
              Pleins
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {
                bacs.filter(
                  (bac) =>
                    bac.etat === "PLEIN"
                ).length
              }
            </p>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Rechercher un bac..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
              />
            </div>

            <select
              value={stateFilter}
              onChange={(event) =>
                setStateFilter(
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-400"
            >
              <option value="TOUS">
                Tous les états
              </option>

              <option value="NORMAL">
                Normal
              </option>

              <option value="ALERTE">
                Alerte
              </option>

              <option value="PLEIN">
                Plein
              </option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Chargement des bacs...
          </div>
        ) : filteredBacs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Aucun bac trouvé.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredBacs.map((bac) => {
              const level = Math.max(
                0,
                Math.min(
                  100,
                  Number(
                    bac.niveau_remplissage || 0
                  )
                )
              );

              return (
                <div
                  key={bac.id_bac}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                          bac.etat === "PLEIN"
                            ? "bg-red-50 text-red-600"
                            : bac.etat === "ALERTE"
                              ? "bg-orange-50 text-orange-600"
                              : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        <Activity size={20} />
                      </div>

                      <div>
                        <h2 className="font-bold text-slate-900">
                          {bac.reference}
                        </h2>

                        <p className="flex items-center gap-1 text-xs text-slate-400">
                          <MapPin size={11} />

                          {getZoneName(
                            bac.id_zone
                          )}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${getStateClass(
                        bac.etat
                      )}`}
                    >
                      {getStateLabel(
                        bac.etat
                      )}
                    </span>
                  </div>

                  <div className="mt-6">
                    <div className="mb-2 flex items-end justify-between">
                      <span className="text-xs font-medium text-slate-500">
                        Niveau de remplissage
                      </span>

                      <span
                        className={`text-2xl font-bold ${getLevelClass(
                          level
                        )}`}
                      >
                        {level.toFixed(0)}%
                      </span>
                    </div>

                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${getProgressClass(
                          level
                        )}`}
                        style={{
                          width: `${level}%`,
                        }}
                      />
                    </div>

                    <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                      <span>0%</span>
                      <span>40%</span>
                      <span>80%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">
                        Capacité
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-700">
                        {bac.capacite}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">
                        Règle
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-700">
                        50% / 80%
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() =>
                        setSelected(bac)
                      }
                      className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      <Eye size={16} />

                      Consulter
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        ouvrirModification(bac)
                      }
                      className="flex h-10 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                      aria-label={`Modifier ${bac.reference}`}
                      title="Modifier"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteBac(
                          bac.id_bac
                        )
                      }
                      disabled={
                        deleting ===
                        bac.id_bac
                      }
                      className="flex h-10 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                      aria-label={`Supprimer ${bac.reference}`}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M9 4H15"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />

                        <path
                          d="M5 7H19"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />

                        <path
                          d="M7 7L8 20H16L17 7"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        <path
                          d="M10 11V16"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />

                        <path
                          d="M14 11V16"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="anim-overlay fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="anim-feuille max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editing ? `Modifier ${editing.reference}` : "Ajouter un bac"}
                </h2>

                <p className="text-xs text-slate-500">
                  {editing
                    ? "Mettre à jour les informations de ce bac connecté."
                    : "Enregistrer un nouveau bac connecté."}
                </p>
              </div>

              <button
                type="button"
                onClick={fermerFormulaire}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={enregistrerBac}
              className="space-y-4 p-5"
            >
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Référence
                </label>

                <input
                  required
                  disabled={!!editing}
                  value={form.reference}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      reference:
                        event.target.value,
                    })
                  }
                  placeholder="BAC-YDE2-001"
                  className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 disabled:bg-slate-50 disabled:text-slate-500"
                />
                {editing && (
                  <p className="mt-1.5 text-xs text-slate-400">
                    La référence identifie le bac auprès du capteur (ESP32) : elle ne se modifie pas.
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Capacité
                  </label>

                  <input
                    required
                    type="number"
                    min="0"
                    value={form.capacite}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        capacite:
                          event.target.value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Hauteur
                  </label>

                  <input
                    required
                    type="number"
                    min="0"
                    value={form.hauteur}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        hauteur:
                          event.target.value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Latitude
                  </label>

                  <input
                    required
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        latitude:
                          event.target.value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Longitude
                  </label>

                  <input
                    required
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        longitude:
                          event.target.value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={utiliserMaPosition}
                disabled={localisation}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 active:scale-95 disabled:opacity-60"
              >
                <LocateFixed size={15} className={localisation ? "animate-pulse" : ""} />
                {localisation ? "Localisation…" : "Utiliser ma position actuelle"}
              </button>
              <p className="-mt-2 text-xs text-slate-400">
                Utile quand le bac vient d'être installé ou déplacé : tenez-vous près du bac avec votre téléphone.
              </p>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Zone
                </label>

                <select
                  required
                  value={form.id_zone}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      id_zone:
                        event.target.value,
                    })
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
                >
                  <option value="">
                    Sélectionner
                  </option>

                  {zones.map((zone) => (
                    <option
                      key={zone.idZone}
                      value={zone.idZone}
                    >
                      {zone.nomZone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">
                  Règles de remplissage
                </p>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="rounded-xl bg-emerald-50 p-3">
                    <p className="text-xs font-bold text-emerald-700">
                      0 à 40 %
                    </p>

                    <p className="mt-1 text-xs text-emerald-600">
                      Normal
                    </p>
                  </div>

                  <div className="rounded-xl bg-orange-50 p-3">
                    <p className="text-xs font-bold text-orange-700">
                      &gt; 40 à 80 %
                    </p>

                    <p className="mt-1 text-xs text-orange-600">
                      Alerte
                    </p>
                  </div>

                  <div className="rounded-xl bg-red-50 p-3">
                    <p className="text-xs font-bold text-red-700">
                      &gt; 80 à 100 %
                    </p>

                    <p className="mt-1 text-xs text-red-600">
                      Plein
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Enregistrement..."
                  : editing
                    ? "Enregistrer les modifications"
                    : "Enregistrer le bac"}
              </button>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div className="anim-overlay fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="anim-feuille w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {selected.reference}
                </h2>

                <p className="text-xs text-slate-500">
                  Informations du bac
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelected(null)
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-2xl bg-slate-50 p-5 text-center">
                <p className="text-xs font-medium text-slate-400">
                  Niveau actuel
                </p>

                <p
                  className={`mt-1 text-5xl font-bold ${getLevelClass(
                    Number(
                      selected.niveau_remplissage ||
                        0
                    )
                  )}`}
                >
                  {Number(
                    selected.niveau_remplissage ||
                      0
                  ).toFixed(0)}
                  %
                </p>

                <span
                  className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStateClass(
                    selected.etat
                  )}`}
                >
                  {getStateLabel(
                    selected.etat
                  )}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    Zone
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-700">
                    {getZoneName(
                      selected.id_zone
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    Capacité
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-700">
                    {selected.capacite}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    Hauteur
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-700">
                    {selected.hauteur}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    Règle
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-700">
                    50% / 80%
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 p-4">
                <p className="text-xs font-medium text-slate-400">
                  Localisation
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {selected.latitude ??
                    "—"}
                  ,{" "}
                  {selected.longitude ??
                    "—"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 p-4">
                <p className="text-xs font-medium text-slate-400">
                  Interprétation du niveau
                </p>

                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      Normal
                    </span>

                    <span className="font-semibold text-slate-700">
                      0–40%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                      Alerte
                    </span>

                    <span className="font-semibold text-slate-700">
                      &gt;40–80%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      Plein
                    </span>

                    <span className="font-semibold text-slate-700">
                      &gt;80–100%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {dialogue}
    </div>
  );
}