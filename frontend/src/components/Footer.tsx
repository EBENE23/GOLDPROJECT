import {
    ArrowUp,
    Leaf,
    MapPin,
    Radio,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useTranslation } from "../i18n";

export default function Footer() {
    const { t } = useTranslation();

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <footer className="border-t border-slate-100 bg-slate-950 text-white">
            <div className="container-app py-16 sm:py-20">
                <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
                    <div>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-3"
                        >
                            <img
                                src="/images/logo.png"
                                alt="SmartCityWaste"
                                className="h-12 w-auto rounded-lg bg-white p-1"
                            />
                        </Link>

                        <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
                            {t("footer.description")}
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-xs text-slate-300">
                                <Leaf size={14} />
                                {t("footer.villeDurable")}
                            </span>

                            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-xs text-slate-300">
                                <Radio size={14} />
                                IoT
                            </span>

                            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-xs text-slate-300">
                                <MapPin size={14} />
                                {t("footer.geolocalisation")}
                            </span>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-white">
                            {t("footer.navigation")}
                        </h3>

                        <div className="mt-5 flex flex-col gap-3">
                            <a
                                href="#accueil"
                                className="text-sm text-slate-400 transition-colors hover:text-green-400"
                            >
                                {t("nav.accueil")}
                            </a>

                            <a
                                href="#fonctionnalites"
                                className="text-sm text-slate-400 transition-colors hover:text-green-400"
                            >
                                {t("nav.fonctionnalites")}
                            </a>

                            <a
                                href="#fonctionnement"
                                className="text-sm text-slate-400 transition-colors hover:text-green-400"
                            >
                                {t("nav.fonctionnement")}
                            </a>

                            <a
                                href="#technologies"
                                className="text-sm text-slate-400 transition-colors hover:text-green-400"
                            >
                                {t("nav.technologies")}
                            </a>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-white">
                            SmartCityWaste
                        </h3>

                        <div className="mt-5 flex flex-col gap-3">
                            <Link
                                to="/login"
                                className="text-sm text-slate-400 transition-colors hover:text-green-400"
                            >
                                {t("auth.login.seConnecter")}
                            </Link>

                            <Link
                                to="/register"
                                className="text-sm text-slate-400 transition-colors hover:text-green-400"
                            >
                                {t("footer.demanderAcces")}
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex flex-col gap-5 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-slate-500">
                        {t("footer.droitsReserves", { annee: new Date().getFullYear() })}
                    </p>

                    <button
                        type="button"
                        onClick={scrollToTop}
                        className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:border-green-500/30 hover:text-green-400"
                    >
                        {t("footer.retourEnHaut")}
                        <ArrowUp size={14} />
                    </button>
                </div>
            </div>
        </footer>
    );
}