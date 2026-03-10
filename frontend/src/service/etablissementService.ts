import { Api } from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";

export interface EtablissementResponse {
  id: number;
  nom: string;
  typeEtablissement: string;
  lieu: string;
  urlDetailEtablissement: string;
  urlLogo: string;
  url_image: string;
}

const etablissements = async (): Promise<EtablissementResponse[]> => {
  const response = await Api.get<EtablissementResponse[]>(
    "/user/etablissement",
  );
  return response.data;
};

// Fonctions utilitaires pour les fichiers
export const openEtablissementFile = (filePath: string) => {
  if (!filePath) return;

  let fileUrl = filePath;

  if (!filePath.startsWith("http")) {
    const baseUrl = process.env.REACT_APP_API_URL || "";
    fileUrl = `${baseUrl}${filePath.startsWith("/") ? "" : "/"}${filePath}`;
  }

  window.open(fileUrl, "_blank");
};

// Query keys standardisées
export const etablissementKeys = {
  all: ["etablissements"] as const,
  lists: () => [...etablissementKeys.all, "list"] as const,
};

// Hook pour récupérer les établissements
export const useGetEtablissement = () =>
  useQuery({
    queryKey: etablissementKeys.lists(),
    queryFn: etablissements,
    staleTime: 60 * 60 * 1000, // 1 heure
    gcTime: 30 * 60 * 1000,    // 30 minutes
    retry: 1,
  });
