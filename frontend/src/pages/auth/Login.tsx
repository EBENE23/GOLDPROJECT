import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    Radio,
    ShieldCheck,
    Wifi,
} from "lucide-react";

import {
    useState,
    type FormEvent,
} from "react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import {
    AnimatePresence,
    motion,
} from "framer-motion";

import api from "../../services/api";

import {
    saveAuthentication,
    type AuthUser,
} from "../../stores/authStore";
import { useTranslation } from "../../i18n";
import SelecteurLangue from "../../components/SelecteurLangue";

interface LoginResponse {
    message: string;
    token: string;
    utilisateur: AuthUser;
}

export default function Login() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [email, setEmail] =
        useState("");

    const [motDePasse, setMotDePasse] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setError("");

        if (
            !email.trim() ||
            !motDePasse
        ) {
            setError(
                t("auth.login.erreurChampsVides")
            );

            return;
        }

        try {
            setLoading(true);

            const response =
                await api.post<LoginResponse>(
                    "/auth/login",
                    {
                        email: email.trim(),
                        motDePasse,
                    }
                );

            const {
                token,
                utilisateur,
            } = response.data;

            saveAuthentication(
                token,
                utilisateur
            );

            switch (
                utilisateur.role
            ) {
                case "ADMINISTRATEUR":
                    navigate(
                        "/admin",
                        {
                            replace: true,
                        }
                    );
                    break;

                case "SUPERVISEUR":
                    navigate(
                        "/superviseur",
                        {
                            replace: true,
                        }
                    );
                    break;

                case "AGENT_COLLECTE":
                    navigate(
                        "/agent",
                        {
                            replace: true,
                        }
                    );
                    break;

                default:
                    navigate(
                        "/",
                        {
                            replace: true,
                        }
                    );
            }
        } catch (
            requestError: any
        ) {
            if (
                requestError?.response
                    ?.data?.message
            ) {
                setError(
                    requestError.response
                        .data.message
                );
            } else if (
                requestError?.response?.status === 403
            ) {
                setError(
                    requestError.response?.data?.message ||
                        t("auth.login.erreurCompteInactif")
                );
            } else if (
                requestError?.code ===
                "ECONNABORTED"
            ) {
                setError(
                    t("auth.login.erreurTimeout")
                );
            } else {
                setError(
                    t("auth.login.erreurServeur")
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="fixed inset-0 h-dvh overflow-hidden bg-slate-50">
            <div className="flex h-dvh w-full overflow-hidden">

                {/* =====================================================
                    PANNEAU GAUCHE DESKTOP
                ====================================================== */}

                <motion.section
                    initial={{
                        opacity: 0,
                        x: -35,
                    }}
                    animate={{
                        opacity: 1,
                        x: 0,
                    }}
                    transition={{
                        duration: 0.7,
                        ease: [
                            0.22,
                            1,
                            0.36,
                            1,
                        ],
                    }}
                    className="relative hidden h-full overflow-hidden bg-gradient-to-br from-emerald-900 via-slate-950 to-slate-950 lg:flex lg:w-[48%] xl:w-[52%]"
                >

                    {/* Décor haut gauche */}

                    <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-green-400/30 blur-3xl" />

                    {/* Décor bas droit */}

                    <div className="pointer-events-none absolute -bottom-40 -right-20 h-[500px] w-[500px] rounded-full bg-emerald-400/20 blur-3xl" />

                    {/* Touche de couleur froide, pour ne pas rester monochrome */}

                    <div className="pointer-events-none absolute right-10 top-1/3 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

                    {/* Cercle décoratif */}

                    <motion.div
                        animate={{
                            scale: [
                                1,
                                1.05,
                                1,
                            ],
                            opacity: [
                                0.25,
                                0.4,
                                0.25,
                            ],
                        }}
                        transition={{
                            duration: 6,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        className="pointer-events-none absolute right-[-160px] top-[25%] h-[430px] w-[430px] rounded-full border border-green-400/10"
                    />

                    <div className="relative z-10 flex h-full w-full flex-col px-8 py-7 xl:px-12">

                        {/* =================================================
                            LOGO
                        ================================================== */}

                        <motion.div
                            initial={{
                                opacity: 0,
                                y: -15,
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                            }}
                            transition={{
                                delay: 0.2,
                                duration: 0.5,
                            }}
                        >
                            <Link
                                to="/"
                                className="inline-flex items-center"
                            >
                                <img
                                    src="/images/logo.png"
                                    alt="SmartCityWaste"
                                    className="h-11 w-auto rounded-xl bg-white p-1.5 object-contain xl:h-12"
                                />
                            </Link>
                        </motion.div>

                        {/* =================================================
                            CONTENU PRINCIPAL
                        ================================================== */}

                        <div className="flex min-h-0 flex-1 items-center">
                            <div className="w-full max-w-xl">

                                <motion.div
                                    initial={{
                                        opacity: 0,
                                        y: 20,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                    }}
                                    transition={{
                                        delay: 0.3,
                                        duration: 0.65,
                                    }}
                                >
                                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-green-400/10 px-3.5 py-2 text-xs font-semibold text-green-300">
                                        <Radio size={14} />

                                        {t("auth.login.badge")}
                                    </div>

                                    <h1 className="max-w-lg text-3xl font-extrabold leading-[1.12] tracking-tight text-white xl:text-5xl">
                                        {t("auth.login.titre1")}{" "}

                                        <span className="text-green-400">
                                            {t("auth.login.titreAccent")}
                                        </span>
                                    </h1>

                                    <p className="mt-5 max-w-lg text-sm leading-7 text-slate-400 xl:text-base">
                                        {t("auth.login.paragraphe")}
                                    </p>
                                </motion.div>

                                {/* =================================================
                                    CARTE ILLUSTRATION
                                ================================================== */}

                                <motion.div
                                    initial={{
                                        opacity: 0,
                                        scale: 0.96,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        scale: 1,
                                    }}
                                    transition={{
                                        delay: 0.48,
                                        duration: 0.7,
                                    }}
                                    className="mt-7 hidden h-[150px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5 xl:block"
                                >
                                    <div className="relative h-full w-full">

                                        <img
                                            src="/images/bac-connecte.png"
                                            alt={t("commun.bacConnecteAlt")}
                                            className="absolute inset-0 h-full w-full object-cover opacity-80"
                                        />

                                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/20 to-slate-950/50" />

                                        <div className="absolute bottom-4 left-4">

                                            <p className="text-[10px] text-slate-400">
                                                {t("auth.login.carteLabel")}
                                            </p>

                                            <p className="mt-1 text-sm font-bold text-white">
                                                SmartCityWaste
                                            </p>

                                        </div>

                                        <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-green-400/20 bg-slate-950/70 px-3 py-1.5 text-[10px] font-semibold text-green-300 backdrop-blur">

                                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />

                                            {t("auth.login.carteConnecte")}

                                        </div>

                                    </div>
                                </motion.div>

                                {/* =================================================
                                    AVANTAGES
                                ================================================== */}

                                <motion.div
                                    initial={{
                                        opacity: 0,
                                        y: 15,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                    }}
                                    transition={{
                                        delay: 0.65,
                                        duration: 0.6,
                                    }}
                                    className="mt-5 grid grid-cols-3 gap-2.5"
                                >

                                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">

                                        <Wifi
                                            size={17}
                                            className="text-green-400"
                                        />

                                        <p className="mt-2 text-[10px] font-medium leading-4 text-slate-300">
                                            {t("auth.login.avantage1")}
                                        </p>

                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">

                                        <ShieldCheck
                                            size={17}
                                            className="text-green-400"
                                        />

                                        <p className="mt-2 text-[10px] font-medium leading-4 text-slate-300">
                                            {t("auth.login.avantage2")}
                                        </p>

                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">

                                        <CheckCircle2
                                            size={17}
                                            className="text-green-400"
                                        />

                                        <p className="mt-2 text-[10px] font-medium leading-4 text-slate-300">
                                            {t("auth.login.avantage3")}
                                        </p>

                                    </div>

                                </motion.div>

                            </div>
                        </div>

                        {/* =================================================
                            FOOTER GAUCHE
                        ================================================== */}

                        <p className="shrink-0 text-[10px] text-slate-600">
                            {t("auth.login.footer")}
                        </p>

                    </div>
                </motion.section>

                {/* =====================================================
                    PANNEAU DROIT
                ====================================================== */}

                <section className="relative flex h-full w-full items-center justify-center overflow-hidden bg-white px-5 py-5 sm:px-8 lg:w-[52%] xl:w-[48%]">

                    {/* Décoration */}

                    <div className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-green-200/70 blur-3xl" />

                    <div className="pointer-events-none absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-emerald-100/80 blur-3xl" />

                    {/* =================================================
                        BOUTON RETOUR + LANGUE
                    ================================================== */}

                    <motion.div
                        initial={{
                            opacity: 0,
                            x: 20,
                        }}
                        animate={{
                            opacity: 1,
                            x: 0,
                        }}
                        transition={{
                            delay: 0.15,
                            duration: 0.5,
                        }}
                        className="absolute left-5 top-5 z-20 flex items-center gap-2 sm:left-8 sm:top-8"
                    >
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 shadow-sm transition-all hover:-translate-x-0.5 hover:border-green-200 hover:text-green-700 sm:px-4 sm:py-2.5 sm:text-sm"
                        >
                            <ArrowLeft size={16} />

                            <span className="hidden sm:inline">
                                {t("auth.login.retourAccueil")}
                            </span>

                            <span className="sm:hidden">
                                {t("auth.login.retourCourt")}
                            </span>
                        </Link>

                        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                            <SelecteurLangue />
                        </div>
                    </motion.div>

                    {/* =================================================
                        FORMULAIRE
                    ================================================== */}

                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 25,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        transition={{
                            delay: 0.25,
                            duration: 0.65,
                            ease: [
                                0.22,
                                1,
                                0.36,
                                1,
                            ],
                        }}
                        className="relative z-10 w-full max-w-[440px]"
                    >

                        {/* Logo mobile */}

                        <div className="mb-4 flex justify-center lg:hidden">
                            <img
                                src="/images/logo.png"
                                alt="SmartCityWaste"
                                className="h-11 w-auto object-contain"
                            />
                        </div>

                        {/* Titre */}

                        <div className="mb-6 text-center sm:mb-7">

                            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                                <LockKeyhole
                                    size={21}
                                />
                            </div>

                            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                {t("auth.login.bienvenue")}
                            </h2>

                            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                                {t("auth.login.sousTitre")}
                            </p>

                        </div>

                        {/* =================================================
                            FORM
                        ================================================== */}

                        <form
                            onSubmit={
                                handleSubmit
                            }
                            noValidate
                            className="space-y-4"
                        >

                            {/* EMAIL */}

                            <div>

                                <label
                                    htmlFor="email"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    {t("auth.login.emailLabel")}
                                </label>

                                <div className="relative">

                                    <Mail
                                        size={18}
                                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        value={
                                            email
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setEmail(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder={t("auth.login.emailPlaceholder")}
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
                                    />

                                </div>

                            </div>

                            {/* MOT DE PASSE */}

                            <div>

                                <div className="mb-2 flex items-center justify-between">

                                    <label
                                        htmlFor="password"
                                        className="block text-sm font-semibold text-slate-700"
                                    >
                                        {t("auth.login.motDePasseLabel")}
                                    </label>

                                    <span className="text-[10px] font-medium text-slate-400 sm:text-xs">
                                        {t("auth.login.jwtBadge")}
                                    </span>

                                </div>

                                <div className="relative">

                                    <LockKeyhole
                                        size={18}
                                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                    <input
                                        id="password"
                                        name="password"
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        autoComplete="current-password"
                                        value={
                                            motDePasse
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setMotDePasse(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder={t("auth.login.motDePassePlaceholder")}
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(
                                                (
                                                    value
                                                ) =>
                                                    !value
                                            )
                                        }
                                        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                        aria-label={
                                            showPassword
                                                ? t("auth.login.masquerMotDePasse")
                                                : t("auth.login.afficherMotDePasse")
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff
                                                size={
                                                    18
                                                }
                                            />
                                        ) : (
                                            <Eye
                                                size={
                                                    18
                                                }
                                            />
                                        )}
                                    </button>

                                </div>

                            </div>

                            {/* ERREUR */}

                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div
                                        initial={{
                                            opacity: 0,
                                            height: 0,
                                            y: -5,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            height: "auto",
                                            y: 0,
                                        }}
                                        exit={{
                                            opacity: 0,
                                            height: 0,
                                            y: -5,
                                        }}
                                        className="overflow-hidden"
                                    >
                                        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-medium leading-5 text-red-600">
                                            {
                                                error
                                            }
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* BOUTON */}

                            <motion.button
                                type="submit"
                                disabled={
                                    loading
                                }
                                whileHover={
                                    !loading
                                        ? {
                                              y: -2,
                                          }
                                        : {}
                                }
                                whileTap={
                                    !loading
                                        ? {
                                              scale: 0.98,
                                          }
                                        : {}
                                }
                                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-bold text-white shadow-xl shadow-green-600/20 transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >

                                {loading ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                                        {t("auth.login.connexionEnCours")}
                                    </>
                                ) : (
                                    <>
                                        {t("auth.login.seConnecter")}

                                        <ArrowRight
                                            size={
                                                18
                                            }
                                        />
                                    </>
                                )}

                            </motion.button>

                        </form>

                        {/* =================================================
                            INSCRIPTION
                        ================================================== */}

                        <div className="mt-5 text-center">

                            <p className="text-sm text-slate-500">
                                {t("auth.login.pasDeCompte")}
                            </p>

                            <Link
                                to="/register"
                                className="mt-1 inline-block text-sm font-bold text-green-600 transition-colors hover:text-green-700"
                            >
                                {t("auth.login.creerCompte")}
                            </Link>

                        </div>

                        {/* =================================================
                            SÉCURITÉ
                        ================================================== */}

                        <div className="mt-5 flex items-center justify-center gap-2 text-center text-[10px] leading-4 text-slate-400 sm:text-xs">

                            <ShieldCheck
                                size={14}
                                className="shrink-0 text-green-500"
                            />

                            <span>
                                {t("auth.login.securite")}
                            </span>

                        </div>

                    </motion.div>
                </section>
            </div>
        </main>
    );
}