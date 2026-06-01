export interface GalerieSummary {
  id: number;
  titre: string;
  descriptionCourte?: string;
  lieu?: string;
  dateEvenement?: string;
  estPublie: boolean;
  dateCreation: string;
  coverImagePath?: string;
}

export interface GalerieDetail {
  id: number;
  titre: string;
  description?: string;
  lieu?: string;
  dateEvenement?: string;
  estPublie: boolean;
  dateCreation: string;
  dateModification?: string;
  coverImagePath?: string;
}

export interface GalerieCreationRequest {
  titre: string;
  description?: string;
  lieu?: string;
  dateEvenement?: string;
}

export interface GalerieUpdateRequest {
  id: number;
  titre: string;
  description?: string;
  lieu?: string;
  dateEvenement?: string;
  estPublie: boolean;
  coverImagePath?: string;
}
