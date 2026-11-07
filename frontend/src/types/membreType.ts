export interface Membre {
  id: number;
  prenom: string;
  nom: string;
  poste: string;
  bio?: string;
  email?: string;
  ordre?: number;
  isActif?: boolean;
  filePath?: string;
  /** URL d'affichage calculée par le backend — à utiliser à la place de filePath. */
  fileUrl?: string;
}

export interface MembreRequest {
  prenom: string;
  nom: string;
  poste: string;
  bio?: string;
  email?: string;
  ordre?: number;
  isActif?: boolean;
}
