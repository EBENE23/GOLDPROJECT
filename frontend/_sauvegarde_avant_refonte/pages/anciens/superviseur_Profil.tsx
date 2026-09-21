import { useEffect, useState } from "react";
import {
  Mail,
  Phone,
  User,
  ShieldCheck,
  MapPin,
  Save,
} from "lucide-react";

import api from "../../services/api";
import {
  getCurrentUser,
  useAuthStore,
} from "../../stores/authStore";
import AvatarPicker from "../../components/AvatarPicker";
import {
  loadUserAvatar,
  saveUserAvatar,
} from "../../utils/userPreferences";

const Profil = () => {
  const utilisateur = useAuthStore(
    (state) => state.utilisateur
  );

  const [telephone, setTelephone] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    const utilisateurActuel =
      utilisateur || getCurrentUser();

    setTelephone(
      utilisateurActuel?.telephone || ""
    );
    setAvatar(loadUserAvatar(utilisateurActuel));
  }, [utilisateur]);

  const enregistrerProfil = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");
      setError("");

      const response = await api.put(
        `/utilisateurs/${utilisateur?.idUtilisateur}`,
        {
          telephone,
        }
      );

      const utilisateurMisAJour =
        response.data?.utilisateur ||
        response.data;

      if (
        utilisateurMisAJour &&
        utilisateurMisAJour.idUtilisateur
      ) {
        const token =
          localStorage.getItem(
            "smartcitywaste_token"
          );

        if (token) {
          localStorage.setItem(
            "smartcitywaste_user",
            JSON.stringify(
              utilisateurMisAJour
            )
          );
        }

        useAuthStore
          .getState()
          .setAuthentication(
            token || "",
            utilisateurMisAJour
          );
      }

      saveUserAvatar(utilisateur || getCurrentUser(), avatar);

      setMessage(
        "Profil mis à jour avec succès."
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "Impossible de mettre à jour le profil."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!utilisateur) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
        Informations utilisateur indisponibles.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Mon profil
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Consultez vos informations personnelles.
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <AvatarPicker
              name={`${utilisateur.prenom} ${utilisateur.nom}`}
              value={avatar}
              onChange={setAvatar}
            />

            <h2 className="mt-4 text-xl font-bold text-gray-900">
              {utilisateur.prenom}{" "}
              {utilisateur.nom}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Superviseur
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
              <ShieldCheck size={14} />
              {utilisateur.statutCompte}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-6">
            <h2 className="font-semibold text-gray-900">
              Informations personnelles
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Vos informations enregistrées dans la plateforme.
            </p>
          </div>

          <form
            onSubmit={enregistrerProfil}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Nom
                </label>

                <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-3">
                  <User
                    size={17}
                    className="text-gray-400"
                  />

                  <input
                    value={utilisateur.nom}
                    disabled
                    className="w-full bg-transparent px-3 py-3 text-sm text-gray-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Prénom
                </label>

                <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-3">
                  <User
                    size={17}
                    className="text-gray-400"
                  />

                  <input
                    value={utilisateur.prenom}
                    disabled
                    className="w-full bg-transparent px-3 py-3 text-sm text-gray-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Adresse email
              </label>

              <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-3">
                <Mail
                  size={17}
                  className="text-gray-400"
                />

                <input
                  value={utilisateur.email}
                  disabled
                  className="w-full bg-transparent px-3 py-3 text-sm text-gray-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Téléphone
              </label>

              <div className="flex items-center rounded-xl border border-gray-200 bg-white px-3 focus-within:border-green-500">
                <Phone
                  size={17}
                  className="text-gray-400"
                />

                <input
                  type="tel"
                  value={telephone}
                  onChange={(event) =>
                    setTelephone(
                      event.target.value
                    )
                  }
                  placeholder="Numéro de téléphone"
                  className="w-full px-3 py-3 text-sm text-gray-700 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:opacity-50"
              >
                <Save size={17} />

                {loading
                  ? "Enregistrement..."
                  : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-blue-50 p-3">
            <MapPin
              size={20}
              className="text-blue-600"
            />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">
              Rôle dans la plateforme
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Vous êtes connecté en tant que superviseur. Votre accès est limité aux opérations de supervision de votre zone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profil;