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

const etablissements = async (): Promise<EtablissementResponse[] | []> => {
  const response = await Api.get<EtablissementResponse[] | []>(
    "/user/etablissement"
  );
  return response.data;
};

const keys = {
  all: ["list"] as const,
};

export const useGetEtablissement = () =>
  useQuery({
    queryKey: keys.all,
    queryFn: etablissements,
  });
