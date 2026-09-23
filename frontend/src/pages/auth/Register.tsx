import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Camera,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  User,
  UserRoundPlus,
  ShieldCheck,
  BriefcaseBusiness,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { preparerPhotoProfil } from "../../utils/imageProfil";

type FormData = {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  motDePasse: string;
  confirmationMotDePasse: string;
  roleDemande: "SUPERVISEUR" | "AGENT_COLLECTE" | "";
  photoProfil: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const initialForm: FormData = {
  nom: "",
  prenom: "",
  telephone: "",
  email: "",
  motDePasse: "",
  confirmationMotDePasse: "",
  roleDemande: "",
  photoProfil: "",
};

/**
 * Autorise :
 * - lettres latines
 * - lettres accentuées
 * - espaces
 * - apostrophes
 * - traits d'union
 *
 * Refuse donc :
 * - 123
 * - Jean123
 * - caractères spéciaux incohérents
 */
const nameRegex =
  /^[A-Za-zÀ-ÖØ-öø-ÿĀ-žḀ-ỿ]+(?:[ '-][A-Za-zÀ-ÖØ-öø-ÿĀ-žḀ-ỿ]+)*$/;

const phoneRegex = /^(?:\+237\s?)?[26]\d{8}$/;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeName(value: string) {
  return value
    .replace(/\s{2,}/g, " ")
    .replace(/-{2,}/g, "-")
    .replace(/'{2,}/g, "'")
    .trimStart();
}

function validateName(value: string, label: string) {
  const cleanValue = value.trim();

  if (!cleanValue) {
    return `${label} est obligatoire.`;
  }

  if (cleanValue.length < 2) {
    return `${label} doit contenir au moins 2 caractères.`;
  }

  if (cleanValue.length > 50) {
    return `${label} ne doit pas dépasser 50 caractères.`;
  }

  if (!nameRegex.test(cleanValue)) {
    return `${label} contient des caractères invalides.`;
  }

  return "";
}

function validateStepOne(form: FormData): FormErrors {
  const errors: FormErrors = {};

  const nomError = validateName(form.nom, "Le nom");
  const prenomError = validateName(form.prenom, "Le prénom");

  if (nomError) {
    errors.nom = nomError;
  }

  if (prenomError) {
    errors.prenom = prenomError;
  }

  const telephone = form.telephone.replace(/\s/g, "");

  if (!telephone) {
    errors.telephone = "Le numéro de téléphone est obligatoire.";
  } else if (!phoneRegex.test(telephone)) {
    errors.telephone =
      "Entrez un numéro camerounais valide, par exemple 6XXXXXXXX ou +237 6XXXXXXXX.";
  }

  return errors;
}

function validateStepTwo(form: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!form.email.trim()) {
    errors.email = "L'adresse e-mail est obligatoire.";
  } else if (!emailRegex.test(form.email.trim())) {
    errors.email = "Veuillez saisir une adresse e-mail valide.";
  }

  if (!form.motDePasse) {
    errors.motDePasse = "Le mot de passe est obligatoire.";
  } else if (form.motDePasse.length < 8) {
    errors.motDePasse =
      "Le mot de passe doit contenir au moins 8 caractères.";
  }

  if (!form.confirmationMotDePasse) {
    errors.confirmationMotDePasse =
      "Veuillez confirmer votre mot de passe.";
  } else if (form.motDePasse !== form.confirmationMotDePasse) {
    errors.confirmationMotDePasse =
      "Les deux mots de passe ne correspondent pas.";
  }

  return errors;
}

function validateStepThree(form: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!form.roleDemande) {
    errors.roleDemande = "Veuillez sélectionner un type de compte.";
  }

  return errors;
}

const slideVariants = {
  initial: {
    opacity: 0,
    x: 25,
  },
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: -25,
  },
};

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const progress = useMemo(() => {
    return (step / 3) * 100;
  }, [step]);

  const updateField = (field: keyof FormData, value: string) => {
    let nextValue = value;

    if (field === "nom" || field === "prenom") {
      nextValue = normalizeName(value);

      /*
       * On bloque immédiatement les chiffres et caractères
       * manifestement invalides à la saisie.
       *
       * On laisse toutefois l'utilisateur taper progressivement
       * son nom sans rendre le champ agressif.
       */
      nextValue = nextValue.replace(
        /[^A-Za-zÀ-ÖØ-öø-ÿĀ-žḀ-ỿ' -]/g,
        ""
      );
    }

    if (field === "telephone") {
      nextValue = value.replace(/[^\d+\s]/g, "");
    }

    setForm((previous) => ({
      ...previous,
      [field]: nextValue,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: undefined,
    }));

    setServerError("");
  };

  const handleNext = () => {
    let validationErrors: FormErrors = {};

    if (step === 1) {
      validationErrors = validateStepOne(form);
    }

    if (step === 2) {
      validationErrors = validateStepTwo(form);
    }

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setStep((previous) => Math.min(previous + 1, 3));
  };

  const handlePrevious = () => {
    setErrors({});
    setServerError("");
    setStep((previous) => Math.max(previous - 1, 1));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateStepThree(form);

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setLoading(true);
    setServerError("");

    try {
      await api.post("/demandes-inscription", {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        email: form.email.trim().toLowerCase(),
        motDePasse: form.motDePasse,
        telephone: form.telephone.replace(/\s/g, ""),
        roleDemande: form.roleDemande,
        photoProfil: form.photoProfil,
      });

      setSuccess(true);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        (error?.code === "ERR_NETWORK"
          ? "Le serveur est inaccessible. Vérifiez que l'API backend est démarrée."
          : error?.response?.status === 413
            ? "La photo ou les données envoyées sont trop volumineuses."
            : error?.response?.status === 500
              ? "Le serveur n'a pas pu créer la demande. Vérifiez la configuration de la base de données."
              : "Impossible d'envoyer votre demande pour le moment.");

      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="fixed inset-0 h-dvh w-full overflow-hidden bg-gradient-to-br from-emerald-900 via-slate-950 to-slate-950">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-green-400/25 blur-3xl" />
          <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute right-1/4 top-1/3 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        <div className="relative flex h-full w-full items-center justify-center px-5 py-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-lg"
          >
            <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-7 text-center shadow-2xl backdrop-blur-2xl sm:p-10">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-400/20">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500">
                  <Check className="h-6 w-6 text-white" strokeWidth={2.5} />
                </div>
              </div>

              <h1 className="font-poppins text-2xl font-bold text-white sm:text-3xl">
                Demande envoyée
              </h1>

              <p className="mx-auto mt-4 max-w-md font-poppins text-sm leading-6 text-slate-300 sm:text-base">
                Votre demande de création de compte a bien été enregistrée.
                Elle doit maintenant être examinée et approuvée par un
                administrateur.
              </p>

              <div className="mt-7 rounded-2xl border border-emerald-400/10 bg-emerald-500/5 p-4 text-left">
                <p className="font-poppins text-xs leading-5 text-slate-300 sm:text-sm">
                  Vous pourrez accéder à la plateforme une fois votre compte
                  approuvé et activé.
                </p>
              </div>

              <Link
                to="/login"
                className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 font-poppins text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
              >
                Retour à la connexion
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 h-dvh w-full overflow-hidden bg-gradient-to-br from-emerald-900 via-slate-950 to-slate-950 font-poppins">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-green-400/25 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex h-full w-full max-w-[1500px] flex-col px-4 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-5">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between">
          <Link
            to="/login"
            aria-label="Retour à la connexion"
            className="group flex h-10 items-center gap-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.05] px-2.5 text-slate-300 backdrop-blur-xl transition-all duration-300 hover:w-[105px] hover:border-emerald-400/20 hover:bg-emerald-500/10 hover:text-white sm:h-11 sm:px-3"
          >
            <ArrowLeft className="h-[18px] w-[18px] shrink-0 transition-transform duration-300 group-hover:-translate-x-0.5" />

            <span className="ml-0 max-w-0 overflow-hidden whitespace-nowrap font-poppins text-sm font-medium opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:max-w-[60px] group-hover:opacity-100">
              Retour
            </span>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2"
            aria-label="SmartCityWaste"
          >
            <img
              src="/images/logo.png"
              alt="SmartCityWaste"
              className="h-9 w-9 object-contain sm:h-10 sm:w-10"
            />

            <div className="hidden leading-tight sm:block">
              <p className="text-sm font-bold text-white">
                SmartCity<span className="text-emerald-400">Waste</span>
              </p>
              <p className="text-[9px] text-slate-400">
                Gestion intelligente
              </p>
            </div>
          </Link>
        </header>

        {/* Main */}
        <div className="flex min-h-0 flex-1 items-center justify-center py-3 sm:py-4">
          <div className="grid w-full max-w-6xl min-h-0 grid-cols-1 items-center gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
            {/* Left presentation - desktop */}
            <section className="hidden lg:block">
              <motion.div
                initial={{ opacity: 0, x: -25 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.55 }}
              >
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/10 bg-emerald-500/5 px-3 py-1.5">
                  <UserRoundPlus className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-300">
                    Création de compte
                  </span>
                </div>

                <h1 className="max-w-xl text-3xl font-bold leading-tight text-white xl:text-4xl">
                  Rejoignez la plateforme{" "}
                  <span className="text-emerald-400">
                    SmartCityWaste
                  </span>
                </h1>

                <p className="mt-4 max-w-lg text-sm leading-6 text-slate-400">
                  Créez votre demande de compte pour participer à la
                  supervision intelligente des bacs à déchets et au suivi des
                  interventions.
                </p>

                <div className="mt-7 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Accès sécurisé
                      </p>
                      <p className="text-xs text-slate-500">
                        Votre compte est validé par un administrateur.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                      <BriefcaseBusiness className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Un rôle adapté
                      </p>
                      <p className="text-xs text-slate-500">
                        Superviseur ou agent de collecte.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* Form card */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mx-auto flex w-full min-h-0 max-w-xl flex-col"
            >
              <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur-2xl sm:rounded-[28px] sm:p-5 md:p-6">
                {/* Title */}
                <div className="mb-4 sm:mb-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400 sm:text-xs">
                    Étape {step} sur 3
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                    {step === 1 && "Vos informations"}
                    {step === 2 && "Sécurisez votre compte"}
                    {step === 3 && "Choisissez votre rôle"}
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
                    {step === 1 &&
                      "Renseignez vos informations personnelles."}
                    {step === 2 &&
                      "Utilisez une adresse e-mail et un mot de passe sécurisés."}
                    {step === 3 &&
                      "Sélectionnez le type de compte correspondant à votre fonction."}
                  </p>
                </div>

                {/* Progress */}
                <div className="mb-5">
                  <div className="mb-2 flex items-center justify-between text-[10px] text-slate-500 sm:text-xs">
                    <span>Progression</span>
                    <span>{Math.round(progress)}%</span>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-emerald-500"
                      initial={false}
                      animate={{ width: `${progress}%` }}
                      transition={{
                        duration: 0.35,
                        ease: "easeOut",
                      }}
                    />
                  </div>

                  <div className="mt-2 flex justify-between">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className={`flex items-center gap-1 text-[10px] sm:text-xs ${
                          item <= step
                            ? "text-emerald-400"
                            : "text-slate-600"
                        }`}
                      >
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${
                            item < step
                              ? "bg-emerald-500 text-white"
                              : item === step
                                ? "bg-emerald-500/15 ring-1 ring-emerald-400/30"
                                : "bg-white/5"
                          }`}
                        >
                          {item < step ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            item
                          )}
                        </div>

                        <span className="hidden sm:inline">
                          {item === 1 && "Identité"}
                          {item === 2 && "Sécurité"}
                          {item === 3 && "Rôle"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Server error */}
                <AnimatePresence>
                  {serverError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -5 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 overflow-hidden rounded-xl border border-red-400/10 bg-red-500/10 px-3 py-2.5"
                    >
                      <p className="text-xs leading-5 text-red-300">
                        {serverError}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <form
                  onSubmit={
                    step === 3
                      ? handleSubmit
                      : (event) => {
                          event.preventDefault();
                          handleNext();
                        }
                  }
                >
                  <div className="min-h-0">
                    <AnimatePresence mode="wait">
                      {/* STEP 1 */}
                      {step === 1 && (
                        <motion.div
                          key="step-1"
                          variants={slideVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          transition={{ duration: 0.22 }}
                          className="space-y-3"
                        >
                          <InputField
                            label="Nom"
                            placeholder="Votre nom"
                            value={form.nom}
                            onChange={(value) =>
                              updateField("nom", value)
                            }
                            icon={<User className="h-4 w-4" />}
                            error={errors.nom}
                            autoComplete="family-name"
                          />

                          <InputField
                            label="Prénom"
                            placeholder="Votre prénom"
                            value={form.prenom}
                            onChange={(value) =>
                              updateField("prenom", value)
                            }
                            icon={<User className="h-4 w-4" />}
                            error={errors.prenom}
                            autoComplete="given-name"
                          />

                          <InputField
                            label="Téléphone"
                            placeholder="6 XX XX XX XX"
                            value={form.telephone}
                            onChange={(value) =>
                              updateField("telephone", value)
                            }
                            icon={<Phone className="h-4 w-4" />}
                            error={errors.telephone}
                            autoComplete="tel"
                            inputMode="tel"
                          />
                          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">
                            {form.photoProfil ? (
                              <img src={form.photoProfil} alt="Aperçu" className="h-12 w-12 rounded-full object-cover" />
                            ) : (
                              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400"><Camera size={18} /></span>
                            )}
                            <span><strong className="block text-slate-700">Photo de profil <em className="font-normal not-italic text-slate-400">(facultatif)</em></strong><span>JPG ou PNG, aperçu uniquement avant l'envoi.</span></span>
                            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; try { updateField("photoProfil", await preparerPhotoProfil(file)); setServerError(""); } catch (err) { setServerError(err instanceof Error ? err.message : "Image invalide."); } }} />
                          </label>
                        </motion.div>
                      )}

                      {/* STEP 2 */}
                      {step === 2 && (
                        <motion.div
                          key="step-2"
                          variants={slideVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          transition={{ duration: 0.22 }}
                          className="space-y-3"
                        >
                          <InputField
                            label="Adresse e-mail"
                            placeholder="exemple@email.com"
                            value={form.email}
                            onChange={(value) =>
                              updateField("email", value)
                            }
                            icon={<Mail className="h-4 w-4" />}
                            error={errors.email}
                            autoComplete="email"
                            inputMode="email"
                          />

                          <PasswordField
                            label="Mot de passe"
                            placeholder="Minimum 8 caractères"
                            value={form.motDePasse}
                            onChange={(value) =>
                              updateField("motDePasse", value)
                            }
                            visible={showPassword}
                            onToggle={() =>
                              setShowPassword((previous) => !previous)
                            }
                            error={errors.motDePasse}
                          />

                          <PasswordField
                            label="Confirmation"
                            placeholder="Confirmez votre mot de passe"
                            value={form.confirmationMotDePasse}
                            onChange={(value) =>
                              updateField(
                                "confirmationMotDePasse",
                                value
                              )
                            }
                            visible={showConfirmation}
                            onToggle={() =>
                              setShowConfirmation((previous) => !previous)
                            }
                            error={errors.confirmationMotDePasse}
                          />

                          <div className="flex items-center gap-2 pt-1">
                            <LockKeyhole className="h-3.5 w-3.5 text-emerald-400" />
                            <p className="text-[10px] leading-4 text-slate-500 sm:text-xs">
                              Votre mot de passe doit contenir au moins 8
                              caractères.
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {/* STEP 3 */}
                      {step === 3 && (
                        <motion.div
                          key="step-3"
                          variants={slideVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          transition={{ duration: 0.22 }}
                          className="space-y-3"
                        >
                          <RoleCard
                            selected={form.roleDemande === "SUPERVISEUR"}
                            title="Superviseur"
                            description="Superviser les bacs, suivre les alertes et organiser les interventions."
                            icon={<ShieldCheck className="h-5 w-5" />}
                            onClick={() =>
                              updateField(
                                "roleDemande",
                                "SUPERVISEUR"
                              )
                            }
                          />

                          <RoleCard
                            selected={
                              form.roleDemande === "AGENT_COLLECTE"
                            }
                            title="Agent de collecte"
                            description="Consulter et exécuter les missions de collecte qui vous sont affectées."
                            icon={
                              <BriefcaseBusiness className="h-5 w-5" />
                            }
                            onClick={() =>
                              updateField(
                                "roleDemande",
                                "AGENT_COLLECTE"
                              )
                            }
                          />

                          {errors.roleDemande && (
                            <p className="px-1 text-xs text-red-400">
                              {errors.roleDemande}
                            </p>
                          )}

                          {/* Recap */}
                          <div className="mt-2 rounded-xl border border-white/8 bg-black/10 p-3 sm:p-3.5">
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                              Récapitulatif
                            </p>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                              <SummaryItem
                                label="Nom"
                                value={`${form.prenom} ${form.nom}`}
                              />

                              <SummaryItem
                                label="Téléphone"
                                value={form.telephone}
                              />

                              <SummaryItem
                                label="E-mail"
                                value={form.email}
                              />

                              <SummaryItem
                                label="Compte"
                                value={
                                  form.roleDemande === "SUPERVISEUR"
                                    ? "Superviseur"
                                    : form.roleDemande === "AGENT_COLLECTE"
                                      ? "Agent"
                                      : "Non sélectionné"
                                }
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Buttons */}
                  <div className="mt-5 flex items-center justify-between gap-3">
                    {step > 1 ? (
                      <button
                        type="button"
                        onClick={handlePrevious}
                        className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white sm:h-11 sm:px-4 sm:text-sm"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Précédent</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    {step < 3 ? (
                      <button
                        type="submit"
                        className="ml-auto flex h-10 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-semibold text-white shadow-lg shadow-emerald-500/15 transition hover:bg-emerald-400 sm:h-11 sm:px-5 sm:text-sm"
                      >
                        Continuer
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={loading}
                        className="ml-auto flex h-10 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-semibold text-white shadow-lg shadow-emerald-500/15 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:px-5 sm:text-sm"
                      >
                        {loading ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Envoi...
                          </>
                        ) : (
                          <>
                            Envoyer la demande
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </form>

                {/* Login */}
                <div className="mt-4 border-t border-white/5 pt-3 text-center">
                  <p className="text-[11px] text-slate-500 sm:text-xs">
                    Vous avez déjà un compte ?{" "}
                    <Link
                      to="/login"
                      className="font-semibold text-emerald-400 transition hover:text-emerald-300"
                    >
                      Se connecter
                    </Link>
                  </p>
                </div>
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </main>
  );
}

type InputFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  error?: string;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "numeric";
};

function InputField({
  label,
  placeholder,
  value,
  onChange,
  icon,
  error,
  autoComplete,
  inputMode = "text",
}: InputFieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-300 sm:text-sm">
        {label}
      </label>

      <div
        className={`group flex h-11 items-center rounded-xl border bg-white/[0.04] px-3 transition sm:h-12 ${
          error
            ? "border-red-400/40 focus-within:border-red-400"
            : "border-white/10 focus-within:border-emerald-400/40"
        }`}
      >
        <span
          className={`mr-2.5 transition ${
            error
              ? "text-red-400"
              : "text-slate-500 group-focus-within:text-emerald-400"
          }`}
        >
          {icon}
        </span>

        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          inputMode={inputMode}
          className="h-full min-w-0 flex-1 bg-transparent font-poppins text-sm text-white outline-none placeholder:text-slate-600"
        />
      </div>

      {error && (
        <p className="mt-1.5 px-1 text-[10px] leading-4 text-red-400 sm:text-xs">
          {error}
        </p>
      )}
    </div>
  );
}

type PasswordFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  error?: string;
};

function PasswordField({
  label,
  placeholder,
  value,
  onChange,
  visible,
  onToggle,
  error,
}: PasswordFieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-300 sm:text-sm">
        {label}
      </label>

      <div
        className={`group flex h-11 items-center rounded-xl border bg-white/[0.04] px-3 transition sm:h-12 ${
          error
            ? "border-red-400/40"
            : "border-white/10 focus-within:border-emerald-400/40"
        }`}
      >
        <LockKeyhole
          className={`mr-2.5 h-4 w-4 transition ${
            error
              ? "text-red-400"
              : "text-slate-500 group-focus-within:text-emerald-400"
          }`}
        />

        <input
          type={visible ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="new-password"
          className="h-full min-w-0 flex-1 bg-transparent font-poppins text-sm text-white outline-none placeholder:text-slate-600"
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/5 hover:text-slate-200"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      {error && (
        <p className="mt-1.5 px-1 text-[10px] leading-4 text-red-400 sm:text-xs">
          {error}
        </p>
      )}
    </div>
  );
}

type RoleCardProps = {
  selected: boolean;
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
};

function RoleCard({
  selected,
  title,
  description,
  icon,
  onClick,
}: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 sm:p-3.5 ${
        selected
          ? "border-emerald-400/40 bg-emerald-500/10 shadow-lg shadow-emerald-500/5"
          : "border-white/10 bg-white/[0.03] hover:border-emerald-400/20 hover:bg-white/[0.05]"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
          selected
            ? "bg-emerald-500 text-white"
            : "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/15"
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-white">
            {title}
          </h3>

          <div
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
              selected
                ? "border-emerald-400 bg-emerald-500"
                : "border-slate-600"
            }`}
          >
            {selected && <Check className="h-2.5 w-2.5 text-white" />}
          </div>
        </div>

        <p className="mt-0.5 text-[10px] leading-4 text-slate-500 sm:text-xs sm:leading-5">
          {description}
        </p>
      </div>
    </button>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] uppercase tracking-wide text-slate-600">
        {label}
      </p>

      <p className="mt-0.5 truncate text-[10px] font-medium text-slate-300 sm:text-xs">
        {value || "—"}
      </p>
    </div>
  );
}