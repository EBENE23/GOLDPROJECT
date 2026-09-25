import { useCallback, useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Gauge, History, RefreshCw, TrendingUp } from "lucide-react";

import {
  BandeauErreur,
  Card,
  Chargement,
  EtatBadge,
  EtatVide,
  FilterChips,
  KpiCard,
  PageHeader,
  SecondaryButton,
  SectionTitle,
  Squelette,
} from "../../components/ui/kit";
import FiltreDates from "../../components/ui/FiltreDates";
import { useTempsReel } from "../../hooks/useTempsReel";
import api from "../../services/api";
import { SEUIL_ALERTE, SEUIL_PLEIN } from "../../utils/bacLevel";
import { joursEnArriere, type PlageDates } from "../../utils/plageDates";
import { LOCALE_INTL, useTranslation } from "../../i18n";

interface Bac {
  id_bac: number;
  reference: string;
}

interface Mesure {
  idMesure: number;
  distance?: number | string | null;
  pourcentage?: number | string | null;
  dateMesure?: string | null;
  qualiteMesure?: string | null;
}

export default function Historiques() {
  const { t, langue } = useTranslation();

  const formaterDate = (valeur?: string | null) =>
    valeur
      ? new Intl.DateTimeFormat(LOCALE_INTL[langue], { dateStyle: "medium", timeStyle: "short" }).format(new Date(valeur))
      : "—";

  const [bacs, setBacs] = useState<Bac[]>([]);
  const [bacId, setBacId] = useState("");
  const [mesures, setMesures] = useState<Mesure[]>([]);
  // Par défaut : les 30 derniers jours (l'historique complet peut être très long).
  const [periode, setPeriode] = useState<PlageDates>(() => joursEnArriere(30));
  const [loading, setLoading] = useState(true);
  const [chargementMesures, setChargementMesures] = useState(false);
  const [error, setError] = useState("");

  const chargerBacs = useCallback(async () => {
    try {
      setError("");
      const reponse = await api.get<{ bacs: Bac[] }>("/superviseur/bacs");
      const liste = Array.isArray(reponse.data?.bacs) ? reponse.data.bacs : [];
      setBacs(liste);
      setBacId((courant) => courant || (liste[0] ? String(liste[0].id_bac) : ""));
    } catch (err: any) {
      setError(err?.response?.data?.message || t("superviseurHistoriques.erreurChargementBacs"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const chargerMesures = useCallback(async () => {
    if (!bacId) {
      setMesures([]);
      return;
    }

    try {
      setChargementMesures(true);
      setError("");
      const reponse = await api.get<{ mesures: Mesure[] }>(`/mesures/bac/${bacId}/historique`, {
        params: {
          ...(periode.debut ? { dateDebut: periode.debut } : {}),
          ...(periode.fin ? { dateFin: periode.fin } : {}),
          limite: 500,
        },
      });
      setMesures(Array.isArray(reponse.data?.mesures) ? reponse.data.mesures : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || t("superviseurHistoriques.erreurChargementHistorique"));
      setMesures([]);
    } finally {
      setChargementMesures(false);
    }
  }, [bacId, periode, t]);

  useEffect(() => {
    chargerBacs();
  }, [chargerBacs]);

  useEffect(() => {
    chargerMesures();
  }, [chargerMesures]);

  // Une nouvelle mesure du capteur rafraîchit l'historique en direct.
  useTempsReel(() => chargerMesures(), ["mesure"]);

  const serie = useMemo(
    () =>
      [...mesures]
        .filter((mesure) => mesure.dateMesure)
        .sort((a, b) => new Date(a.dateMesure as string).getTime() - new Date(b.dateMesure as string).getTime())
        .map((mesure) => ({
          date: new Date(mesure.dateMesure as string).getTime(),
          niveau: Number(mesure.pourcentage) || 0,
        })),
    [mesures]
  );

  const stats = useMemo(() => {
    if (serie.length === 0) return null;
    const niveaux = serie.map((point) => point.niveau);

    return {
      dernier: niveaux[niveaux.length - 1],
      max: Math.max(...niveaux),
      moyenne: Math.round(niveaux.reduce((a, b) => a + b, 0) / niveaux.length),
    };
  }, [serie]);

  const bacChoisi = bacs.find((bac) => String(bac.id_bac) === bacId);

  if (loading) return <Chargement texte={t("superviseurHistoriques.chargement")} />;

  return (
    <div className="space-y-5">
      <PageHeader
        titre={t("superviseurHistoriques.titre")}
        description={t("superviseurHistoriques.description")}
        actions={
          <SecondaryButton icone={RefreshCw} chargement={chargementMesures} onClick={() => chargerMesures()}>
            {t("adminDemandes.actualiser")}
          </SecondaryButton>
        }
      />

      {error && <BandeauErreur message={error} onReessayer={chargerMesures} />}

      {bacs.length === 0 ? (
        <Card>
          <EtatVide icone={History} titre={t("superviseurHistoriques.aucunBacZone")} />
        </Card>
      ) : (
        <>
          <FilterChips
            valeur={bacId}
            onChange={setBacId}
            options={bacs.map((bac) => ({ valeur: String(bac.id_bac), libelle: bac.reference }))}
          />

          <FiltreDates valeur={periode} onChange={setPeriode} />

          <div className="grid grid-cols-3 gap-3 lg:gap-4">
            <KpiCard libelle={t("superviseurHistoriques.kpiMesures")} valeur={mesures.length} icone={Gauge} teinte="gris" />
            <KpiCard libelle={t("superviseurHistoriques.kpiMaximum")} valeur={stats ? `${Math.round(stats.max)}%` : "—"} icone={TrendingUp} teinte="rouge" />
            <KpiCard libelle={t("superviseurHistoriques.kpiMoyenne")} valeur={stats ? `${stats.moyenne}%` : "—"} icone={Gauge} teinte="bleu" />
          </div>

          <Card className="p-4 sm:p-5">
            <SectionTitle
              icone={TrendingUp}
              titre={t("superviseurHistoriques.evolution", { ref: bacChoisi?.reference ?? "" })}
              sousTitre={t("superviseurHistoriques.seuilsLabel")}
              droite={stats ? <EtatBadge niveau={stats.dernier} /> : undefined}
            />

            {chargementMesures ? (
              <Squelette className="mt-4 h-56" />
            ) : serie.length < 2 ? (
              <EtatVide
                icone={History}
                titre={serie.length === 0 ? t("superviseurHistoriques.aucuneMesurePeriode") : t("superviseurHistoriques.pasAssezMesures")}
                description={t("superviseurHistoriques.elargirPeriode")}
              />
            ) : (
              <div className="mt-4 h-56 w-full sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={serie} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="degradeNiveau" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="date"
                      type="number"
                      scale="time"
                      domain={["dataMin", "dataMax"]}
                      tickFormatter={(valeur) =>
                        new Intl.DateTimeFormat(LOCALE_INTL[langue], { day: "2-digit", month: "short" }).format(new Date(valeur))
                      }
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      minTickGap={28}
                    />
                    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <ReferenceLine y={SEUIL_ALERTE} stroke="#f97316" strokeDasharray="4 4" />
                    <ReferenceLine y={SEUIL_PLEIN} stroke="#dc2626" strokeDasharray="4 4" />
                    <Tooltip
                      labelFormatter={(valeur) => formaterDate(new Date(Number(valeur)).toISOString())}
                      formatter={(valeur) => [`${Math.round(Number(valeur))}%`, t("superviseurHistoriques.remplissageTooltip")]}
                    />
                    <Area type="monotone" dataKey="niveau" stroke="#16a34a" strokeWidth={2.5} fill="url(#degradeNiveau)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card className="divide-y divide-slate-100">
            {mesures.length === 0 ? (
              <EtatVide icone={History} titre={t("superviseurHistoriques.aucuneMesureAAfficher")} />
            ) : (
              mesures.slice(0, 50).map((mesure) => (
                <div key={mesure.idMesure} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{formaterDate(mesure.dateMesure)}</p>
                    <p className="text-xs text-slate-400">
                      {mesure.distance !== null && mesure.distance !== undefined ? t("superviseurHistoriques.distanceLabel", { n: Number(mesure.distance) }) : t("superviseurHistoriques.distanceInconnue")}
                      {mesure.qualiteMesure ? ` · ${mesure.qualiteMesure.toLowerCase()}` : ""}
                    </p>
                  </div>
                  <EtatBadge niveau={mesure.pourcentage} />
                  <span className="w-12 shrink-0 text-right text-sm font-bold text-slate-900">
                    {Math.round(Number(mesure.pourcentage) || 0)}%
                  </span>
                </div>
              ))
            )}
          </Card>
          {mesures.length > 50 && (
            <p className="text-center text-xs text-slate-400">{t("superviseurHistoriques.mesuresRecentesAffichees", { n: 50, total: mesures.length })}</p>
          )}
        </>
      )}
    </div>
  );
}

