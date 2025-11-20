export type NiveauType = "PRIMAIRE" | "SECONDAIRE" | "LYCEE" | "BACHELIER" | "LICENCE" | "MASTER" | "DOCTORAT" | "BAC_2" |"AUTRE"; 
export type StatusType = "NATIONAL" | "INTERNATIONAL";

export interface ConcoursRequest {
    nom: string; 
    description: string; 
    pays: string;
    niveau: NiveauType;
    status: StatusType;
    dateOuverture: string;
    dateLimite: string;
    lienOfficiel: string;
}

export interface ConcoursResponse extends ConcoursRequest {
    id: number;
    isAvailable: boolean;
    filePath: string;
}

export interface ConcoursResponsePaginated {
    concours: ConcoursResponse[];
    currentPage: number;
    totalPages: number;
    totalElements: number;
    pageSize: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

export interface ConcoursDefaultSearchParams {
    size?: number;  
    page?: number;
    sortBy?: string; 
    sortDirection?: string; 
}

export interface ConcoursFilterParams extends ConcoursDefaultSearchParams {
    niveau?: NiveauType; 
    status?: StatusType; 
    search?: string;
}

// Types pour la création et modification
export interface ConcoursCreationRequest {
    nom: string;
    description: string;
    pays: string;
    niveau: NiveauType;
    status: StatusType;
    dateOuverture: string;
    dateLimite: string;
    lienOfficiel: string;
}

export interface ConcoursUpdateRequest extends ConcoursCreationRequest {
    id: number;
    isAvailable: boolean;
}