// service/orientationService.ts - VERSION OPTIMISÉE
import { Api } from "@/utils/axiosInstance";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FiliereCreationRequest,
  FiliereDetailResponse,
  FiliereSummaryResponse,
  FiliereUpdateRequest,
  DomaineFiliereType,
  SearchFilieresParams,
} from "@/types/orientationType";

// Fonction pour récupérer TOUTES les filières
const getAllFilieres = async (): Promise<FiliereSummaryResponse[]> => {
  const response = await Api.get<FiliereSummaryResponse[]>("/visitor/filieres");
  return response.data;
};

const getFiliereById = async (id: number): Promise<FiliereDetailResponse> => {
  const response = await Api.get<FiliereDetailResponse>(
    `/visitor/filieres/${id}`,
  );
  return response.data;
};

const getAvailableDomaines = async (): Promise<string[]> => {
  const response = await Api.get<string[]>("/visitor/filieres/domaines");
  return response.data;
};

const createFiliere = async (
  request: FiliereCreationRequest,
  file?: File,
): Promise<FiliereDetailResponse> => {
  const formData = new FormData();

  const filiereBlob = new Blob([JSON.stringify(request)], {
    type: "application/json",
  });
  formData.append("filiere", filiereBlob);

  if (file) {
    formData.append("file", file);
  }

  const response = await Api.post<FiliereDetailResponse>(
    "/admin/filieres",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};

const updateFiliere = async (
  id: number,
  request: FiliereUpdateRequest,
  file?: File,
): Promise<FiliereDetailResponse> => {
  const formData = new FormData();

  const filiereBlob = new Blob([JSON.stringify(request)], {
    type: "application/json",
  });
  formData.append("filiere", filiereBlob);

  if (file) {
    formData.append("file", file);
  }

  const response = await Api.put<FiliereDetailResponse>(
    `/admin/filieres/${id}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};

const deleteFiliere = async (id: number): Promise<void> => {
  await Api.delete(`/admin/filieres/${id}`);
};

export const openFiliereFile = (filePath: string) => {
  if (!filePath) return;

  let fileUrl = filePath;

  // Construire l'URL complète si nécessaire
  if (!filePath.startsWith("http")) {
    const baseUrl = process.env.REACT_APP_API_URL || "";
    fileUrl = `${baseUrl}${filePath.startsWith("/") ? "" : "/"}${filePath}`;
  }

  window.open(fileUrl, "_blank");
};

export const downloadFiliereFile = async (
  filePath: string,
  filiereName: string,
) => {
  if (!filePath) return;

  try {
    let fileUrl = filePath;

    if (!filePath.startsWith("http")) {
      const baseUrl = process.env.REACT_APP_API_URL || "";
      fileUrl = `${baseUrl}${filePath.startsWith("/") ? "" : "/"}${filePath}`;
    }

    const link = document.createElement("a");
    link.href = fileUrl;
    link.setAttribute(
      "download",
      `${filiereName.replace(/\s+/g, "_")}_image.jpg`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Erreur lors du téléchargement:", error);
    openFiliereFile(filePath);
  }
};

// Query keys
export const orientationKeys = {
  all: ["orientation"] as const,
  lists: () => [...orientationKeys.all, "list"] as const,
  details: () => [...orientationKeys.all, "detail"] as const,
  detail: (id: number) => [...orientationKeys.details(), id] as const,
  domaines: () => [...orientationKeys.all, "domaines"] as const,
};

// UN SEUL HOOK PRINCIPAL - OPTIMISÉ
export const useGetAllFilieres = () =>
  useQuery({
    queryKey: orientationKeys.lists(),
    queryFn: getAllFilieres,
    staleTime: 60 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes en cache
    retry: 1, // Une seule retry
  });

export const useGetFiliereById = (id: number, options?: { enabled: boolean }) =>
  useQuery({
    queryKey: orientationKeys.detail(id),
    queryFn: () => getFiliereById(id),
    enabled: options?.enabled ?? !!id,
    staleTime: 15 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
  });

export const useGetAvailableDomaines = () =>
  useQuery({
    queryKey: orientationKeys.domaines(),
    queryFn: getAvailableDomaines,
    staleTime: 15 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
  });

// HOOKS DÉSACTIVÉS (pour compatibilité)
export const useSearchFilieresBySearchTerm = (search: string) =>
  useQuery({
    queryKey: [...orientationKeys.lists(), { search }],
    queryFn: () => Promise.resolve([]), // Fonction vide
    enabled: false, // DÉSACTIVÉ
  });

export const useGetFilieresByDomaine = (domaine: DomaineFiliereType) =>
  useQuery({
    queryKey: [...orientationKeys.lists(), { domaine }],
    queryFn: () => Promise.resolve([]), // Fonction vide
    enabled: false, // DÉSACTIVÉ
  });

// React Query hooks - MUTATIONS
export const useCreateFiliere = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      request,
      file,
    }: {
      request: FiliereCreationRequest;
      file?: File;
    }) => createFiliere(request, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orientationKeys.all });
    },
  });
};

export const useUpdateFiliere = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      request,
      file,
    }: {
      id: number;
      request: FiliereUpdateRequest;
      file?: File;
    }) => updateFiliere(id, request, file),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: orientationKeys.all });
      queryClient.invalidateQueries({
        queryKey: orientationKeys.detail(variables.id),
      });
    },
  });
};

export const useDeleteFiliere = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFiliere,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orientationKeys.all });
    },
  });
};
