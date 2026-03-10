// bourseService.ts
import { Api } from "@/utils/axiosInstance";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    BourseCreationRequest,
    BourseDefaultSearchParams,
    BourseDetail,
    BourseFilterParams,
    BourseResponsePaginated,
    BourseSearchRequest,
    BourseUpdateRequest
} from "@/types/bourseType";



// Fonctions API GET
const bourseLists = async (params: BourseDefaultSearchParams): Promise<BourseResponsePaginated> => {
    const { page = 0, size = 9, sortBy = 'dateLimite', sortDirection = 'ASC' } = params;
    const response = await Api.get<BourseResponsePaginated>(
        `/visitor/bourses?page=${page}&size=${size}&sortBy=${sortBy}&sortDirection=${sortDirection}`
    );
    return response.data;
}

const bourseDetail = async (id: number): Promise<BourseDetail> => {
    const response = await Api.get<BourseDetail>(`/visitor/bourses/${id}`);
    return response.data;
}

const bourseSearch = async (params: BourseSearchRequest): Promise<BourseResponsePaginated> => {
    const {
        titre,
        description,
        pays,
        page = 0,
        size = 9,
        sortBy = 'dateLimite',
        sortDirection = 'ASC'
    } = params;

    const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sortBy,
        sortDirection
    });

    if (titre) queryParams.append('titre', titre);
    if (description) queryParams.append('description', description);
    if (pays) queryParams.append('pays', pays);

    const response = await Api.get<BourseResponsePaginated>(
        `/visitor/bourses/search?${queryParams.toString()}`
    );
    return response.data;
}

const bourseFilter = async (params: BourseFilterParams): Promise<BourseResponsePaginated> => {
    const {
        categorie,
        niveau,
        pays,
        page = 0,
        size = 9,
        sortBy = 'dateLimite',
        sortDirection = 'ASC'
    } = params;

    const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sortBy,
        sortDirection
    });

    if (categorie) queryParams.append('categorie', categorie);
    if (niveau) queryParams.append('niveau', niveau);
    if (pays) queryParams.append('pays', pays);

    const response = await Api.get<BourseResponsePaginated>(
        `/visitor/bourses/filter?${queryParams.toString()}`
    );
    return response.data;
}

// Fonctions API POST, PUT, DELETE
const createBourse = async (
    request: BourseCreationRequest,
    file?: File
): Promise<BourseDetail> => {
    const formData = new FormData();

    // Ajouter la bourse comme JSON
    const bourseBlob = new Blob([JSON.stringify(request)], { type: 'application/json' });
    formData.append('bourse', bourseBlob);

    // Ajouter le fichier si présent
    if (file) {
        formData.append('file', file);
    }

    const response = await Api.post<BourseDetail>('/admin/bourses', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

const updateBourse = async (
    id: number,
    request: BourseUpdateRequest,
    file?: File
): Promise<BourseDetail> => {
    const formData = new FormData();

    // Ajouter la bourse comme JSON
    const bourseBlob = new Blob([JSON.stringify(request)], { type: 'application/json' });
    formData.append('bourse', bourseBlob);

    // Ajouter le fichier si présent
    if (file) {
        formData.append('file', file);
    }

    const response = await Api.put<BourseDetail>(`/admin/bourses/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

const deleteBourse = async (id: number): Promise<void> => {
    await Api.delete(`/admin/bourses/${id}`);
};

// Fonctions utilitaires pour les fichiers
export const openBourseFile = (filePath: string, fileName?: string) => {
    if (!filePath) return;

    let fileUrl = filePath;

    // Construire l'URL complète si nécessaire
    if (!filePath.startsWith('http')) {
        const baseUrl = process.env.REACT_APP_API_URL || '';
        fileUrl = `${baseUrl}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
    }

    window.open(fileUrl, '_blank');
};

export const downloadBourseFile = async (filePath: string, bourseTitle: string) => {
    if (!filePath) return;

    try {
        let fileUrl = filePath;

        if (!filePath.startsWith('http')) {
            const baseUrl = process.env.REACT_APP_API_URL || '';
            fileUrl = `${baseUrl}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
        }

        const link = document.createElement('a');
        link.href = fileUrl;
        link.setAttribute('download', `${bourseTitle.replace(/\s+/g, '_')}_document.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Erreur lors du téléchargement:', error);
        openBourseFile(filePath);
    }
};

// Clés de cache
const keys = {
    all: ["bourses"] as const,
    lists: (params: BourseDefaultSearchParams) => [...keys.all, "lists", params] as const,
    detail: (id: number) => [...keys.all, "detail", id] as const,
    search: (params: BourseSearchRequest) => [...keys.all, "search", params] as const,
    filter: (params: BourseFilterParams) => [...keys.all, "filter", params] as const,
}

// Hooks React Query - GET
export const useGetBourses = (params: BourseDefaultSearchParams, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: keys.lists(params),
        queryFn: () => bourseLists(params),
        enabled: options?.enabled ?? true,
        staleTime: 60 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        placeholderData: (previousData) => previousData
    });
}

export const useGetBourseDetail = (id: number, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: keys.detail(id),
        queryFn: () => bourseDetail(id),
        staleTime: 15 * 60 * 1000,
        gcTime: 30*60*1000,
        enabled: options?.enabled ?? !!id,
    });
}

export const useGetBourseBySearch = (params: BourseSearchRequest, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: keys.search(params),
        queryFn: () => bourseSearch(params),
        enabled: options?.enabled ?? true,
        staleTime: 15 * 60 * 1000,
        gcTime: 30*60*1000,
        placeholderData: (previousData) => previousData
    });
}

export const useGetBourseByFilter = (params: BourseFilterParams, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: keys.filter(params),
        queryFn: () => bourseFilter(params),
        enabled: options?.enabled ?? true,
        staleTime: 15 * 60 * 1000,
        gcTime: 30*60*1000,
        placeholderData: (previousData) => previousData
    });
}

// Hooks React Query - MUTATIONS
export const useCreateBourse = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ request, file }: { request: BourseCreationRequest; file?: File }) =>
            createBourse(request, file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: keys.all});
        },
    });
};

export const useUpdateBourse = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, request, file }: { id: number; request: BourseUpdateRequest; file?: File }) =>
            updateBourse(id, request, file),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: keys.all });
            queryClient.invalidateQueries({ queryKey: keys.detail(variables.id) });
        },
    });
};

export const useDeleteBourse = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteBourse,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: keys.all });
        },
    });
};
