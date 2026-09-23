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

const roles: Role[] = [
    {
        icone: ShieldCheck,
        titre: "Administrateur",
        resume: "Pilote toute la plateforme.",
        actions: [
            "Valide les demandes d'inscription et affecte chaque personne à une zone",
            "Gère les utilisateurs, les zones et les bacs",
            "Consulte les rapports et les statistiques",
        ],
        couleur: "bg-indigo-50 text-indigo-600",
    },
    {
        icone: UserCog,
        titre: "Superviseur",
        resume: "Responsable d'une zone.",
        actions: [
            "Suit en direct le niveau de ses bacs sur le tableau de bord et la carte",
            "Crée les interventions et les confie à ses agents",
            "Suit la position des agents pendant la collecte",
        ],
        couleur: "bg-green-50 text-green-600",
    },
    {
        icone: Users,
        titre: "Agent de collecte",
        resume: "Sur le terrain, depuis son téléphone.",
        actions: [
            "Reçoit ses missions par notification",
            "Suit l'itinéraire jusqu'au bac sur la carte",
            "Signale un problème et termine la mission une fois le bac vidé",
        ],
        couleur: "bg-orange-50 text-orange-600",
    },
];

const etats = [
    {
        nom: "Normal",
        seuil: "jusqu'à 50 %",
        texte: "Aucune action nécessaire.",
        pastille: "bg-green-500",
        carte: "border-green-100 bg-green-50/60",
        titre: "text-green-700",
    },
    {
        nom: "Alerte",
        seuil: "de 51 % à 80 %",
        texte: "Le superviseur est prévenu.",
        pastille: "bg-orange-500",
        carte: "border-orange-100 bg-orange-50/60",
        titre: "text-orange-700",
    },
    {
        nom: "Plein",
        seuil: "au-delà de 80 %",
        texte: "Une collecte doit être organisée.",
        pastille: "bg-red-500",
        carte: "border-red-100 bg-red-50/60",
        titre: "text-red-700",
    },
];

const cycle: { icone: LucideIcon; titre: string; texte: string }[] = [
    {
        icone: BellRing,
        titre: "Alerte",
        texte: "Le bac dépasse un seuil, le superviseur est notifié.",
    },
    {
        icone: ClipboardList,
        titre: "Intervention",
        texte: "Le superviseur la crée et choisit un agent disponible.",
    },
    {
        icone: Navigation,
        titre: "Mission",
        texte: "L'agent démarre et suit l'itinéraire, sa position est visible.",
    },
    {
        icone: Trash2,
        titre: "Collecte",
        texte: "Le bac est vidé, la mesure repasse à l'état normal.",
    },
    {
        icone: CheckCircle2,
        titre: "Clôture",
        texte: "La mission ne se termine que si le bac est bien vide.",
    },
];

export function SectionRoles() {
    return (
        <section id="roles" className="section-padding bg-white">
            <div className="container-app">
                <SectionTitle
                    eyebrow="Rôles"
                    title="Trois rôles, un même système"
                    description="Chaque utilisateur retrouve uniquement les outils utiles à son travail, sur ordinateur comme sur téléphone."
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
    return (
        <section id="cycle" className="section-padding bg-slate-50">
            <div className="container-app">
                <SectionTitle
                    eyebrow="Collecte"
                    title="De l'alerte au bac vidé"
                    description="Le niveau de remplissage déclenche automatiquement chaque étape, sans appel ni papier."
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
                        Demander un accès
                    </Link>
                </div>
            </div>
        </section>
    );
}

const capacites = [
    { icone: Radio, texte: "Suivi en temps réel" },
    { icone: MapPin, texte: "Position GPS des bacs" },
    { icone: Compass, texte: "Priorité aux bacs pleins" },
];

/** Bandeau cinématique plein format : l'équipe de collecte, avec un slogan animé en surimpression. */
export function BandeauEquipe() {
    return (
        <section className="section-padding bg-white">
            <div className="container-app">
                <ScrollReveal direction="none">
                    <div className="relative overflow-hidden rounded-[2rem] shadow-xl shadow-slate-900/10">
                        <motion.img
                            src="/images/equipe-collecte.png"
                            alt="Équipe de collecte vidant un bac connecté sur une route de Yaoundé"
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
                                    Sur le terrain
                                </span>
                            </ScrollReveal>

                            <SloganAnime
                                texte="La donnée guide chaque collecte."
                                className="mt-4 max-w-2xl text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl"
                            />

                            <ScrollReveal direction="up" delay={0.3}>
                                <p className="mt-4 max-w-xl text-sm leading-7 text-white/80 sm:text-base">
                                    Grâce aux capteurs connectés, les équipes interviennent là où c'est
                                    vraiment nécessaire, dès qu'un bac atteint son seuil d'alerte.
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
                                    alt="Agent de collecte souriant, fier de son métier"
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
                                Fierté du métier
                            </Badge>
                        </ScrollReveal>

                        <SloganAnime
                            texte="Ils protègent une ville, jour après jour."
                            className="mt-5 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl"
                        />

                        <ScrollReveal direction="left" delay={0.25}>
                            <p className="mt-5 max-w-lg text-base leading-7 text-slate-500">
                                Sur le terrain, chaque agent utilise l'application pour suivre ses
                                missions et savoir exactement où intervenir en priorité — un métier
                                essentiel, désormais mieux organisé.
                            </p>
                        </ScrollReveal>

                        <ScrollReveal direction="left" delay={0.4}>
                            <Link
                                to="/register"
                                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-green-700"
                            >
                                Rejoindre l'équipe
                            </Link>
                        </ScrollReveal>
                    </div>
                </div>
            </div>
        </section>
    );
}
