export interface Partenaire {
  id: number;
  nom: string;
  type?: string;
  description?: string;
  siteWeb?: string;
  ordre?: number;
  isActif?: boolean;
  filePath?: string;
  /** URL d'affichage calculée par le backend — à utiliser à la place de filePath. */
  fileUrl?: string;
}

export interface PartenaireRequest {
  nom: string;
  type?: string;
  description?: string;
  siteWeb?: string;
  ordre?: number;
  isActif?: boolean;
}
