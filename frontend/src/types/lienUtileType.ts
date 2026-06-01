export interface LienUtile {
  id: number;
  titre: string;
  description?: string;
  url: string;
  categorie?: string;
  ordre?: number;
  isActif?: boolean;
}

export interface LienUtileRequest {
  titre: string;
  description?: string;
  url: string;
  categorie?: string;
  ordre?: number;
  isActif?: boolean;
}
