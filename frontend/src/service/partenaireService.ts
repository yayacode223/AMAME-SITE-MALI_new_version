import { Api } from "@/utils/axiosInstance";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Partenaire, PartenaireRequest } from "@/types/partenaireType";
import { PageResponse, PaginationParams } from "@/types/commonTypes";

const keys = {
  all: ["partenaires"] as const,
  lists: () => [...keys.all, "list"] as const,
  admin: (params?: PaginationParams) => [...keys.all, "admin", params] as const,
  detail: (id: number) => [...keys.all, "detail", id] as const,
};

const fetchPartenaires = async (): Promise<Partenaire[]> => {
  const res = await Api.get<Partenaire[]>("/visitor/partenaires");
  return res.data;
};

const fetchAllPartenairesAdmin = async (params: PaginationParams = {}): Promise<PageResponse<Partenaire>> => {
  const { page = 0, size = 10, sortBy = "ordre", sortDirection = "ASC" } = params;
  const q = new URLSearchParams({ page: String(page), size: String(size), sortBy, sortDirection });
  const res = await Api.get<PageResponse<Partenaire>>(`/admin/partenaires?${q}`);
  return res.data;
};

const createPartenaire = async (request: PartenaireRequest, file?: File): Promise<Partenaire> => {
  const formData = new FormData();
  formData.append("partenaire", new Blob([JSON.stringify(request)], { type: "application/json" }));
  if (file) formData.append("file", file);
  const res = await Api.post<Partenaire>("/admin/partenaires", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

const updatePartenaire = async (id: number, request: PartenaireRequest, file?: File): Promise<Partenaire> => {
  const formData = new FormData();
  formData.append("partenaire", new Blob([JSON.stringify(request)], { type: "application/json" }));
  if (file) formData.append("file", file);
  const res = await Api.put<Partenaire>(`/admin/partenaires/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

const deletePartenaire = async (id: number): Promise<void> => {
  await Api.delete(`/admin/partenaires/${id}`);
};

export const useGetPartenaires = () =>
  useQuery({ queryKey: keys.lists(), queryFn: fetchPartenaires, staleTime: 30 * 60 * 1000 });

export const useGetAllPartenairesAdmin = (params: PaginationParams = {}) =>
  useQuery({
    queryKey: keys.admin(params),
    queryFn: () => fetchAllPartenairesAdmin(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

export const useCreatePartenaire = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ request, file }: { request: PartenaireRequest; file?: File }) =>
      createPartenaire(request, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

export const useUpdatePartenaire = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request, file }: { id: number; request: PartenaireRequest; file?: File }) =>
      updatePartenaire(id, request, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

export const useDeletePartenaire = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePartenaire,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};
