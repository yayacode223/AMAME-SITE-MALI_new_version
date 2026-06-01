import { Api } from "@/utils/axiosInstance";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdhesionDto, AdhesionRegisterRequest, AdhesionRequest, AdhesionRejectRequest, AdhesionStatus } from "@/types/adhesionType";
import { PageResponse, PaginationParams } from "@/types/commonTypes";

// ── Query keys ──────────────────────────────────────────────────────────────
export const adhesionKeys = {
  all:    ["adhesions"] as const,
  status: () => [...adhesionKeys.all, "status"] as const,
  admin:  (params?: object) => [...adhesionKeys.all, "admin", params] as const,
  stats:  () => [...adhesionKeys.all, "stats"] as const,
};

// ── API functions ────────────────────────────────────────────────────────────

/** Inscription + adhésion publique (pas d'auth requise) */
const registerAndSubmitAdhesion = async (request: AdhesionRegisterRequest): Promise<AdhesionDto> => {
  const res = await Api.post<AdhesionDto>("/visitor/adhesion/register", request);
  return res.data;
};

const submitAdhesion = async (request: AdhesionRequest): Promise<AdhesionDto> => {
  const res = await Api.post<AdhesionDto>("/user/adhesion", request);
  return res.data;
};

const getAdhesionStatus = async (): Promise<AdhesionDto | null> => {
  const res = await Api.get<AdhesionDto | null>("/user/adhesion/status");
  return res.data;
};

export interface AdhesionAdminParams extends PaginationParams {
  status?: AdhesionStatus;
}

const getAllAdhesions = async (params?: AdhesionAdminParams): Promise<PageResponse<AdhesionDto>> => {
  const { page = 0, size = 10, sortBy = "createdAt", sortDirection = "DESC", status } = params || {};
  const q = new URLSearchParams({ page: String(page), size: String(size), sortBy, sortDirection });
  if (status) q.append("status", status);
  const res = await Api.get<PageResponse<AdhesionDto>>(`/admin/adhesions?${q}`);
  return res.data;
};

const getAdhesionStats = async (): Promise<{ pending: number; approved: number; rejected: number }> => {
  const res = await Api.get("/admin/adhesions/stats");
  return res.data;
};

const approveAdhesion = async (id: number): Promise<AdhesionDto> => {
  const res = await Api.put<AdhesionDto>(`/admin/adhesions/${id}/approve`);
  return res.data;
};

const rejectAdhesion = async ({ id, reason }: { id: number; reason?: string }): Promise<AdhesionDto> => {
  const res = await Api.put<AdhesionDto>(`/admin/adhesions/${id}/reject`, { reason });
  return res.data;
};

const deleteAdhesion = async (id: number): Promise<void> => {
  await Api.delete(`/admin/adhesions/${id}`);
};

// ── React Query hooks ────────────────────────────────────────────────────────

export const useRegisterAndSubmitAdhesion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: registerAndSubmitAdhesion,
    onSuccess: () => qc.invalidateQueries({ queryKey: adhesionKeys.all }),
  });
};

export const useSubmitAdhesion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitAdhesion,
    onSuccess: () => qc.invalidateQueries({ queryKey: adhesionKeys.all }),
  });
};

export const useGetAdhesionStatus = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: adhesionKeys.status(),
    queryFn: getAdhesionStatus,
    enabled: options?.enabled ?? true,
    staleTime: 2 * 60 * 1000,
  });

export const useGetAllAdhesions = (params?: AdhesionAdminParams) =>
  useQuery({
    queryKey: adhesionKeys.admin(params),
    queryFn: () => getAllAdhesions(params),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });

export const useGetAdhesionStats = () =>
  useQuery({
    queryKey: adhesionKeys.stats(),
    queryFn: getAdhesionStats,
    staleTime: 2 * 60 * 1000,
  });

export const useApproveAdhesion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: approveAdhesion,
    onSuccess: () => qc.invalidateQueries({ queryKey: adhesionKeys.all }),
  });
};

export const useRejectAdhesion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rejectAdhesion,
    onSuccess: () => qc.invalidateQueries({ queryKey: adhesionKeys.all }),
  });
};

export const useDeleteAdhesion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAdhesion,
    onSuccess: () => qc.invalidateQueries({ queryKey: adhesionKeys.all }),
  });
};
