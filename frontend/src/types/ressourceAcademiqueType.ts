export interface RessourceAcademique {
  id: number;
  titre: string;
  description?: string;
  type?: string;
  niveau?: string;
  ordre?: number;
  isActif?: boolean;
  filePath?: string;
  /** URL d'affichage calculée par le backend — à utiliser à la place de filePath. */
  fileUrl?: string;
}

export interface RessourceAcademiqueRequest {
  titre: string;
  description?: string;
  type?: string;
  niveau?: string;
  ordre?: number;
  isActif?: boolean;
}
