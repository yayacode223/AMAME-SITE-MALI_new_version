import {Api} from "@/utils/axiosInstance"; 
import { useQuery } from "@tanstack/react-query";

export interface BourseResponse {
    id: number; 
    titre  : string;
    description_complete : string; 
    urlSource? : string; 
    urlPdf1? : string; 
    urlPdf2?: string; 
    sourceSite?: string; 
    paysOffrant?: string; 
    urlDrapeau? : string; 
    anneePertinence? : number; 
}


const bourseList = async () : Promise<BourseResponse[]> => {
    const response = await Api.get<BourseResponse[]>("/user/opportunity"); 
    return response.data; 
}

const keys = {
    all : ["list"] as const,
}

export const useGetBourses = () => 
    useQuery({
        queryKey: keys.all,
        queryFn: bourseList
    });