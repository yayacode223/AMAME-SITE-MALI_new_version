import { Api } from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";

export interface OpportuniteResponse {
  id: number;
  titre: string;
  descriptionComplete?: string;
  urlSource?: string;
  urlPdf1?: string;
  urlPdf2?: string;
  sourceSite?: string;
  anneePertinence?: number;
  paysOffrant?: string;
  urlDrapeau?: string;
  niveau?: string;
  status?: string;
  isAvalable?: boolean;
  dateLimite?: string;
}

const fetchOpportunites = async (): Promise<OpportuniteResponse[]> => {
  const res = await Api.get<OpportuniteResponse[]>("/user/opportunity");
  return res.data;
};

export const useGetOpportunites = () =>
  useQuery({
    queryKey: ["opportunites"],
    queryFn: fetchOpportunites,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
