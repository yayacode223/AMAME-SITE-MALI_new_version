import { Api } from "@/utils/axiosInstance";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RegisterResponse } from "@/types/userType";

// ── Types ────────────────────────────────────────────────────────────────────

export type CotisationStatus = "PENDING" | "PAID" | "OVERDUE";

export const COTISATION_STATUS_LABELS: Record<CotisationStatus, string> = {
  PENDING: "En attente",
  PAID:    "Payée",
  OVERDUE: "En retard",
};

export const COTISATION_STATUS_STYLES: Record<CotisationStatus, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  PAID:    "bg-amame-green-subtle text-amame-green-dark border-amame-green/20",
  OVERDUE: "bg-red-50 text-red-700 border-red-200",
};

export interface CotisationDto {
  id: number;
  annee: number;
  montant: number;
  status: CotisationStatus;
  statusLabel: string;
  datePaiement?: string;
  referencePaiement?: string;
  notes?: string;
  createdAt: string;
}

export interface DonDto {
  id: number;
  montant: number;
  message?: string;
  dateDon: string;
}

export interface DashboardStats {
  cotisationAJourCetteAnnee: boolean;
  totalCotisations: number;
  totalDons: number;
  totalMontantDons: number;
}

export interface UpdateProfilePayload {
  nom: string;
  prenom: string;
  phone?: string;
  ville?: string;
  adresse?: string;
  pays?: string;
  birthDate?: string;
  sexe?: "HOMME" | "FEMME";
  niveauEtude?: string;
  codePostal?: number;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface DonRequestPayload {
  montant: number;
  message?: string;
}

// ── Query keys ───────────────────────────────────────────────────────────────

export const espaceKeys = {
  stats:       ["espace", "stats"]       as const,
  cotisations: ["espace", "cotisations"] as const,
  dons:        ["espace", "dons"]        as const,
};

// ── API functions ────────────────────────────────────────────────────────────

const getStats       = async (): Promise<DashboardStats>  => (await Api.get("/user/membre/stats")).data;
const getCotisations = async (): Promise<CotisationDto[]> => (await Api.get("/user/cotisations")).data;
const getDons        = async (): Promise<DonDto[]>        => (await Api.get("/user/dons")).data;
const submitDon      = async (d: DonRequestPayload): Promise<DonDto> => (await Api.post("/user/dons", d)).data;
const updateProfile  = async (d: UpdateProfilePayload): Promise<RegisterResponse> => (await Api.patch("/user/profile", d)).data;
const changePassword = async (d: ChangePasswordPayload): Promise<void> => { await Api.put("/user/change-password", d); };

// ── Hooks ─────────────────────────────────────────────────────────────────────

export const useEspaceStats    = () => useQuery({ queryKey: espaceKeys.stats,       queryFn: getStats,       staleTime: 60_000 });
export const useMyCotisations  = () => useQuery({ queryKey: espaceKeys.cotisations,  queryFn: getCotisations, staleTime: 60_000 });
export const useMyDons         = () => useQuery({ queryKey: espaceKeys.dons,         queryFn: getDons,        staleTime: 60_000 });

export const useSubmitDon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitDon,
    onSuccess: () => qc.invalidateQueries({ queryKey: espaceKeys.dons }),
  });
};

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["currentUser"] }),
  });
};

export const useChangePassword = () =>
  useMutation({ mutationFn: changePassword });
