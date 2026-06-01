import { NiveauType } from "@/types/concoursType";

// ── Rôles (6 niveaux hiérarchiques) ─────────────────────────────────────────
export type Role =
  | "SUPERADMIN"
  | "ADMIN"
  | "EDITOR"
  | "MEMBER"
  | "USER"
  | "VISITOR";

export const UserRole = {
  SUPERADMIN: "SUPERADMIN" as Role,
  ADMIN:      "ADMIN"      as Role,
  EDITOR:     "EDITOR"     as Role,
  MEMBER:     "MEMBER"     as Role,
  USER:       "USER"       as Role,
  VISITOR:    "VISITOR"    as Role,
};

export const ROLE_LABELS: Record<Role, string> = {
  SUPERADMIN: "Super Admin",
  ADMIN:      "Administrateur",
  EDITOR:     "Éditeur",
  MEMBER:     "Membre",
  USER:       "Utilisateur",
  VISITOR:    "Visiteur",
};

// ── Permissions (nom exact de l'enum Java) ───────────────────────────────────
export type Permission =
  | "DASHBOARD_ACCESS"
  | "ARTICLE_CREATE"   | "ARTICLE_EDIT"   | "ARTICLE_DELETE"
  | "BOURSE_CREATE"    | "BOURSE_EDIT"    | "BOURSE_DELETE"
  | "CONCOURS_CREATE"  | "CONCOURS_EDIT"  | "CONCOURS_DELETE"
  | "FILIERE_CREATE"   | "FILIERE_EDIT"   | "FILIERE_DELETE"
  | "ETABLISSEMENT_CREATE" | "ETABLISSEMENT_EDIT" | "ETABLISSEMENT_DELETE"
  | "MEMBRE_CREATE"    | "MEMBRE_EDIT"    | "MEMBRE_DELETE"
  | "PARTENAIRE_CREATE"| "PARTENAIRE_EDIT"| "PARTENAIRE_DELETE"
  | "LIEN_UTILE_CREATE"| "LIEN_UTILE_EDIT"| "LIEN_UTILE_DELETE"
  | "RESSOURCE_CREATE" | "RESSOURCE_EDIT" | "RESSOURCE_DELETE"
  | "OPPORTUNITE_CREATE"| "OPPORTUNITE_EDIT"| "OPPORTUNITE_DELETE"
  | "GALERIE_CREATE"   | "GALERIE_EDIT"   | "GALERIE_DELETE"
  | "USER_READ_ALL"    | "USER_EDIT_ANY"  | "USER_DELETE"
  | "USER_MANAGE_ROLES"| "USER_GRANT_PERMISSIONS"
  | "ADHESION_MANAGE";

export const PERMISSION_LABELS: Record<Permission, string> = {
  DASHBOARD_ACCESS:        "Accès au tableau de bord",
  ARTICLE_CREATE:          "Créer un article",
  ARTICLE_EDIT:            "Modifier un article",
  ARTICLE_DELETE:          "Supprimer un article",
  BOURSE_CREATE:           "Créer une bourse",
  BOURSE_EDIT:             "Modifier une bourse",
  BOURSE_DELETE:           "Supprimer une bourse",
  CONCOURS_CREATE:         "Créer un concours",
  CONCOURS_EDIT:           "Modifier un concours",
  CONCOURS_DELETE:         "Supprimer un concours",
  FILIERE_CREATE:          "Créer une filière",
  FILIERE_EDIT:            "Modifier une filière",
  FILIERE_DELETE:          "Supprimer une filière",
  ETABLISSEMENT_CREATE:    "Créer un établissement",
  ETABLISSEMENT_EDIT:      "Modifier un établissement",
  ETABLISSEMENT_DELETE:    "Supprimer un établissement",
  MEMBRE_CREATE:           "Créer un membre",
  MEMBRE_EDIT:             "Modifier un membre",
  MEMBRE_DELETE:           "Supprimer un membre",
  PARTENAIRE_CREATE:       "Créer un partenaire",
  PARTENAIRE_EDIT:         "Modifier un partenaire",
  PARTENAIRE_DELETE:       "Supprimer un partenaire",
  LIEN_UTILE_CREATE:       "Créer un lien utile",
  LIEN_UTILE_EDIT:         "Modifier un lien utile",
  LIEN_UTILE_DELETE:       "Supprimer un lien utile",
  RESSOURCE_CREATE:        "Créer une ressource académique",
  RESSOURCE_EDIT:          "Modifier une ressource académique",
  RESSOURCE_DELETE:        "Supprimer une ressource académique",
  OPPORTUNITE_CREATE:      "Créer une opportunité",
  OPPORTUNITE_EDIT:        "Modifier une opportunité",
  OPPORTUNITE_DELETE:      "Supprimer une opportunité",
  GALERIE_CREATE:          "Ajouter à la galerie",
  GALERIE_EDIT:            "Modifier la galerie",
  GALERIE_DELETE:          "Supprimer de la galerie",
  USER_READ_ALL:           "Voir tous les utilisateurs",
  USER_EDIT_ANY:           "Modifier n'importe quel utilisateur",
  USER_DELETE:             "Supprimer un utilisateur",
  USER_MANAGE_ROLES:       "Gérer les rôles utilisateurs",
  USER_GRANT_PERMISSIONS:  "Accorder ou révoquer des permissions",
  ADHESION_MANAGE:         "Gérer les demandes d'adhésion",
};

/** Permissions regroupées par module (pour l'UI). */
export const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] = [
  { label: "Tableau de bord", permissions: ["DASHBOARD_ACCESS"] },
  { label: "Articles",        permissions: ["ARTICLE_CREATE", "ARTICLE_EDIT", "ARTICLE_DELETE"] },
  { label: "Bourses",         permissions: ["BOURSE_CREATE", "BOURSE_EDIT", "BOURSE_DELETE"] },
  { label: "Concours",        permissions: ["CONCOURS_CREATE", "CONCOURS_EDIT", "CONCOURS_DELETE"] },
  { label: "Filières",        permissions: ["FILIERE_CREATE", "FILIERE_EDIT", "FILIERE_DELETE"] },
  { label: "Établissements",  permissions: ["ETABLISSEMENT_CREATE", "ETABLISSEMENT_EDIT", "ETABLISSEMENT_DELETE"] },
  { label: "Membres",         permissions: ["MEMBRE_CREATE", "MEMBRE_EDIT", "MEMBRE_DELETE"] },
  { label: "Partenaires",     permissions: ["PARTENAIRE_CREATE", "PARTENAIRE_EDIT", "PARTENAIRE_DELETE"] },
  { label: "Liens utiles",    permissions: ["LIEN_UTILE_CREATE", "LIEN_UTILE_EDIT", "LIEN_UTILE_DELETE"] },
  { label: "Ressources",      permissions: ["RESSOURCE_CREATE", "RESSOURCE_EDIT", "RESSOURCE_DELETE"] },
  { label: "Opportunités",    permissions: ["OPPORTUNITE_CREATE", "OPPORTUNITE_EDIT", "OPPORTUNITE_DELETE"] },
  { label: "Galerie",         permissions: ["GALERIE_CREATE", "GALERIE_EDIT", "GALERIE_DELETE"] },
  {
    label: "Gestion utilisateurs",
    permissions: ["USER_READ_ALL", "USER_EDIT_ANY", "USER_DELETE", "USER_MANAGE_ROLES", "USER_GRANT_PERMISSIONS"],
  },
  { label: "Adhésions", permissions: ["ADHESION_MANAGE"] },
];

// ── DTOs utilisateur ──────────────────────────────────────────────────────────

export interface RegisterResponse {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  birthDate?: string;
  ville?: string;
  sexe: Sexe;
  adresse?: string;
  imagePath?: string;
  phone?: string;
  cvPath?: string;
  role?: Role;
  pays?: string;
  niveauEtude?: NiveauType;
  codePostal?: number;
  /** Permissions effectives (renseigné sur login/me/refresh, vide pour les listes). */
  permissions?: Permission[];
}

export interface RegisterType {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  birthDate?: string;
  ville?: string;
  sexe?: Sexe;
  adresse?: string;
  phone?: string;
  pays?: string;
  codePostal?: number;
  niveauEtude?: NiveauType;
}

export interface RegisterPayload {
  user: RegisterType;
  cv: File;
  image: File;
}

export interface RegisterUpdatePayload extends RegisterPayload {
  id: number;
}

export interface LoginType {
  email: string;
  password: string;
}

export type Sexe = "HOMME" | "FEMME";
