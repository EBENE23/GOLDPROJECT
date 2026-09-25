import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { LANGUES_INFO, useLangue, useTranslation } from "../i18n";

/** Sélecteur de langue compact (drapeau + code) pour la navbar publique et les pages d'authentification. */
export default function SelecteurLangue({ sombre = false }: { sombre?: boolean }) {
    const { langue, setLangue } = useLangue();
    const { t } = useTranslation();
    const [ouvert, setOuvert] = useState(false);
    const conteneurRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fermerSiExterieur = (event: MouseEvent) => {
            if (conteneurRef.current && !conteneurRef.current.contains(event.target as Node)) {
                setOuvert(false);
            }
        };

        document.addEventListener("mousedown", fermerSiExterieur);
        return () => document.removeEventListener("mousedown", fermerSiExterieur);
    }, []);

    const actuelle = LANGUES_INFO.find((item) => item.code === langue) ?? LANGUES_INFO[0];

    return (
        <div ref={conteneurRef} className="relative">
            <button
                type="button"
                onClick={() => setOuvert((valeur) => !valeur)}
                aria-label={t("selecteurLangue.changerLangue")}
                aria-expanded={ouvert}
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-semibold transition-colors ${
                    sombre
                        ? "text-slate-300 hover:bg-white/10 hover:text-white"
                        : "text-slate-600 hover:bg-green-50 hover:text-green-700"
                }`}
            >
                <img src={actuelle.drapeau} alt="" className="h-4 w-4 shrink-0 rounded-full object-cover" />
                <span className="hidden sm:inline">{actuelle.code.toUpperCase()}</span>
                <ChevronDown size={14} className={`shrink-0 transition-transform ${ouvert ? "rotate-180" : ""}`} />
            </button>

            {ouvert && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-44 overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-slate-900/10">
                    {LANGUES_INFO.map((item) => (
                        <button
                            key={item.code}
                            type="button"
                            onClick={() => {
                                setLangue(item.code);
                                setOuvert(false);
                            }}
                            className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-medium transition-colors ${
                                item.code === langue
                                    ? "bg-green-50 text-green-700"
                                    : "text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                            <img src={item.drapeau} alt="" className="h-4 w-4 shrink-0 rounded-full object-cover" />
                            {item.nom}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
