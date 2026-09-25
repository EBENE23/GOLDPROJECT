import {
    BellRing,
    CheckCircle2,
    ClipboardList,
    Compass,
    Heart,
    MapPin,
    Navigation,
    Radio,
    ShieldCheck,
    Trash2,
    UserCog,
    Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { Link } from "react-router-dom";

import Badge from "../../components/ui/Badge";
import ScrollReveal from "../../components/ScrollReveal";
import SectionTitle from "../../components/SectionTitle";
import { useTranslation } from "../../i18n";

/** Slogan dont les mots apparaissent un par un au défilement (fondu + léger flou). */
function SloganAnime({ texte, className = "" }: { texte: string; className?: string }) {
    const mots = texte.split(" ");

    const conteneur: Variants = {
        hidden: {},
        visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
    };

    const mot: Variants = {
        hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
        visible: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
        },
    };

    return (
        <motion.p
            className={className}
            variants={conteneur}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.6 }}
        >
            {mots.map((m, i) => (
                <motion.span key={i} variants={mot} className="inline-block mr-[0.28em]">
                    {m}
                </motion.span>
            ))}
        </motion.p>
    );
}

interface Role {
    icone: LucideIcon;
    titre: string;
    resume: string;
    actions: string[];
    couleur: string;
}

export function SectionRoles() {
    const { t } = useTranslation();

    const roles: Role[] = [
        {
            icone: ShieldCheck,
            titre: t("home.roles.adminTitre"),
            resume: t("home.roles.adminResume"),
            actions: [
                t("home.roles.adminAction1"),
                t("home.roles.adminAction2"),
                t("home.roles.adminAction3"),
            ],
            couleur: "bg-indigo-50 text-indigo-600",
        },
        {
            icone: UserCog,
            titre: t("home.roles.superviseurTitre"),
            resume: t("home.roles.superviseurResume"),
            actions: [
                t("home.roles.superviseurAction1"),
                t("home.roles.superviseurAction2"),
                t("home.roles.superviseurAction3"),
            ],
            couleur: "bg-green-50 text-green-600",
        },
        {
            icone: Users,
            titre: t("home.roles.agentTitre"),
            resume: t("home.roles.agentResume"),
            actions: [
                t("home.roles.agentAction1"),
                t("home.roles.agentAction2"),
                t("home.roles.agentAction3"),
            ],
            couleur: "bg-orange-50 text-orange-600",
        },
    ];

    return (
        <section id="roles" className="section-padding bg-white">
            <div className="container-app">
                <SectionTitle
                    eyebrow={t("home.roles.eyebrow")}
                    title={t("home.roles.titre")}
                    description={t("home.roles.description")}
                />

                <div className="grid gap-5 lg:grid-cols-3">
                    {roles.map((role, index) => {
                        const Icone = role.icone;

                        return (
                            <ScrollReveal key={role.titre} direction="up" delay={index * 0.1}>
                                <article className="h-full rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-xl hover:shadow-slate-900/5">
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${role.couleur}`}>
                                        <Icone size={23} />
                                    </div>
                                    <h3 className="mt-6 text-xl font-bold text-slate-900">{role.titre}</h3>
                                    <p className="mt-1 text-sm font-medium text-slate-500">{role.resume}</p>

                                    <ul className="mt-5 space-y-3">
                                        {role.actions.map((action) => (
                                            <li key={action} className="flex items-start gap-2.5 text-sm leading-6 text-slate-600">
                                                <CheckCircle2 size={17} className="mt-1 shrink-0 text-green-500" />
                                                {action}
                                            </li>
                                        ))}
                                    </ul>
                                </article>
                            </ScrollReveal>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

export function SectionCycle() {
    const { t } = useTranslation();

    const etats = [
        {
            nom: t("home.cycle.etatNormalNom"),
            seuil: t("home.cycle.etatNormalSeuil"),
            texte: t("home.cycle.etatNormalTexte"),
            pastille: "bg-green-500",
            carte: "border-green-100 bg-green-50/60",
            titre: "text-green-700",
        },
        {
            nom: t("home.cycle.etatAlerteNom"),
            seuil: t("home.cycle.etatAlerteSeuil"),
            texte: t("home.cycle.etatAlerteTexte"),
            pastille: "bg-orange-500",
            carte: "border-orange-100 bg-orange-50/60",
            titre: "text-orange-700",
        },
        {
            nom: t("home.cycle.etatPleinNom"),
            seuil: t("home.cycle.etatPleinSeuil"),
            texte: t("home.cycle.etatPleinTexte"),
            pastille: "bg-red-500",
            carte: "border-red-100 bg-red-50/60",
            titre: "text-red-700",
        },
    ];

    const cycle: { icone: LucideIcon; titre: string; texte: string }[] = [
        {
            icone: BellRing,
            titre: t("home.cycle.etape1Titre"),
            texte: t("home.cycle.etape1Texte"),
        },
        {
            icone: ClipboardList,
            titre: t("home.cycle.etape2Titre"),
            texte: t("home.cycle.etape2Texte"),
        },
        {
            icone: Navigation,
            titre: t("home.cycle.etape3Titre"),
            texte: t("home.cycle.etape3Texte"),
        },
        {
            icone: Trash2,
            titre: t("home.cycle.etape4Titre"),
            texte: t("home.cycle.etape4Texte"),
        },
        {
            icone: CheckCircle2,
            titre: t("home.cycle.etape5Titre"),
            texte: t("home.cycle.etape5Texte"),
        },
    ];

    return (
        <section id="cycle" className="section-padding bg-slate-50">
            <div className="container-app">
                <SectionTitle
                    eyebrow={t("home.cycle.eyebrow")}
                    title={t("home.cycle.titre")}
                    description={t("home.cycle.description")}
                />

                <ScrollReveal direction="up">
                    <div className="mx-auto max-w-4xl">
                        <div className="h-3 overflow-hidden rounded-full bg-gradient-to-r from-green-500 via-orange-400 to-red-500 shadow-inner" />
                        <div className="mt-2 flex justify-between text-xs font-semibold text-slate-400">
                            <span>0 %</span>
                            <span>50 %</span>
                            <span>80 %</span>
                            <span>100 %</span>
                        </div>
                    </div>
                </ScrollReveal>

                <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
                    {etats.map((etat, index) => (
                        <ScrollReveal key={etat.nom} direction="up" delay={index * 0.1}>
                            <div className={`h-full rounded-2xl border p-5 ${etat.carte}`}>
                                <div className="flex items-center gap-2">
                                    <span className={`h-3 w-3 rounded-full ${etat.pastille}`} />
                                    <p className={`font-bold ${etat.titre}`}>{etat.nom}</p>
                                </div>
                                <p className="mt-2 text-sm font-semibold text-slate-800">{etat.seuil}</p>
                                <p className="mt-1 text-sm text-slate-500">{etat.texte}</p>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>

                <ol className="mx-auto mt-14 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {cycle.map((etape, index) => {
                        const Icone = etape.icone;

                        return (
                            <ScrollReveal key={etape.titre} direction="up" delay={index * 0.08}>
                                <li className="relative h-full rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                    <span className="absolute right-4 top-4 text-xs font-bold text-slate-300">
                                        {String(index + 1).padStart(2, "0")}
                                    </span>
                                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                                        <Icone size={21} />
                                    </span>
                                    <p className="mt-4 font-bold text-slate-900">{etape.titre}</p>
                                    <p className="mt-1.5 text-sm leading-6 text-slate-500">{etape.texte}</p>
                                </li>
                            </ScrollReveal>
                        );
                    })}
                </ol>

                <div className="mt-12 text-center">
                    <Link
                        to="/register"
                        className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-green-700"
                    >
                        {t("home.cycle.bouton")}
                    </Link>
                </div>
            </div>
        </section>
    );
}

/** Bandeau cinématique plein format : l'équipe de collecte, avec un slogan animé en surimpression. */
export function BandeauEquipe() {
    const { t } = useTranslation();

    const capacites = [
        { icone: Radio, texte: t("home.bandeauEquipe.capacite1") },
        { icone: MapPin, texte: t("home.bandeauEquipe.capacite2") },
        { icone: Compass, texte: t("home.bandeauEquipe.capacite3") },
    ];

    return (
        <section className="section-padding bg-white">
            <div className="container-app">
                <ScrollReveal direction="none">
                    <div className="relative overflow-hidden rounded-[2rem] shadow-xl shadow-slate-900/10">
                        <motion.img
                            src="/images/equipe-collecte.png"
                            alt={t("home.bandeauEquipe.alt")}
                            className="h-[420px] w-full object-cover sm:h-[480px] lg:h-[560px]"
                            loading="lazy"
                            initial={{ scale: 1.08, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-slate-950/10" />

                        <div className="absolute inset-0 flex flex-col justify-end p-7 sm:p-10 lg:p-14">
                            <ScrollReveal direction="up">
                                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-md">
                                    <Radio size={12} />
                                    {t("home.bandeauEquipe.badge")}
                                </span>
                            </ScrollReveal>

                            <SloganAnime
                                texte={t("home.bandeauEquipe.slogan")}
                                className="mt-4 max-w-2xl text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl"
                            />

                            <ScrollReveal direction="up" delay={0.3}>
                                <p className="mt-4 max-w-xl text-sm leading-7 text-white/80 sm:text-base">
                                    {t("home.bandeauEquipe.texte")}
                                </p>
                            </ScrollReveal>

                            <div className="mt-7 flex flex-wrap gap-2.5">
                                {capacites.map((c, index) => (
                                    <ScrollReveal key={c.texte} direction="up" delay={0.45 + index * 0.08}>
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                                            <c.icone size={13} />
                                            {c.texte}
                                        </span>
                                    </ScrollReveal>
                                ))}
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
}

/** Bandeau « fierté du métier » : portrait de l'agent, même gabarit que la section « Notre approche ». */
export function BandeauAgent() {
    const { t } = useTranslation();

    return (
        <section className="section-padding bg-white">
            <div className="container-app">
                <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">
                    <ScrollReveal direction="right">
                        <div className="relative mx-auto max-w-sm">
                            <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-green-500/15 blur-2xl" />
                            <div className="overflow-hidden rounded-[2rem] border border-slate-900/5 shadow-xl shadow-slate-900/10">
                                <img
                                    src="/images/agent-portrait.png"
                                    alt={t("home.bandeauAgent.alt")}
                                    className="h-[420px] w-full object-cover object-top sm:h-[480px]"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    </ScrollReveal>

                    <div>
                        <ScrollReveal direction="left">
                            <Badge variant="green">
                                <Heart size={13} className="mr-1.5 inline -mt-0.5" />
                                {t("home.bandeauAgent.badge")}
                            </Badge>
                        </ScrollReveal>

                        <SloganAnime
                            texte={t("home.bandeauAgent.slogan")}
                            className="mt-5 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl"
                        />

                        <ScrollReveal direction="left" delay={0.25}>
                            <p className="mt-5 max-w-lg text-base leading-7 text-slate-500">
                                {t("home.bandeauAgent.texte")}
                            </p>
                        </ScrollReveal>

                        <ScrollReveal direction="left" delay={0.4}>
                            <Link
                                to="/register"
                                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-green-700"
                            >
                                {t("home.bandeauAgent.bouton")}
                            </Link>
                        </ScrollReveal>
                    </div>
                </div>
            </div>
        </section>
    );
}
