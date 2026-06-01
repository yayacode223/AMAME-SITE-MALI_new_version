import { Api } from "@/utils/axiosInstance";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LienUtile, LienUtileRequest } from "@/types/lienUtileType";
import { PageResponse, PaginationParams } from "@/types/commonTypes";

const keys = {
  all: ["liens-utiles"] as const,
  lists: () => [...keys.all, "list"] as const,
  admin: (params?: PaginationParams) => [...keys.all, "admin", params] as const,
};

const fetchLiens = async (): Promise<LienUtile[]> => {
  const res = await Api.get<LienUtile[]>("/visitor/liens-utiles");
  return res.data;
};

const fetchLiensAdmin = async (params: PaginationParams = {}): Promise<PageResponse<LienUtile>> => {
  const { page = 0, size = 10, sortBy = "ordre", sortDirection = "ASC" } = params;
  const q = new URLSearchParams({ page: String(page), size: String(size), sortBy, sortDirection });
  const res = await Api.get<PageResponse<LienUtile>>(`/admin/liens-utiles?${q}`);
  return res.data;
};

const createLien = async (request: LienUtileRequest): Promise<LienUtile> => {
  const res = await Api.post<LienUtile>("/admin/liens-utiles", request);
  return res.data;
};

const updateLien = async (id: number, request: LienUtileRequest): Promise<LienUtile> => {
  const res = await Api.put<LienUtile>(`/admin/liens-utiles/${id}`, request);
  return res.data;
};

const deleteLien = async (id: number): Promise<void> => {
  await Api.delete(`/admin/liens-utiles/${id}`);
};

export const useGetLiensUtiles = () =>
  useQuery({ queryKey: keys.lists(), queryFn: fetchLiens, staleTime: 30 * 60 * 1000 });

export const useGetLiensUtilesAdmin = (params: PaginationParams = {}) =>
  useQuery({
    queryKey: keys.admin(params),
    queryFn: () => fetchLiensAdmin(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

export const useCreateLienUtile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: LienUtileRequest) => createLien(request),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

export const useUpdateLienUtile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: LienUtileRequest }) => updateLien(id, request),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

export const useDeleteLienUtile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteLien,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};
