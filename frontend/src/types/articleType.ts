export interface ArticleCreationRequest {
  titre: string;
  contenu: string;
  auteur: string;
  categorie: string;
  tempsLecture: number;
  tags: string[];
  metaDescription: string;
  metaKeywords: string;
}

export interface ArticleUpdateRequest {
  titre: string;
  contenu: string;
  auteur: string;
  categorie: string;
  tempsLecture: number;
  tags: string[];
  metaDescription: string;
  metaKeywords: string;
  estPublie: boolean;
}

export interface ArticleSummaryResponse {
  id: number;
  titre: string;
  slug: string;
  auteur: string;
  categorie: string;
  filePath: string;
  vues: number;
  tempsLecture: number;
  datePublication: string;
  resume: string;
  estPublie: boolean;
}

export interface ArticleDetailResponse {
  id: number;
  titre: string;
  slug: string;
  contenu: string;
  auteur: string;
  categorie: string;
  filePath: string;
  vues: number;
  tempsLecture: number;
  datePublication: string;
  dateModification: string;
  tags: string[];
  metaDescription: string;
  metaKeywords: string;
  estPublie: boolean;
}

export interface SearchArticlesParams {
  search?: string;
  categorie?: string;
  sortBy?: string;
}
