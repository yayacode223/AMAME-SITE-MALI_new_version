export interface RegisterResponse {
    id: number; 
    nom : string; 
    prenom: string; 
    email: string;  
    etablissement? : string; 
    filiere_serie? : string; 
    birthDay? : string; 
    ville? : string; 
    sexe : Sexe; 
    adresse? : string, 
    imagePath ? : string; 
    numero? : string; 
    cvPath? : string;
    roles : Role [];
}

export interface RegisterType {
    nom: string; 
    prenom :string; 
    email: string; 
    password: string; 
    etablissement?:string; 
    filierId?: number; 
    birthDay? : string; 
    ville?: string; 
    sexe?: Sexe; 
    adresse?: string; 
    phone?: string; 
    pays : string; 
    codePostal: number;
    niveauEtude : string;       
}

export interface RegisterPayload {
    user : RegisterType; 
    cv : File; 
    image: File; 
}

export interface LoginType {
    email:string; 
    password: string; 
}

export type  Role = "USER" | "MEMBER" | "ADMIN" | "EDITOR"; 
export type Sexe = "MASCULIN" | "FEMININ"; 

