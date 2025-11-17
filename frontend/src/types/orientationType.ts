// Enums pour correspondre au backend
export enum DomaineFiliereType {
  ALL = "ALL",
  SCIENCES_ET_TECHNOLOGIES = "SCIENCES_ET_TECHNOLOGIES",
  SCIENCES_DE_LA_SANTE = "SCIENCES_DE_LA_SANTE",
  SCIENCES_ECONOMIQUES_ET_GESTION = "SCIENCES_ECONOMIQUES_ET_GESTION",
  DROIT_ET_SCIENCES_POLITIQUES = "DROIT_ET_SCIENCES_POLITIQUES",
  LETTRES_ET_SCIENCES_HUMAINES = "LETTRES_ET_SCIENCES_HUMAINES",
  ARTS_ET_COMMUNICATION = "ARTS_ET_COMMUNICATION"
}

export enum DifficulteType {
  TRES_ELEVEE = "TRES_ELEVEE",
  ELEVEE = "ELEVEE", 
  MOYENNE = "MOYENNE",
  VARIABLE = "VARIABLE"
}

export enum DemandeType {
  TRES_FORTE = "TRES_FORTE",
  FORTE = "FORTE",
  MOYENNE = "MOYENNE", 
  CROISSANTE = "CROISSANTE",
  VARIABLE = "VARIABLE"
}

export enum SalaireType {
  TRES_ELEVE = "TRES_ELEVE",
  ELEVE = "ELEVE",
  MOYEN_ELEVE = "MOYEN_ELEVE",
  MOYEN = "MOYEN",
  VARIABLE = "VARIABLE"
}

// DTOs pour l'affichage
export interface FiliereSummaryResponse {
  id: number;
  nom: string;
  descriptionCourte: string;
  icone: string;
  domaine: DomaineFiliereType;
  difficulte: DifficulteType;
  demande: DemandeType;
  salaire: SalaireType;
  dureeEtudes: string;
  debouches: string[];
  filePath: string;
}

export interface FiliereDetailResponse {
  id: number;
  nom: string;
  descriptionCourte: string;
  descriptionLongue: string;
  icone: string;
  domaine: DomaineFiliereType;
  difficulte: DifficulteType;
  demande: DemandeType;
  salaire: SalaireType;
  dureeEtudes: string;
  tauxEmploi: string;
  salaireDebut: string;
  salaireExperience: string;
  perspectives: string;
  debouches: string[];
  competences: string[];
  universites: string[];
  prerequis: string[];
  filePath: string;
}

// DTOs pour la création et modification
export interface FiliereCreationRequest {
  nom: string;
  descriptionCourte: string;
  descriptionLongue: string;
  domaine: DomaineFiliereType;
  difficulte: DifficulteType;
  demande: DemandeType;
  salaire: SalaireType;
  dureeEtudes: string;
  tauxEmploi: string;
  salaireDebut: string;
  salaireExperience: string;
  perspectives: string;
  debouches: string[];
  competences: string[];
  universites: string[];
  prerequis: string[];
}

export interface FiliereUpdateRequest extends FiliereCreationRequest {
  id: number;
}

export interface SearchFilieresParams {
  search?: string;
  domaine?: string;
}