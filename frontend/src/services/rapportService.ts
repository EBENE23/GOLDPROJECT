import api from "./api";

export interface RapportBac {
  id_bac: number;
  reference: string;
  niveau_remplissage: number | string;
  etat: "NORMAL" | "ALERTE" | "PLEIN";
  latitude?: number | string | null;
  longitude?: number | string | null;
  id_zone: number;
  zone?: {
    idZone: number;
    nomZone: string;
    description?: string | null;
  };
}

export interface RapportZone {
  idZone: number;
  nomZone: string;
  description?: string | null;
  superviseur?: {
    idUtilisateur: number;
    nom: string;
    prenom: string;
    email?: string;
    telephone?: string | null;
    statutCompte?: string;
  } | null;
  bacs?: RapportBac[];
  agents?: {
    idUtilisateur: number;
    nom: string;
    prenom: string;
    email?: string;
    telephone?: string | null;
    statutCompte?: string;
    role?: string;
  }[];
}

export interface RapportIntervention {
  idIntervention: number;
  dateCreation?: string;
  datePrevue?: string | null;
  priorite:
    | "NORMALE"
    | "MOYENNE"
    | "HAUTE"
    | "CRITIQUE";
  motif?: string | null;
  statut:
    | "EN_ATTENTE"
    | "PLANIFIEE"
    | "EN_COURS"
    | "TERMINEE"
    | "ANNULEE";
  id_bac: number;
  id_superviseur: number;
  bac?: RapportBac;
  superviseur?: {
    idUtilisateur: number;
    nom: string;
    prenom: string;
    email?: string;
    role?: string;
  };
  mission?: {
    idMission: number;
    dateAffectation?: string;
    dateDebut?: string | null;
    dateFin?: string | null;
    statut:
      | "AFFECTEE"
      | "EN_COURS"
      | "SUSPENDUE"
      | "TERMINEE"
      | "ANNULEE";
    id_intervention: number;
    id_agent: number;
    agent?: {
      idUtilisateur: number;
      nom: string;
      prenom: string;
      email?: string;
      telephone?: string | null;
      role?: string;
      statutCompte?: string;
    };
  } | null;
}

export interface DonneesRapport {
  bacs: RapportBac[];
  interventions: RapportIntervention[];
  zones: RapportZone[];
}

export interface PeriodeRapport {
  debut: Date;
  fin: Date;
}

const normaliserTableau = <T>(
  donnees: unknown
): T[] => {
  if (Array.isArray(donnees)) {
    return donnees as T[];
  }

  return [];
};

const dateValide = (
  valeur?: string | null
) => {
  if (!valeur) {
    return null;
  }

  const date = new Date(valeur);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

export const listerBacsRapport =
  async (): Promise<RapportBac[]> => {
    const response = await api.get(
      "/bacs"
    );

    return normaliserTableau<RapportBac>(
      response.data
    );
  };

export const listerInterventionsRapport =
  async (): Promise<
    RapportIntervention[]
  > => {
    const response = await api.get(
      "/interventions"
    );

    if (
      Array.isArray(response.data)
    ) {
      return response.data;
    }

    return normaliserTableau<RapportIntervention>(
      response.data?.interventions
    );
  };

export const listerZonesRapport =
  async (): Promise<RapportZone[]> => {
    const response = await api.get(
      "/zones"
    );

    return normaliserTableau<RapportZone>(
      response.data
    );
  };

export const obtenirDonneesRapport =
  async (): Promise<DonneesRapport> => {
    const [
      bacs,
      interventions,
      zones,
    ] = await Promise.all([
      listerBacsRapport(),
      listerInterventionsRapport(),
      listerZonesRapport(),
    ]);

    return {
      bacs,
      interventions,
      zones,
    };
  };

export const obtenirPeriodeRapport =
  (
    nombreJours: number
  ): PeriodeRapport => {
    const fin = new Date();

    const debut = new Date(fin);

    debut.setDate(
      debut.getDate() - nombreJours
    );

    debut.setHours(
      0,
      0,
      0,
      0
    );

    return {
      debut,
      fin,
    };
  };

export const filtrerInterventionsParPeriode =
  (
    interventions: RapportIntervention[],
    nombreJours: number
  ): RapportIntervention[] => {
    const {
      debut,
      fin,
    } = obtenirPeriodeRapport(
      nombreJours
    );

    return interventions.filter(
      (intervention) => {
        const date =
          dateValide(
            intervention.dateCreation
          );

        if (!date) {
          return false;
        }

        return (
          date >= debut &&
          date <= fin
        );
      }
    );
  };

export const calculerStatistiquesRapport =
  (
    bacs: RapportBac[],
    interventions: RapportIntervention[],
    zones: RapportZone[]
  ) => {
    const totalBacs =
      bacs.length;

    const bacsNormaux =
      bacs.filter(
        (bac) =>
          bac.etat ===
          "NORMAL"
      ).length;

    const bacsAlerte =
      bacs.filter(
        (bac) =>
          bac.etat ===
          "ALERTE"
      ).length;

    const bacsPleins =
      bacs.filter(
        (bac) =>
          bac.etat ===
          "PLEIN"
      ).length;

    const remplissages =
      bacs
        .map((bac) =>
          Number(
            bac.niveau_remplissage
          )
        )
        .filter((niveau) =>
          Number.isFinite(
            niveau
          )
        );

    const remplissageMoyen =
      remplissages.length > 0
        ? remplissages.reduce(
            (
              total,
              niveau
            ) =>
              total + niveau,
            0
          ) /
          remplissages.length
        : 0;

    const interventionsEnAttente =
      interventions.filter(
        (intervention) =>
          intervention.statut ===
          "EN_ATTENTE"
      ).length;

    const interventionsPlanifiees =
      interventions.filter(
        (intervention) =>
          intervention.statut ===
          "PLANIFIEE"
      ).length;

    const interventionsEnCours =
      interventions.filter(
        (intervention) =>
          intervention.statut ===
          "EN_COURS"
      ).length;

    const interventionsTerminees =
      interventions.filter(
        (intervention) =>
          intervention.statut ===
          "TERMINEE"
      ).length;

    const interventionsAnnulees =
      interventions.filter(
        (intervention) =>
          intervention.statut ===
          "ANNULEE"
      ).length;

    const interventionsNormales =
      interventions.filter(
        (intervention) =>
          intervention.priorite ===
          "NORMALE"
      ).length;

    const interventionsMoyennes =
      interventions.filter(
        (intervention) =>
          intervention.priorite ===
          "MOYENNE"
      ).length;

    const interventionsHautes =
      interventions.filter(
        (intervention) =>
          intervention.priorite ===
          "HAUTE"
      ).length;

    const interventionsCritiques =
      interventions.filter(
        (intervention) =>
          intervention.priorite ===
          "CRITIQUE"
      ).length;

    return {
      totalBacs,
      bacsNormaux,
      bacsAlerte,
      bacsPleins,
      remplissageMoyen,
      totalZones:
        zones.length,
      totalInterventions:
        interventions.length,
      interventionsEnAttente,
      interventionsPlanifiees,
      interventionsEnCours,
      interventionsTerminees,
      interventionsAnnulees,
      interventionsNormales,
      interventionsMoyennes,
      interventionsHautes,
      interventionsCritiques,
    };
  };

export const obtenirInterventionsRecentes =
  (
    interventions: RapportIntervention[],
    limite = 10
  ): RapportIntervention[] => {
    return [
      ...interventions,
    ]
      .sort((a, b) => {
        const dateA =
          dateValide(
            a.dateCreation
          )?.getTime() || 0;

        const dateB =
          dateValide(
            b.dateCreation
          )?.getTime() || 0;

        return dateB - dateA;
      })
      .slice(0, limite);
  };