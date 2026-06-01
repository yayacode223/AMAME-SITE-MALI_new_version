import { Api } from "@/utils/axiosInstance";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RessourceAcademique, RessourceAcademiqueRequest } from "@/types/ressourceAcademiqueType";
import { PageResponse, PaginationParams } from "@/types/commonTypes";

const keys = {
  all: ["ressources"] as const,
  lists: (params?: PaginationParams) => [...keys.all, "list", params] as const,
  admin: (params?: PaginationParams) => [...keys.all, "admin", params] as const,
};

const buildQ = (params: PaginationParams) => {
  const { page = 0, size = 12, sortBy = "ordre", sortDirection = "ASC" } = params;
  return new URLSearchParams({ page: String(page), size: String(size), sortBy, sortDirection });
};

const fetchRessources = async (params: PaginationParams = {}): Promise<PageResponse<RessourceAcademique>> => {
  const res = await Api.get<PageResponse<RessourceAcademique>>(`/visitor/ressources?${buildQ(params)}`);
  return res.data;
};

const fetchRessourcesAdmin = async (params: PaginationParams = {}): Promise<PageResponse<RessourceAcademique>> => {
  const res = await Api.get<PageResponse<RessourceAcademique>>(`/admin/ressources?${buildQ({ size: 10, sortBy: "ordre", sortDirection: "ASC", ...params })}`);
  return res.data;
};

const createRessource = async (request: RessourceAcademiqueRequest, file?: File): Promise<RessourceAcademique> => {
  const formData = new FormData();
  formData.append("ressource", new Blob([JSON.stringify(request)], { type: "application/json" }));
  if (file) formData.append("file", file);
  const res = await Api.post<RessourceAcademique>("/admin/ressources", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

const updateRessource = async (id: number, request: RessourceAcademiqueRequest, file?: File): Promise<RessourceAcademique> => {
  const formData = new FormData();
  formData.append("ressource", new Blob([JSON.stringify(request)], { type: "application/json" }));
  if (file) formData.append("file", file);
  const res = await Api.put<RessourceAcademique>(`/admin/ressources/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

const deleteRessource = async (id: number): Promise<void> => {
  await Api.delete(`/admin/ressources/${id}`);
};

export const useGetRessources = (params: PaginationParams = {}) =>
  useQuery({
    queryKey: keys.lists(params),
    queryFn: () => fetchRessources(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

export const useGetRessourcesAdmin = (params: PaginationParams = {}) =>
  useQuery({
    queryKey: keys.admin(params),
    queryFn: () => fetchRessourcesAdmin(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

export const useCreateRessource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ request, file }: { request: RessourceAcademiqueRequest; file?: File }) =>
      createRessource(request, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

export const useUpdateRessource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request, file }: { id: number; request: RessourceAcademiqueRequest; file?: File }) =>
      updateRessource(id, request, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

export const useDeleteRessource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteRessource,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};
