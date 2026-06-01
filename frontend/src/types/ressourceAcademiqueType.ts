export interface RessourceAcademique {
  id: number;
  titre: string;
  description?: string;
  type?: string;
  niveau?: string;
  ordre?: number;
  isActif?: boolean;
  filePath?: string;
}

export interface RessourceAcademiqueRequest {
  titre: string;
  description?: string;
  type?: string;
  niveau?: string;
  ordre?: number;
  isActif?: boolean;
}
