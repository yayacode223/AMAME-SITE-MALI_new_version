import { Api } from "@/utils/axiosInstance";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Membre, MembreRequest } from "@/types/membreType";
import { PageResponse, PaginationParams } from "@/types/commonTypes";

const keys = {
  all: ["membres"] as const,
  lists: () => [...keys.all, "list"] as const,
  admin: (params?: PaginationParams) => [...keys.all, "admin", params] as const,
  detail: (id: number) => [...keys.all, "detail", id] as const,
};

const fetchMembres = async (): Promise<Membre[]> => {
  const res = await Api.get<Membre[]>("/visitor/membres");
  return res.data;
};

const fetchAllMembresAdmin = async (params: PaginationParams = {}): Promise<PageResponse<Membre>> => {
  const { page = 0, size = 10, sortBy = "ordre", sortDirection = "ASC" } = params;
  const q = new URLSearchParams({ page: String(page), size: String(size), sortBy, sortDirection });
  const res = await Api.get<PageResponse<Membre>>(`/admin/membres?${q}`);
  return res.data;
};

const createMembre = async (request: MembreRequest, file?: File): Promise<Membre> => {
  const formData = new FormData();
  formData.append("membre", new Blob([JSON.stringify(request)], { type: "application/json" }));
  if (file) formData.append("file", file);
  const res = await Api.post<Membre>("/admin/membres", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

const updateMembre = async (id: number, request: MembreRequest, file?: File): Promise<Membre> => {
  const formData = new FormData();
  formData.append("membre", new Blob([JSON.stringify(request)], { type: "application/json" }));
  if (file) formData.append("file", file);
  const res = await Api.put<Membre>(`/admin/membres/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

const deleteMembre = async (id: number): Promise<void> => {
  await Api.delete(`/admin/membres/${id}`);
};

export const useGetMembres = () =>
  useQuery({ queryKey: keys.lists(), queryFn: fetchMembres, staleTime: 30 * 60 * 1000 });

export const useGetAllMembresAdmin = (params: PaginationParams = {}) =>
  useQuery({
    queryKey: keys.admin(params),
    queryFn: () => fetchAllMembresAdmin(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

export const useCreateMembre = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ request, file }: { request: MembreRequest; file?: File }) =>
      createMembre(request, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

export const useUpdateMembre = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request, file }: { id: number; request: MembreRequest; file?: File }) =>
      updateMembre(id, request, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

export const useDeleteMembre = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteMembre,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};
