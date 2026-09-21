import { useNavigate } from "react-router-dom";
import { ClipboardPlus, Map as MapIcon, MapPin, Ruler } from "lucide-react";

import { Card, EtatBadge, LevelRing, PrimaryButton, RefPill, SecondaryButton, StatutBadge, libelleStatut, tonStatut } from "./ui/kit";
import type { Bac } from "../services/superviseurService";
import { obtenirCategorieNiveauBac } from "../utils/bacLevel";

interface BacCardProps {
  bac: Bac;
  // Statut de l'intervention active liée à ce bac, s'il y en a une.
  interventionActive?: string;
}

/** Carte d'un bac : niveau, état, position et actions du superviseur. */
export default function BacCard({ bac, interventionActive }: BacCardProps) {
  const navigate = useNavigate();
  const categorie = obtenirCategorieNiveauBac(bac.niveau_remplissage);
  const aTraiter = categorie !== "NORMAL";
  const aPosition = bac.latitude !== null && bac.latitude !== undefined && bac.longitude !== null && bac.longitude !== undefined;

  return (
    <Card severite={categorie} className="flex flex-col p-4 sm:p-5">
      <div className="flex items-center gap-4">
        <LevelRing niveau={bac.niveau_remplissage} taille={72} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <RefPill>#{bac.reference}</RefPill>
            <EtatBadge niveau={bac.niveau_remplissage} />
          </div>
          {aPosition && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin size={13} className="shrink-0" />
              {Number(bac.latitude).toFixed(4)}° N, {Number(bac.longitude).toFixed(4)}° E
            </p>
          )}
          {(bac.capacite || bac.hauteur) && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <Ruler size={13} className="shrink-0" />
              {bac.capacite ? `${Number(bac.capacite)} L` : ""}
              {bac.capacite && bac.hauteur ? " · " : ""}
              {bac.hauteur ? `hauteur ${Number(bac.hauteur)} cm` : ""}
            </p>
          )}
        </div>
      </div>

      {interventionActive && (
        <div className="mt-3">
          <StatutBadge ton={tonStatut(interventionActive)}>
            Intervention {libelleStatut(interventionActive).toLowerCase()}
          </StatutBadge>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
        {aTraiter && !interventionActive ? (
          <PrimaryButton
            icone={ClipboardPlus}
            className="col-span-2"
            onClick={() => navigate(`/superviseur/interventions?ouvrir=1&bac=${bac.id_bac}`)}
          >
            Créer une intervention
          </PrimaryButton>
        ) : null}
        <SecondaryButton icone={MapIcon} onClick={() => navigate("/superviseur/localisation")} disabled={!aPosition}>
          Localiser
        </SecondaryButton>
        <SecondaryButton onClick={() => navigate("/superviseur/historiques")}>Historique</SecondaryButton>
      </div>
    </Card>
  );
}
