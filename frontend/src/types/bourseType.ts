
export interface BourseSummary {
    id: number;
    titre: string;
    descriptionCourte: string;
    bailleur?: string;
    paysHote?: string;
    niveau?: string;
    categorie?: string;
    financementStatut?: string;
    organisation?: string;
    dateLimite?: string;
    filePath?: string;
}

export interface BourseDetail extends BourseSummary {
    descriptionLongue?: string;
    nombresVues?: number;
    financement?: string;
    paysEligible?: string;
    regionEligible?: string;
    lienSiteOfficiel?: string;
    urlSource?: string;
    datePublication?: string;
    filePath?: string;
}

export interface BourseResponsePaginated {
    bourseSummaryDtos: BourseSummary[];
    currentPage: number;
    totalPages: number;
    totalElements: number;
    pageSize: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

export interface BourseDefaultSearchParams {
    size?: number;
    page?: number;
    sortBy?: string;
    sortDirection?: string;
}

export interface BourseFilterParams extends BourseDefaultSearchParams {
    categorie?: string;
    niveau?: string;
    pays?: string;
}

export interface BourseSearchRequest extends BourseDefaultSearchParams {
    titre?: string;
    description?: string;
    pays?: string;
}

// Types pour la création et modification
export interface BourseCreationRequest {
    titre: string;
    descriptionCourte: string;
    descriptionLongue: string;
    bailleur: string;
    paysHote: string;
    niveau: string;
    categorie: string;
    financementStatut: string;
    organisation: string;
    dateLimite: string;
    financement: string;
    paysEligible: string;
    regionEligible: string;
    lienSiteOfficiel: string;
    urlSource: string;
}

export interface BourseUpdateRequest extends BourseCreationRequest {
    id: number;
}