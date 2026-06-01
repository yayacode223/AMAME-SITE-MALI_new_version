export interface Partenaire {
  id: number;
  nom: string;
  type?: string;
  description?: string;
  siteWeb?: string;
  ordre?: number;
  isActif?: boolean;
  filePath?: string;
}

export interface PartenaireRequest {
  nom: string;
  type?: string;
  description?: string;
  siteWeb?: string;
  ordre?: number;
  isActif?: boolean;
}
