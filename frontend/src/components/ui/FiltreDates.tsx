import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, X } from "lucide-react";

import {
  PRESETS_PERIODE,
  plageActive,
  plageVide,
  type PlageDates,
} from "../../utils/plageDates";

interface FiltreDatesProps {
  valeur: PlageDates;
  onChange: (plage: PlageDates) => void;
  libelle?: string;
}

const champDate =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

/**
 * Filtre par période : préréglages rapides (aujourd'hui, 7 jours, 30 jours), tout, ou
 * dates personnalisées avec le calendrier natif de l'appareil.
 */
export default function FiltreDates({ valeur, onChange, libelle = "Période" }: FiltreDatesProps) {
  const [personnalise, setPersonnalise] = useState(false);
  const active = plageActive(valeur);

  const presetActif = PRESETS_PERIODE.find((preset) => {
    const plage = preset.plage();
    return plage.debut === valeur.debut && plage.fin === valeur.fin;
  })?.id;

  const puce = (actif: boolean) =>
    `inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition active:scale-95 ${
      actif
        ? "border-emerald-800 bg-emerald-800 text-white"
        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
    }`;

  return (
    <div className="space-y-2">
      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="flex shrink-0 items-center gap-1.5 pr-1 text-xs font-semibold text-slate-500">
          <CalendarDays size={15} />
          {libelle}
        </span>

        <button
          type="button"
          onClick={() => {
            onChange(plageVide);
            setPersonnalise(false);
          }}
          className={puce(!active)}
        >
          Tout
        </button>

        {PRESETS_PERIODE.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => {
              onChange(preset.plage());
              setPersonnalise(false);
            }}
            className={puce(presetActif === preset.id)}
          >
            {preset.libelle}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setPersonnalise((ouvert) => !ouvert)}
          className={puce(personnalise || (active && !presetActif))}
          aria-expanded={personnalise}
        >
          Personnalisé
        </button>

        {active && (
          <button
            type="button"
            onClick={() => {
              onChange(plageVide);
              setPersonnalise(false);
            }}
            aria-label="Effacer la période"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {personnalise && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2 pt-1 sm:max-w-md">
              <label className="text-xs font-semibold text-slate-500">
                Du
                <input
                  type="date"
                  className={`${champDate} mt-1`}
                  value={valeur.debut}
                  max={valeur.fin || undefined}
                  onChange={(event) => onChange({ ...valeur, debut: event.target.value })}
                />
              </label>
              <label className="text-xs font-semibold text-slate-500">
                Au
                <input
                  type="date"
                  className={`${champDate} mt-1`}
                  value={valeur.fin}
                  min={valeur.debut || undefined}
                  onChange={(event) => onChange({ ...valeur, fin: event.target.value })}
                />
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
