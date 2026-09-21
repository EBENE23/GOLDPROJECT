import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, Trash2 } from "lucide-react";

import BacCard from "../../components/BacCard";
import {
  BandeauErreur,
  Card,
  Chargement,
  EtatVide,
  FilterChips,
  PageHeader,
  SecondaryButton,
  etatMeta,
} from "../../components/ui/kit";
import {
  listerBacsSuperviseur,
  listerInterventionsSuperviseur,
  type Bac,
  type Intervention,
} from "../../services/superviseurService";
import { obtenirCategorieNiveauBac, type BacLevelCategory } from "../../utils/bacLevel";
import { useTempsReel } from "../../hooks/useTempsReel";

type Filtre = "TOUS" | BacLevelCategory;

const STATUTS_ACTIFS = ["EN_ATTENTE", "PLANIFIEE", "EN_COURS"];

const Bacs = () => {
  const [bacs, setBacs] = useState<Bac[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [filtre, setFiltre] = useState<Filtre>("TOUS");
  const [recherche, setRecherche] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const charger = useCallback(async (actualisation = false) => {
    try {
      setError("");
      if (actualisation) setRefreshing(true);
      const [reponseBacs, reponseInterventions] = await Promise.all([
        listerBacsSuperviseur(),
        listerInterventionsSuperviseur(),
      ]);
      setBacs(reponseBacs.bacs);
      setInterventions(reponseInterventions.interventions);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Impossible de charger les bacs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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

  const compte = (categorie: BacLevelCategory) =>
    bacs.filter((bac) => obtenirCategorieNiveauBac(bac.niveau_remplissage) === categorie).length;

  const visibles = useMemo(() => {
    const terme = recherche.trim().toLowerCase();

    return bacs
      .filter((bac) => filtre === "TOUS" || obtenirCategorieNiveauBac(bac.niveau_remplissage) === filtre)
      .filter((bac) => !terme || bac.reference.toLowerCase().includes(terme))
      .sort((a, b) => Number(b.niveau_remplissage) - Number(a.niveau_remplissage));
  }, [bacs, filtre, recherche]);

  if (loading) return <Chargement texte="Chargement des bacs..." />;

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Superviser les bacs"
        description="État de remplissage des bacs de votre zone, mis à jour automatiquement."
        actions={
          <SecondaryButton icone={RefreshCw} chargement={refreshing} onClick={() => charger(true)}>
            Actualiser
          </SecondaryButton>
        }
      />

      {error && <BandeauErreur message={error} onReessayer={() => charger()} />}

      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={recherche}
          onChange={(event) => setRecherche(event.target.value)}
          placeholder="Rechercher un bac par référence"
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
        />
      </div>

      <FilterChips
        valeur={filtre}
        onChange={setFiltre}
        options={[
          { valeur: "TOUS", libelle: "Tous", compteur: bacs.length },
          { valeur: "PLEIN", libelle: "Critiques", compteur: compte("PLEIN"), couleur: etatMeta.PLEIN.couleur },
          { valeur: "ALERTE", libelle: "Alertes", compteur: compte("ALERTE"), couleur: etatMeta.ALERTE.couleur },
          { valeur: "NORMAL", libelle: "Normaux", compteur: compte("NORMAL"), couleur: etatMeta.NORMAL.couleur },
        ]}
      />

      {visibles.length === 0 ? (
        <Card>
          <EtatVide
            icone={Trash2}
            titre="Aucun bac trouvé"
            description={bacs.length === 0 ? "Aucun bac n'est enregistré dans votre zone." : "Modifiez la recherche ou le filtre."}
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

export default Bacs;
