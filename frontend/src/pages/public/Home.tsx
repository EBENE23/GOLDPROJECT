import {
    Activity,
    ArrowRight,
    CheckCircle2,
    Cpu,
    Database,
    Gauge,
    Globe2,
    MapPinned,
    Radio,
    Route,
    Server,
    ShieldCheck,
    Smartphone,
    Truck,
    Wifi,
    Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
    motion,
    useScroll,
    useTransform,
} from "framer-motion";

import ScrollReveal from "../../components/ScrollReveal";
import SectionTitle from "../../components/SectionTitle";
import Badge from "../../components/ui/Badge";
import { BandeauAgent, BandeauEquipe, SectionCycle, SectionRoles } from "./SectionsAccueil";
import { useTranslation } from "../../i18n";

export default function Home() {
    const { t } = useTranslation();

    const features = [
        {
            icon: Activity,
            title: t("home.fonctionnalites.item1Titre"),
            description: t("home.fonctionnalites.item1Desc"),
            variant: "green" as const,
        },
        {
            icon: MapPinned,
            title: t("home.fonctionnalites.item2Titre"),
            description: t("home.fonctionnalites.item2Desc"),
            variant: "blue" as const,
        },
        {
            icon: Route,
            title: t("home.fonctionnalites.item3Titre"),
            description: t("home.fonctionnalites.item3Desc"),
            variant: "orange" as const,
        },
        {
            icon: Truck,
            title: t("home.fonctionnalites.item4Titre"),
            description: t("home.fonctionnalites.item4Desc"),
            variant: "slate" as const,
        },
    ];

    const steps = [
        {
            number: "01",
            icon: Gauge,
            title: t("home.fonctionnement.etape1Titre"),
            description: t("home.fonctionnement.etape1Texte"),
        },
        {
            number: "02",
            icon: Cpu,
            title: t("home.fonctionnement.etape2Titre"),
            description: t("home.fonctionnement.etape2Texte"),
        },
        {
            number: "03",
            icon: Server,
            title: t("home.fonctionnement.etape3Titre"),
            description: t("home.fonctionnement.etape3Texte"),
        },
        {
            number: "04",
            icon: Smartphone,
            title: t("home.fonctionnement.etape4Titre"),
            description: t("home.fonctionnement.etape4Texte"),
        },
    ];

    const technologies = [
        {
            icon: Cpu,
            name: "ESP32",
            description: t("home.technologies.esp32"),
        },
        {
            icon: Radio,
            name: "MQTT",
            description: t("home.technologies.mqtt"),
        },
        {
            icon: Server,
            name: "Node.js",
            description: t("home.technologies.node"),
        },
        {
            icon: Database,
            name: "MySQL",
            description: t("home.technologies.mysql"),
        },
        {
            icon: Globe2,
            name: "React",
            description: t("home.technologies.react"),
        },
    ];

    const { scrollYProgress } =
        useScroll();

    const heroY = useTransform(
        scrollYProgress,
        [0, 0.2],
        [0, -60]
    );

    const heroOpacity = useTransform(
        scrollYProgress,
        [0, 0.15],
        [1, 0]
    );

    return (
        <div className="overflow-hidden">
            {/* =====================================================
                HERO
            ====================================================== */}
            <section
                id="accueil"
                className="relative min-h-[680px] bg-gradient-to-b from-green-50 via-white to-white pt-28 sm:min-h-[720px] sm:pt-36"
            >
                <div className="pointer-events-none absolute left-[-180px] top-[100px] h-[380px] w-[380px] rounded-full bg-green-200/30 blur-3xl" />

                <div className="pointer-events-none absolute right-[-180px] top-[180px] h-[420px] w-[420px] rounded-full bg-emerald-100/40 blur-3xl" />

                <motion.div
                    style={{
                        y: heroY,
                        opacity: heroOpacity,
                    }}
                    className="container-app relative"
                >
                    <div className="grid items-center gap-14 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-28">
                        {/* HERO GAUCHE */}
                        <div>
                            <ScrollReveal direction="right">
                                <Badge variant="green">
                                    <Zap
                                        size={13}
                                        className="mr-1.5"
                                    />
                                    {t("home.hero.badge")}
                                </Badge>
                            </ScrollReveal>

                            <ScrollReveal
                                direction="right"
                                delay={0.1}
                            >
                                <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                                    {t("home.hero.titre1")}{" "}
                                    <span className="text-green-600">
                                        {t("home.hero.titreAccent")}
                                    </span>
                                </h1>
                            </ScrollReveal>

                            <ScrollReveal
                                direction="right"
                                delay={0.18}
                            >
                                <p className="mt-6 max-w-xl text-base leading-8 text-slate-500 sm:text-lg">
                                    {t("home.hero.description")}
                                </p>
                            </ScrollReveal>

                            <ScrollReveal
                                direction="right"
                                delay={0.26}
                            >
                                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                    {/* DECOUVRIR -> LOGIN */}
                                    <Link
                                        to="/register"
                                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-green-600/20 transition-all hover:-translate-y-1 hover:bg-green-700"
                                    >
                                        {t("home.hero.ctaPrimaire")}
                                        <ArrowRight size={18} />
                                    </Link>

                                    <a
                                        href="#fonctionnement"
                                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-green-200 hover:text-green-700"
                                    >
                                        {t("home.hero.ctaSecondaire")}
                                    </a>
                                </div>
                            </ScrollReveal>

                            <ScrollReveal
                                direction="right"
                                delay={0.34}
                            >
                                <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3">
                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 sm:text-sm">
                                        <CheckCircle2
                                            size={17}
                                            className="text-green-600"
                                        />
                                        {t("home.hero.check1")}
                                    </div>

                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 sm:text-sm">
                                        <CheckCircle2
                                            size={17}
                                            className="text-green-600"
                                        />
                                        {t("home.hero.check2")}
                                    </div>

                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 sm:text-sm">
                                        <CheckCircle2
                                            size={17}
                                            className="text-green-600"
                                        />
                                        {t("home.hero.check3")}
                                    </div>
                                </div>
                            </ScrollReveal>
                        </div>

                        {/* HERO DROITE */}
                        <ScrollReveal
                            direction="left"
                            delay={0.15}
                        >
                            <div className="relative mx-auto w-full max-w-[520px]">
                                <motion.div
                                    animate={{
                                        y: [0, -10, 0],
                                    }}
                                    transition={{
                                        duration: 5,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                    className="relative"
                                >
                                    <div className="absolute inset-10 rounded-full bg-green-300/30 blur-3xl" />

                                    <div className="relative overflow-visible rounded-[2rem] border border-white bg-white p-4 shadow-2xl shadow-green-900/10 sm:p-6">
                                        <div className="mb-5 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-medium text-slate-400">
                                                    SmartCityWaste
                                                </p>

                                                <p className="mt-1 text-sm font-bold text-slate-800">
                                                    {t("home.hero.carteBac")}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                                                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                                                {t("home.hero.carteConnecte")}
                                            </div>
                                        </div>

                                        <div className="relative min-h-[340px] overflow-hidden rounded-3xl bg-gradient-to-br from-green-50 to-slate-100">
                                            <img
                                                src="/images/bac-connecte.png"
                                                alt={t("commun.bacConnecteAlt")}
                                                className="absolute inset-0 z-0 h-full w-full object-cover"
                                            />

                                            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-slate-950/10 via-transparent to-white/5" />

                                            {/* WIFI */}
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    x: -15,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    x: 0,
                                                }}
                                                transition={{
                                                    delay: 0.7,
                                                    duration: 0.6,
                                                }}
                                                className="absolute left-4 top-4 z-20 rounded-2xl border border-white/70 bg-white/95 p-2.5 shadow-xl shadow-slate-900/10 backdrop-blur-md sm:left-5 sm:top-5 sm:p-3"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-600">
                                                        <Wifi size={18} />
                                                    </div>

                                                    <div>
                                                        <p className="text-[10px] font-medium text-slate-400 sm:text-xs">
                                                            {t("home.hero.carteConnexionLabel")}
                                                        </p>

                                                        <p className="text-xs font-bold text-slate-800 sm:text-sm">
                                                            Wi-Fi / MQTT
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {/* IOT */}
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    x: 15,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    x: 0,
                                                }}
                                                transition={{
                                                    delay: 0.85,
                                                    duration: 0.6,
                                                }}
                                                className="absolute right-4 top-4 z-20 rounded-2xl border border-white/70 bg-white/95 p-2.5 shadow-xl shadow-slate-900/10 backdrop-blur-md sm:right-5 sm:top-5 sm:p-3"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-600">
                                                        <Radio size={18} />
                                                    </div>

                                                    <div>
                                                        <p className="text-[10px] font-medium text-slate-400 sm:text-xs">
                                                            {t("home.hero.carteIotLabel")}
                                                        </p>

                                                        <p className="text-xs font-bold text-slate-800 sm:text-sm">
                                                            {t("home.hero.carteConnecte")}
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {/* REMPLISSAGE */}
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
                                                    delay: 1,
                                                    duration: 0.6,
                                                }}
                                                className="absolute bottom-4 left-4 z-20 rounded-2xl border border-white/70 bg-slate-950/80 p-3 text-white shadow-xl shadow-slate-900/20 backdrop-blur-md sm:bottom-5 sm:left-5 sm:p-4"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/20 text-green-400">
                                                        <Gauge size={18} />
                                                    </div>

                                                    <div>
                                                        <p className="text-[10px] font-medium text-slate-300 sm:text-xs">
                                                            {t("home.hero.carteRemplissageLabel")}
                                                        </p>

                                                        <p className="mt-0.5 text-base font-bold sm:text-lg">
                                                            68%
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-white/20">
                                                    <div className="h-full w-[68%] rounded-full bg-green-400" />
                                                </div>
                                            </motion.div>

                                            {/* LOCALISATION */}
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
                                                    delay: 1.1,
                                                    duration: 0.6,
                                                }}
                                                className="absolute bottom-4 right-4 z-20 rounded-2xl border border-white/70 bg-white/95 p-3 shadow-xl shadow-slate-900/10 backdrop-blur-md sm:bottom-5 sm:right-5 sm:p-4"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-600">
                                                        <MapPinned size={18} />
                                                    </div>

                                                    <div>
                                                        <p className="text-[10px] font-medium text-slate-400 sm:text-xs">
                                                            {t("home.hero.carteLocalisationLabel")}
                                                        </p>

                                                        <p className="text-xs font-bold text-slate-800 sm:text-sm">
                                                            {t("home.hero.carteVille")}
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </div>

                                        <div className="mt-5 grid grid-cols-2 gap-3">
                                            <div className="rounded-2xl bg-slate-50 p-4">
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <Gauge size={14} />
                                                    {t("home.hero.carteRemplissageMini")}
                                                </div>

                                                <p className="mt-2 text-2xl font-bold text-slate-900">
                                                    68%
                                                </p>

                                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                                                    <div className="h-full w-[68%] rounded-full bg-green-500" />
                                                </div>
                                            </div>

                                            <div className="rounded-2xl bg-slate-50 p-4">
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <Activity size={14} />
                                                    {t("home.hero.carteEtatMini")}
                                                </div>

                                                <p className="mt-2 text-lg font-bold text-green-600">
                                                    {t("home.hero.carteEtatValeur")}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    {t("home.hero.carteEtatNote")}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </ScrollReveal>
                    </div>
                </motion.div>
            </section>

            {/* =====================================================
                PROBLÉMATIQUE
            ====================================================== */}
            <section
                id="problematique"
                className="section-padding bg-white"
            >
                <div className="container-app">
                    <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
                        <ScrollReveal direction="right">
                            <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-7 sm:p-10">
                                <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-green-500/20 blur-3xl" />

                                <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />

                                <div className="relative">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10">
                                        <ShieldCheck
                                            size={28}
                                            className="text-green-400"
                                        />
                                    </div>

                                    <h3 className="mt-7 text-2xl font-bold text-white sm:text-3xl">
                                        {t("home.problematique.titre")}
                                    </h3>

                                    <p className="mt-5 text-sm leading-7 text-slate-400 sm:text-base">
                                        {t("home.problematique.paragraphe")}
                                    </p>

                                    <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-6">
                                        <div className="h-2 w-2 rounded-full bg-green-400" />

                                        <span className="text-xs font-medium text-slate-400">
                                            {t("home.problematique.note")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </ScrollReveal>

                        <div>
                            <ScrollReveal direction="left">
                                <Badge variant="green">
                                    {t("home.problematique.badge")}
                                </Badge>

                                <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl">
                                    {t("home.problematique.titre2")}
                                </h2>

                                <p className="mt-5 text-base leading-7 text-slate-500">
                                    {t("home.problematique.paragraphe2")}
                                </p>
                            </ScrollReveal>

                            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                                <ScrollReveal
                                    direction="left"
                                    delay={0.1}
                                >
                                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
                                            <Gauge size={21} />
                                        </div>

                                        <h3 className="mt-4 font-bold text-slate-800">
                                            {t("home.problematique.etape1Titre")}
                                        </h3>

                                        <p className="mt-2 text-sm leading-6 text-slate-500">
                                            {t("home.problematique.etape1Texte")}
                                        </p>
                                    </div>
                                </ScrollReveal>

                                <ScrollReveal
                                    direction="left"
                                    delay={0.18}
                                >
                                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                            <MapPinned size={21} />
                                        </div>

                                        <h3 className="mt-4 font-bold text-slate-800">
                                            {t("home.problematique.etape2Titre")}
                                        </h3>

                                        <p className="mt-2 text-sm leading-6 text-slate-500">
                                            {t("home.problematique.etape2Texte")}
                                        </p>
                                    </div>
                                </ScrollReveal>

                                <ScrollReveal
                                    direction="left"
                                    delay={0.26}
                                >
                                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                                            <Activity size={21} />
                                        </div>

                                        <h3 className="mt-4 font-bold text-slate-800">
                                            {t("home.problematique.etape3Titre")}
                                        </h3>

                                        <p className="mt-2 text-sm leading-6 text-slate-500">
                                            {t("home.problematique.etape3Texte")}
                                        </p>
                                    </div>
                                </ScrollReveal>

                                <ScrollReveal
                                    direction="left"
                                    delay={0.34}
                                >
                                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                                            <Route size={21} />
                                        </div>

                                        <h3 className="mt-4 font-bold text-slate-800">
                                            {t("home.problematique.etape4Titre")}
                                        </h3>

                                        <p className="mt-2 text-sm leading-6 text-slate-500">
                                            {t("home.problematique.etape4Texte")}
                                        </p>
                                    </div>
                                </ScrollReveal>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* =====================================================
                FONCTIONNALITÉS
            ====================================================== */}
            <section
                id="fonctionnalites"
                className="section-padding bg-slate-50"
            >
                <div className="container-app">
                    <SectionTitle
                        eyebrow={t("home.fonctionnalites.eyebrow")}
                        title={t("home.fonctionnalites.titre")}
                        description={t("home.fonctionnalites.description")}
                    />

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {features.map(
                            (feature, index) => {
                                const Icon =
                                    feature.icon;

                                return (
                                    <ScrollReveal
                                        key={
                                            feature.title
                                        }
                                        direction="up"
                                        delay={
                                            index *
                                            0.1
                                        }
                                    >
                                        <motion.article
                                            whileHover={{
                                                y: -7,
                                            }}
                                            transition={{
                                                duration:
                                                    0.2,
                                            }}
                                            className="group h-full rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-xl hover:shadow-slate-900/5"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div
                                                    className={`
                                                        flex
                                                        h-12
                                                        w-12
                                                        items-center
                                                        justify-center
                                                        rounded-2xl
                                                        ${
                                                            feature.variant ===
                                                            "green"
                                                                ? "bg-green-50 text-green-600"
                                                                : feature.variant ===
                                                                  "blue"
                                                                ? "bg-blue-50 text-blue-600"
                                                                : feature.variant ===
                                                                  "orange"
                                                                ? "bg-orange-50 text-orange-600"
                                                                : "bg-slate-100 text-slate-600"
                                                        }
                                                    `}
                                                >
                                                    <Icon
                                                        size={
                                                            23
                                                        }
                                                    />
                                                </div>

                                                <span className="text-xs font-bold text-slate-200">
                                                    0
                                                    {index +
                                                        1}
                                                </span>
                                            </div>

                                            <h3 className="mt-7 text-lg font-bold text-slate-900">
                                                {
                                                    feature.title
                                                }
                                            </h3>

                                            <p className="mt-3 text-sm leading-6 text-slate-500">
                                                {
                                                    feature.description
                                                }
                                            </p>

                                            <div className="mt-6 h-1 w-8 rounded-full bg-green-500 transition-all duration-300 group-hover:w-14" />
                                        </motion.article>
                                    </ScrollReveal>
                                );
                            }
                        )}
                    </div>
                </div>
            </section>

            <BandeauEquipe />

            <SectionRoles />

            <SectionCycle />

            {/* =====================================================
                FONCTIONNEMENT
            ====================================================== */}
            <section
                id="fonctionnement"
                className="section-padding bg-white"
            >
                <div className="container-app">
                    <SectionTitle
                        eyebrow={t("home.fonctionnement.eyebrow")}
                        title={t("home.fonctionnement.titre")}
                        description={t("home.fonctionnement.description")}
                    />

                    <div className="relative">
                        <div className="absolute left-[10%] right-[10%] top-10 hidden h-px bg-gradient-to-r from-green-200 via-blue-200 to-purple-200 lg:block" />

                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                            {steps.map(
                                (
                                    step,
                                    index
                                ) => {
                                    const Icon =
                                        step.icon;

                                    return (
                                        <ScrollReveal
                                            key={
                                                step.number
                                            }
                                            direction="up"
                                            delay={
                                                index *
                                                0.12
                                            }
                                        >
                                            <div className="relative text-center">
                                                <div className="relative z-10 mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border-4 border-white bg-slate-50 text-green-600 shadow-lg shadow-slate-900/5">
                                                    <Icon
                                                        size={
                                                            29
                                                        }
                                                    />
                                                </div>

                                                <div className="mt-6">
                                                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-green-600">
                                                        {t("home.fonctionnement.etapeLabel")}{" "}
                                                        {
                                                            step.number
                                                        }
                                                    </span>

                                                    <h3 className="mt-2 text-lg font-bold text-slate-900">
                                                        {
                                                            step.title
                                                        }
                                                    </h3>

                                                    <p className="mt-3 text-sm leading-6 text-slate-500">
                                                        {
                                                            step.description
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </ScrollReveal>
                                    );
                                }
                            )}
                        </div>
                    </div>

                    <ScrollReveal
                        direction="up"
                        delay={0.2}
                    >
                        <div className="mt-16 rounded-[2rem] bg-slate-950 p-6 sm:p-8 lg:p-10">
                            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                                <div className="max-w-xl">
                                    <div className="flex items-center gap-2 text-green-400">
                                        <Radio size={18} />

                                        <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                                            {t("home.fonctionnement.bandeauLabel")}
                                        </span>
                                    </div>

                                    <h3 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
                                        {t("home.fonctionnement.bandeauTitre")}
                                    </h3>

                                    <p className="mt-4 text-sm leading-7 text-slate-400">
                                        {t("home.fonctionnement.bandeauTexte")}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center justify-center gap-2 lg:max-w-[500px]">
                                    {[
                                        "JSN-SR04T",
                                        "ESP32",
                                        "Wi-Fi",
                                        "MQTT",
                                        "Node.js",
                                        "MySQL",
                                        "React",
                                    ].map(
                                        (
                                            technology,
                                            index
                                        ) => (
                                            <div
                                                key={
                                                    technology
                                                }
                                                className="flex items-center gap-2"
                                            >
                                                <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300">
                                                    {
                                                        technology
                                                    }
                                                </span>

                                                {index <
                                                    6 && (
                                                    <ArrowRight
                                                        size={
                                                            13
                                                        }
                                                        className="hidden text-slate-600 sm:block"
                                                    />
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            {/* =====================================================
                TECHNOLOGIES
            ====================================================== */}
            <section
                id="technologies"
                className="section-padding bg-slate-50"
            >
                <div className="container-app">
                    <SectionTitle
                        eyebrow={t("home.technologies.eyebrow")}
                        title={t("home.technologies.titre")}
                        description={t("home.technologies.description")}
                    />

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        {technologies.map(
                            (
                                technology,
                                index
                            ) => {
                                const Icon =
                                    technology.icon;

                                return (
                                    <ScrollReveal
                                        key={
                                            technology.name
                                        }
                                        direction="up"
                                        delay={
                                            index *
                                            0.08
                                        }
                                    >
                                        <motion.div
                                            whileHover={{
                                                scale: 1.03,
                                            }}
                                            className="rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm"
                                        >
                                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                                                <Icon
                                                    size={
                                                        22
                                                    }
                                                />
                                            </div>

                                            <h3 className="mt-4 font-bold text-slate-900">
                                                {
                                                    technology.name
                                                }
                                            </h3>

                                            <p className="mt-1 text-xs text-slate-400">
                                                {
                                                    technology.description
                                                }
                                            </p>
                                        </motion.div>
                                    </ScrollReveal>
                                );
                            }
                        )}
                    </div>
                </div>
            </section>

            <BandeauAgent />

            {/* =====================================================
                CTA
            ====================================================== */}
            <section className="section-padding bg-white">
                <div className="container-app">
                    <ScrollReveal direction="up">
                        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-green-600 to-emerald-700 px-6 py-12 sm:px-10 sm:py-16 lg:px-16">
                            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

                            <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-black/10 blur-3xl" />

                            <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
                                <div className="max-w-2xl">
                                    <div className="flex items-center gap-2 text-green-100">
                                        <Zap size={17} />

                                        <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                                            {t("home.cta.label")}
                                        </span>
                                    </div>

                                    <h2 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl">
                                        {t("home.cta.titre")}
                                    </h2>

                                    <p className="mt-4 text-sm leading-7 text-green-50/80 sm:text-base">
                                        {t("home.cta.paragraphe")}
                                    </p>
                                </div>

                                {/* CTA -> LOGIN */}
                                <Link
                                    to="/register"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-green-700 shadow-xl transition-all hover:-translate-y-1 hover:bg-green-50"
                                >
                                    {t("home.cta.bouton")}
                                    <ArrowRight size={18} />
                                </Link>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>
        </div>
    );
}