export interface GalerieSummary {
  id: number;
  titre: string;
  descriptionCourte?: string;
  lieu?: string;
  dateEvenement?: string;
  estPublie: boolean;
  dateCreation: string;
  coverImagePath?: string;
  /** URL d'affichage calculée par le backend — à utiliser à la place de coverImagePath. */
  coverImageUrl?: string;
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
  /** URL d'affichage calculée par le backend — à utiliser à la place de coverImagePath. */
  coverImageUrl?: string;
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
