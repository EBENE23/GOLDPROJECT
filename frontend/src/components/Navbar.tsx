import {
    ArrowRight,
    Menu,
    X,
} from "lucide-react";

import {
    useEffect,
    useState,
} from "react";

import {
    Link,
    useLocation,
} from "react-router-dom";

const navigation = [
    {
        label: "Accueil",
        href: "#accueil",
    },
    {
        label: "Fonctionnalités",
        href: "#fonctionnalites",
    },
    {
        label: "Rôles",
        href: "#roles",
    },
    {
        label: "Fonctionnement",
        href: "#fonctionnement",
    },
    {
        label: "Technologies",
        href: "#technologies",
    },
];

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] =
        useState(false);

    // Onglet correspondant à la section actuellement visible à l'écran.
    const [ongletActif, setOngletActif] = useState("#accueil");

    const location = useLocation();

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    // Suit le défilement de la page d'accueil pour surligner l'onglet de la section visible.
    useEffect(() => {
        if (location.pathname !== "/home") return;

        const sections = navigation
            .map((item) => document.querySelector(item.href))
            .filter((el): el is Element => el !== null);

        if (sections.length === 0) return;

        const observateur = new IntersectionObserver(
            (entrees) => {
                const visible = entrees
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

                if (visible) setOngletActif(`#${visible.target.id}`);
            },
            { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
        );

        sections.forEach((section) => observateur.observe(section));

        return () => observateur.disconnect();
    }, [location.pathname]);

    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? "hidden" : "";

        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileMenuOpen]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setMobileMenuOpen(false);
            }
        };

        window.addEventListener(
            "resize",
            handleResize
        );

        return () => {
            window.removeEventListener(
                "resize",
                handleResize
            );
        };
    }, []);

    const handleNavigation = (
        href: string
    ) => {
        setMobileMenuOpen(false);

        if (location.pathname === "/home") {
            const element =
                document.querySelector(href);

            if (element) {
                element.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }

            return;
        }

        window.location.href = `/${href}`;
    };

    return (
        <header className="fixed left-0 right-0 top-0 z-50">
            <div className="container-app px-3 pt-3 sm:px-0 sm:pt-4">
                <nav className="relative flex h-16 items-center justify-between rounded-2xl border border-white/70 bg-white/90 px-3 shadow-lg shadow-slate-900/5 backdrop-blur-xl sm:px-5">
                    {/* =================================================
                        LOGO + NOM DE L'APPLICATION
                    ================================================== */}
                    <Link
                        to="/"
                        className="group flex shrink-0 items-center gap-2.5"
                        aria-label="SmartCityWaste - Accueil"
                    >
                        <img
                            src="/images/logo.png"
                            alt="Logo SmartCityWaste"
                            className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105 sm:h-11"
                        />

                        <div className="flex flex-col justify-center leading-none">
                            <span className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
                                SmartCity
                                <span className="text-green-600">
                                    Waste
                                </span>
                            </span>

                            <span className="mt-1 hidden text-[9px] font-medium uppercase tracking-[0.16em] text-slate-400 sm:block">
                                Gestion intelligente
                            </span>
                        </div>
                    </Link>

                    {/* =================================================
                        NAVIGATION DESKTOP
                    ================================================== */}
                    <div className="hidden items-center gap-1 md:flex lg:gap-1.5">
                        {navigation.map(
                            (item) => {
                                const actif =
                                    location.pathname === "/home" &&
                                    ongletActif === item.href;

                                return (
                                    <button
                                        key={
                                            item.href
                                        }
                                        type="button"
                                        aria-current={actif ? "true" : undefined}
                                        onClick={() =>
                                            handleNavigation(
                                                item.href
                                            )
                                        }
                                        className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                            actif
                                                ? "text-green-700"
                                                : "text-slate-600 hover:bg-green-50 hover:text-green-600"
                                        }`}
                                    >
                                        {
                                            item.label
                                        }
                                        {actif && (
                                            <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-green-600" />
                                        )}
                                    </button>
                                );
                            }
                        )}
                    </div>

                    {/* =================================================
                        ACTIONS DESKTOP
                    ================================================== */}
                    <div className="hidden items-center gap-2 lg:gap-3 md:flex">
                        <Link
                            to="/login"
                            className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:text-green-600 lg:px-4"
                        >
                            Connexion
                        </Link>

                        <Link
                            to="/register"
                            className="hidden rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-green-50 hover:text-green-700 xl:inline-flex"
                        >
                            Créer un compte
                        </Link>

                    </div>

                    {/* =================================================
                        BOUTON MENU MOBILE
                    ================================================== */}
                    <button
                        type="button"
                        onClick={() =>
                            setMobileMenuOpen(
                                (value) =>
                                    !value
                            )
                        }
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-all hover:bg-green-50 hover:text-green-700 md:hidden"
                        aria-label={
                            mobileMenuOpen
                                ? "Fermer le menu"
                                : "Ouvrir le menu"
                        }
                    >
                        {mobileMenuOpen ? (
                            <X size={21} />
                        ) : (
                            <Menu size={21} />
                        )}
                    </button>

                    {/* =================================================
                        MENU MOBILE
                    ================================================== */}
                    {mobileMenuOpen && (
                        <div className="absolute left-0 right-0 top-[calc(100%+10px)] overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-xl shadow-slate-900/10 md:hidden">
                            <div className="flex flex-col">
                                {navigation.map(
                                    (item) => {
                                        const actif =
                                            location.pathname === "/home" &&
                                            ongletActif === item.href;

                                        return (
                                            <button
                                                key={
                                                    item.href
                                                }
                                                type="button"
                                                aria-current={actif ? "true" : undefined}
                                                onClick={() =>
                                                    handleNavigation(
                                                        item.href
                                                    )
                                                }
                                                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                                                    actif
                                                        ? "bg-green-50 text-green-700"
                                                        : "text-slate-600 hover:bg-green-50 hover:text-green-700"
                                                }`}
                                            >
                                                {actif && <span className="h-1.5 w-1.5 rounded-full bg-green-600" />}
                                                {
                                                    item.label
                                                }
                                            </button>
                                        );
                                    }
                                )}

                                <div className="my-2 h-px bg-slate-100" />

                                <Link
                                    to="/login"
                                    className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                                >
                                    Connexion
                                </Link>

                                <Link
                                    to="/register"
                                    className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700"
                                >
                                    S'inscrire

                                    <ArrowRight
                                        size={16}
                                    />
                                </Link>
                            </div>
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
}