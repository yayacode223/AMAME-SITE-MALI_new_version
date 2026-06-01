import { Api } from "@/utils/axiosInstance";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  GalerieSummary,
  GalerieDetail,
  GalerieCreationRequest,
  GalerieUpdateRequest,
} from "@/types/galerieType";
import { PageResponse, PaginationParams } from "@/types/commonTypes";

/* ── Fonctions API ─────────────────────────────────────────────────── */

const buildQ = (params: PaginationParams) => {
  const { page = 0, size = 9, sortBy = "dateCreation", sortDirection = "DESC" } = params;
  return new URLSearchParams({ page: String(page), size: String(size), sortBy, sortDirection });
};

const getAllGaleries = async (params: PaginationParams = {}): Promise<PageResponse<GalerieSummary>> => {
  const response = await Api.get<PageResponse<GalerieSummary>>(`/visitor/galeries?${buildQ(params)}`);
  return response.data;
};

const getAllGaleriesAdmin = async (params: PaginationParams = {}): Promise<PageResponse<GalerieSummary>> => {
  const response = await Api.get<PageResponse<GalerieSummary>>(`/admin/galeries?${buildQ(params)}`);
  return response.data;
};

const getGalerieById = async (id: number): Promise<GalerieDetail> => {
  const response = await Api.get<GalerieDetail>(`/visitor/galeries/${id}`);
  return response.data;
};

const createGalerie = async (
  request: GalerieCreationRequest,
  file?: File,
): Promise<GalerieDetail> => {
  const formData = new FormData();
  const blob = new Blob([JSON.stringify(request)], { type: "application/json" });
  formData.append("galerie", blob);
  if (file) formData.append("image", file);
  const response = await Api.post<GalerieDetail>("/admin/galeries", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

const updateGalerie = async (
  id: number,
  request: GalerieUpdateRequest,
  file?: File,
): Promise<GalerieDetail> => {
  const formData = new FormData();
  const blob = new Blob([JSON.stringify(request)], { type: "application/json" });
  formData.append("galerie", blob);
  if (file) formData.append("image", file);
  const response = await Api.put<GalerieDetail>(`/admin/galeries/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

const deleteGalerie = async (id: number): Promise<void> => {
  await Api.delete(`/admin/galeries/${id}`);
};

/* ── Query keys ────────────────────────────────────────────────────── */

export const galerieKeys = {
  all: ["galeries"] as const,
  lists: (params?: PaginationParams) => [...galerieKeys.all, "list", params] as const,
  adminLists: (params?: PaginationParams) => [...galerieKeys.all, "admin-list", params] as const,
  details: () => [...galerieKeys.all, "detail"] as const,
  detail: (id: number) => [...galerieKeys.details(), id] as const,
};

/* ── Hooks lecture ──────────────────────────────────────────────────── */

export const useGetAllGaleries = (params: PaginationParams = {}) =>
  useQuery({
    queryKey: galerieKeys.lists(params),
    queryFn: () => getAllGaleries(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    placeholderData: (prev) => prev,
  });

export const useGetAllGaleriesAdmin = (params: PaginationParams = {}) =>
  useQuery({
    queryKey: galerieKeys.adminLists(params),
    queryFn: () => getAllGaleriesAdmin(params),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    placeholderData: (prev) => prev,
  });

export const useGetGalerieById = (
  id: number,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: galerieKeys.detail(id),
    queryFn: () => getGalerieById(id),
    enabled: options?.enabled ?? !!id,
    staleTime: 10 * 60 * 1000,
  });

/* ── Hooks mutation ─────────────────────────────────────────────────── */

export const useCreateGalerie = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      file,
    }: {
      request: GalerieCreationRequest;
      file?: File;
    }) => createGalerie(request, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: galerieKeys.all });
    },
  });
};

export const useUpdateGalerie = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      request,
      file,
    }: {
      id: number;
      request: GalerieUpdateRequest;
      file?: File;
    }) => updateGalerie(id, request, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: galerieKeys.all });
      queryClient.invalidateQueries({
        queryKey: galerieKeys.detail(variables.id),
      });
    },
  });
};

export const useDeleteGalerie = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteGalerie,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: galerieKeys.all });
    },
  });
};
