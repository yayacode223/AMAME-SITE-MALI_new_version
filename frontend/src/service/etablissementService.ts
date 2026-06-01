import { Api } from "@/utils/axiosInstance";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageResponse, PaginationParams } from "@/types/commonTypes";

export interface EtablissementResponse {
  id: number;
  nom: string;
  typeEtablissement?: string;
  lieu?: string;
  urlDetailEtablissement?: string;
  urlLogo?: string;
  url_image?: string;
}

export interface EtablissementRequest {
  nom: string;
  typeEtablissement?: string;
  lieu?: string;
  urlDetailEtablissement?: string;
  urlLogo?: string;
  urlImage?: string;
  sourceSite?: string;
}

const keys = {
  all: ["etablissements"] as const,
  lists: (params?: PaginationParams) => [...keys.all, "list", params] as const,
  admin: (params?: PaginationParams) => [...keys.all, "admin", params] as const,
};

/* ── Fetchers ── */
const buildQ = (params: PaginationParams) => {
  const { page = 0, size = 12, sortBy = "nom", sortDirection = "ASC" } = params;
  return new URLSearchParams({ page: String(page), size: String(size), sortBy, sortDirection });
};

const fetchEtablissements = async (params: PaginationParams = {}): Promise<PageResponse<EtablissementResponse>> => {
  const res = await Api.get<PageResponse<EtablissementResponse>>(`/visitor/etablissements?${buildQ(params)}`);
  return res.data;
};

const fetchEtablissementsAdmin = async (params: PaginationParams = {}): Promise<PageResponse<EtablissementResponse>> => {
  const res = await Api.get<PageResponse<EtablissementResponse>>(`/visitor/etablissements?${buildQ(params)}`);
  return res.data;
};

const createEtablissement = async (request: EtablissementRequest): Promise<EtablissementResponse> => {
  const res = await Api.post<EtablissementResponse>("/admin/etablissements", request);
  return res.data;
};

const updateEtablissement = async (id: number, request: EtablissementRequest): Promise<EtablissementResponse> => {
  const res = await Api.put<EtablissementResponse>(`/admin/etablissements/${id}`, request);
  return res.data;
};

const deleteEtablissement = async (id: number): Promise<void> => {
  await Api.delete(`/admin/etablissements/${id}`);
};

/* ── Hooks ── */
export const useGetEtablissement = (params: PaginationParams = {}) =>
  useQuery({
    queryKey: keys.lists(params),
    queryFn: () => fetchEtablissements(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    placeholderData: (prev) => prev,
  });

export const useGetEtablissementsAdmin = (params: PaginationParams = {}) =>
  useQuery({
    queryKey: keys.admin(params),
    queryFn: () => fetchEtablissementsAdmin(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

export const useCreateEtablissement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: EtablissementRequest) => createEtablissement(request),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

export const useUpdateEtablissement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: EtablissementRequest }) =>
      updateEtablissement(id, request),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

export const useDeleteEtablissement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteEtablissement,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

export const etablissementKeys = keys;
