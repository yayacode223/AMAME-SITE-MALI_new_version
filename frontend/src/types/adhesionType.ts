export type AdhesionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface AdhesionDto {
  id: number;
  userId: number;
  userNom: string;
  userPrenom: string;
  userEmail: string;
  motivation: string;
  status: AdhesionStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  adhesionDate?: string;
}

export interface AdhesionRequest {
  motivation: string;
}

/** Formulaire public "Adhérer" : inscription + adhésion en une requête */
export interface AdhesionRegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  ville?: string;
  phone?: string;
  acceptConditions: boolean;
}

export interface AdhesionRejectRequest {
  reason?: string;
}

export const ADHESION_STATUS_LABELS: Record<AdhesionStatus, string> = {
  PENDING:  "En attente",
  APPROVED: "Approuvée",
  REJECTED: "Rejetée",
};

export const ADHESION_STATUS_STYLES: Record<AdhesionStatus, string> = {
  PENDING:  "bg-yellow-50 text-yellow-700 border-yellow-200",
  APPROVED: "bg-amame-green-subtle text-amame-green-dark border-amame-green/20",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};
