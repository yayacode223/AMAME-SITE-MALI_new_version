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
