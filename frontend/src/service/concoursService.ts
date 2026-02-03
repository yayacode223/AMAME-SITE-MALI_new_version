// service/concoursService.ts
import { Api } from "../utils/axiosInstance";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ConcoursCreationRequest,
    ConcoursDefaultSearchParams,
    ConcoursFilterParams,  
    ConcoursResponse, 
    ConcoursResponsePaginated, 
    ConcoursUpdateRequest
} from "@/types/concoursType"; 

// Fonctions API GET
const concoursLists = async (params: ConcoursDefaultSearchParams): Promise<ConcoursResponsePaginated> => {
    const { page = 0, size = 9, sortBy = 'dateLimite', sortDirection = 'ASC' } = params;
    const response = await Api.get<ConcoursResponsePaginated>(
        `/visitor/concours?page=${page}&size=${size}&sortBy=${sortBy}&sortDirection=${sortDirection}`
    ); 
    return response.data; 
}

const concoursDetail = async (id: number): Promise<ConcoursResponse> => {
    const response = await Api.get<ConcoursResponse>(`/visitor/concours/${id}`); 
    return response.data; 
}; 

const concoursFilter = async (params: ConcoursFilterParams): Promise<ConcoursResponsePaginated> => {
    const { page = 0, size = 9, sortBy = 'dateLimite', sortDirection = 'ASC', niveau, status } = params;
    
    const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sortBy,
        sortDirection
    });
    
    if (niveau) queryParams.append('niveau', niveau);
    if (status) queryParams.append('status', status);
    
    const response = await Api.get<ConcoursResponsePaginated>(
        `/visitor/concours/filter?${queryParams.toString()}`
    ); 
    return response.data; 
}

const concoursSearch = async (params: ConcoursFilterParams): Promise<ConcoursResponsePaginated> => {
    const { search = "", page = 0, size = 9, sortBy = 'dateLimite', sortDirection = 'ASC' } = params;
    
    const queryParams = new URLSearchParams({
        search,
        page: page.toString(),
        size: size.toString(),
        sortBy,
        sortDirection
    });
    
    const response = await Api.get<ConcoursResponsePaginated>(
        `/visitor/concours/search?${queryParams.toString()}`
    ); 
    return response.data; 
}; 

// Fonctions API POST, PUT, DELETE
const createConcours = async (
    request: ConcoursCreationRequest, 
    file?: File
): Promise<ConcoursResponse> => {
    const formData = new FormData();
    
    // Ajouter le concours comme JSON
    const concoursBlob = new Blob([JSON.stringify(request)], { type: 'application/json' });
    formData.append('concours', concoursBlob);
    
    // Ajouter le fichier si présent
    if (file) {
        formData.append('file', file);
    }

    const response = await Api.post<ConcoursResponse>('/admin/concours', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

const updateConcours = async (
    id: number,
    request: ConcoursUpdateRequest,
    file?: File
): Promise<ConcoursResponse> => {
    const formData = new FormData();
    
    // Ajouter le concours comme JSON
    const concoursBlob = new Blob([JSON.stringify(request)], { type: 'application/json' });
    formData.append('concours', concoursBlob);
    
    // Ajouter le fichier si présent
    if (file) {
        formData.append('file', file);
    }

    const response = await Api.put<ConcoursResponse>(`/admin/concours/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

const deleteConcours = async (id: number): Promise<void> => {
    await Api.delete(`/admin/concours/${id}`);
};

// Fonctions utilitaires pour les fichiers
export const openConcoursFile = (filePath: string, fileName?: string) => {
    if (!filePath) return;

    let fileUrl = filePath;
    
    // Construire l'URL complète si nécessaire
    if (!filePath.startsWith('http')) {
        const baseUrl = process.env.REACT_APP_API_URL || '';
        fileUrl = `${baseUrl}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
    }

    // Ouvrir dans un nouvel onglet
    window.open(fileUrl, '_blank');
};

export const downloadConcoursFile = async (filePath: string, concoursName: string) => {
    if (!filePath) return;

    try {
        let fileUrl = filePath;
        
        if (!filePath.startsWith('http')) {
            const baseUrl = process.env.REACT_APP_API_URL || '';
            fileUrl = `${baseUrl}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
        }

        const link = document.createElement('a');
        link.href = fileUrl;
        link.setAttribute('download', `${concoursName.replace(/\s+/g, '_')}_document.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Erreur lors du téléchargement:', error);
        // Fallback: ouvrir dans un nouvel onglet
        openConcoursFile(filePath);
    }
};

// Clés de cache
export const concoursKeys = {
    all: ['concours'] as const, 
    lists: (params: ConcoursDefaultSearchParams) => [...concoursKeys.all, 'list', params] as const, 
    detail: (id: number) => [...concoursKeys.all, 'detail', id] as const, 
    filter: (params: ConcoursFilterParams) => [...concoursKeys.all, 'filter', params] as const,
    search: (params: ConcoursFilterParams) => [...concoursKeys.all, 'search', params] as const,
};

// Hooks React Query - GET
export const useConcoursLists = (params: ConcoursDefaultSearchParams, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: concoursKeys.lists(params),
        queryFn: () => concoursLists(params),
        enabled: options?.enabled ?? true,
        staleTime: 60 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export const useConcoursDetail = (id: number, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: concoursKeys.detail(id),
        queryFn: () => concoursDetail(id),
        enabled: options?.enabled ?? !!id,
        staleTime: 15 * 60 * 1000,
        gcTime: 30*60*1000,
    });
}

export const useConcoursFilter = (params: ConcoursFilterParams, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: concoursKeys.filter(params),
        queryFn: () => concoursFilter(params),
        enabled: options?.enabled ?? true,
        staleTime: 15 * 60 * 1000,
        gcTime: 30*60*1000,
        placeholderData: (previousData) => previousData,
    });
}

export const useConcoursSearch = (params: ConcoursFilterParams, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: concoursKeys.search(params),
        queryFn: () => concoursSearch(params),
        enabled: options?.enabled ?? true,
        staleTime: 15 * 60 * 1000,
        gcTime: 30*60*1000,
        placeholderData: (previousData) => previousData,
    });
}

// Hooks React Query - MUTATIONS
export const useCreateConcours = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ request, file }: { request: ConcoursCreationRequest; file?: File }) =>
            createConcours(request, file),
        onSuccess: () => {
            // Invalider les queries pour rafraîchir les données
            queryClient.invalidateQueries({ queryKey: concoursKeys.all });
        },
    });
};

export const useUpdateConcours = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, request, file }: { id: number; request: ConcoursUpdateRequest; file?: File }) =>
            updateConcours(id, request, file),
        onSuccess: (data, variables) => {
            // Invalider les queries pour rafraîchir les données
            queryClient.invalidateQueries({ queryKey: concoursKeys.all });
            // Invalider spécifiquement le concours modifié
            queryClient.invalidateQueries({ queryKey: concoursKeys.detail(variables.id) });
        },
    });
};

export const useDeleteConcours = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: deleteConcours,
        onSuccess: () => {
            // Invalider les queries pour rafraîchir les données
            queryClient.invalidateQueries({ queryKey: concoursKeys.all });
        },
    });
};

