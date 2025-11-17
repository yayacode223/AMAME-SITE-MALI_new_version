export interface RegisterResponse {
    id: number; 
    nom : string; 
    prenom: string; 
    email: string;  
    birthDay? : string; 
    ville? : string; 
    sexe : Sexe; 
    adresse? : string, 
    imagePath ? : string; 
    phone? : string; 
    cvPath? : string;
    role? : Role;
    pays?: string; 
    niveauEtude?: string; 
    codePostal? : number; 
}

export interface RegisterType {
    nom: string; 
    prenom :string; 
    email: string; 
    password: string; 
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

export interface RegisterUpdatePayload extends RegisterPayload {
    id : number
}

export interface LoginType {
    email:string; 
    password: string; 
}

export type  Role = "USER" | "ADMIN" ; 
export type Sexe = "HOMME" | "FEMME" ; 

export const UserRole = {
  USER: "USER" as Role,
  ADMIN: "ADMIN" as Role
};