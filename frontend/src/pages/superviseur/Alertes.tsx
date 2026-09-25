import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BellRing, RefreshCw, Siren } from "lucide-react";

import BacCard from "../../components/BacCard";
import {
  BandeauErreur,
  Card,
  Chargement,
  EtatVide,
  FilterChips,
  KpiCard,
  PageHeader,
  SecondaryButton,
  etatMeta,
} from "../../components/ui/kit";
import {
  listerInterventionsSuperviseur,
  obtenirAlertesSuperviseur,
  type Bac,
  type Intervention,
} from "../../services/superviseurService";
import { obtenirCategorieNiveauBac } from "../../utils/bacLevel";
import { useTempsReel } from "../../hooks/useTempsReel";
import { useTranslation } from "../../i18n";

type Filtre = "TOUTES" | "PLEIN" | "ALERTE";

const STATUTS_ACTIFS = ["EN_ATTENTE", "PLANIFIEE", "EN_COURS"];

const Alertes = () => {
  const { t } = useTranslation();
  const [alertes, setAlertes] = useState<Bac[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [filtre, setFiltre] = useState<Filtre>("TOUTES");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const charger = useCallback(async (actualisation = false) => {
    try {
      setError("");
      if (actualisation) setRefreshing(true);
      const [reponseAlertes, reponseInterventions] = await Promise.all([
        obtenirAlertesSuperviseur(),
        listerInterventionsSuperviseur(),
      ]);
      setAlertes(reponseAlertes.alertes ?? []);
      setInterventions(reponseInterventions.interventions ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message || t("superviseurAlertes.erreurChargement"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    charger();
    const intervalle = window.setInterval(() => charger(), 15000);
    return () => window.clearInterval(intervalle);
  }, [charger]);

  useTempsReel(() => charger());

  const interventionParBac = useMemo(() => {
    const table = new Map<number, string>();
    interventions.forEach((item) => {
      if (STATUTS_ACTIFS.includes(item.statut)) table.set(item.id_bac, item.statut);
    });
    return table;
  }, [interventions]);

  const critiques = alertes.filter((bac) => obtenirCategorieNiveauBac(bac.niveau_remplissage) === "PLEIN").length;
  const enAlerte = alertes.length - critiques;

  const visibles = useMemo(
    () =>
      alertes
        .filter((bac) => filtre === "TOUTES" || obtenirCategorieNiveauBac(bac.niveau_remplissage) === filtre)
        .sort((a, b) => Number(b.niveau_remplissage) - Number(a.niveau_remplissage)),
    [alertes, filtre]
  );

  if (loading) return <Chargement texte={t("superviseurAlertes.chargement")} />;

  return (
    <div className="space-y-5">
      <PageHeader
        titre={t("shell.navAlertes")}
        description={t("superviseurAlertes.description")}
        actions={
          <SecondaryButton icone={RefreshCw} chargement={refreshing} onClick={() => charger(true)}>
            {t("adminDemandes.actualiser")}
          </SecondaryButton>
        }
      />

      {error && <BandeauErreur message={error} onReessayer={() => charger()} />}

      <div className="grid grid-cols-3 gap-3 lg:gap-4">
        <KpiCard libelle={t("shell.navAlertes")} valeur={alertes.length} icone={BellRing} teinte="gris" />
        <KpiCard libelle={t("superviseurDashboard.kpiCritiques")} valeur={critiques} icone={Siren} teinte="rouge" />
        <KpiCard libelle={t("adminBacs.kpiAlerte")} valeur={enAlerte} icone={AlertTriangle} teinte="orange" />
      </div>

      <FilterChips
        valeur={filtre}
        onChange={setFiltre}
        options={[
          { valeur: "TOUTES", libelle: t("adminDemandes.filtreToutes"), compteur: alertes.length },
          { valeur: "PLEIN", libelle: t("superviseurDashboard.kpiCritiques"), compteur: critiques, couleur: etatMeta.PLEIN.couleur },
          { valeur: "ALERTE", libelle: t("adminBacs.kpiAlerte"), compteur: enAlerte, couleur: etatMeta.ALERTE.couleur },
        ]}
      />

      {visibles.length === 0 ? (
        <Card>
          <EtatVide
            icone={BellRing}
            titre={t("superviseurAlertes.aucuneAlerteActive")}
            description={t("superviseurAlertes.tousLesBacsSousLeSeuil")}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibles.map((bac) => (
            <BacCard key={bac.id_bac} bac={bac} interventionActive={interventionParBac.get(bac.id_bac)} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Alertes;
