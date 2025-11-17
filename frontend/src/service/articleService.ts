// articleService.ts
import { Api } from "@/utils/axiosInstance";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import 
{
  ArticleCreationRequest, 
  ArticleDetailResponse, 
  ArticleSummaryResponse, 
  SearchArticlesParams,
  ArticleUpdateRequest
} 
from "@/types/articleType"; 

const getAllArticles = async (): Promise<ArticleSummaryResponse[]> => {
  const response = await Api.get<ArticleSummaryResponse[]>("/visitor/articles");
  return response.data;
};

const getArticleBySlug = async (slug: string): Promise<ArticleDetailResponse> => {
  const response = await Api.get<ArticleDetailResponse>(`/visitor/articles/slug/${slug}`);
  return response.data;
};

const getArticleById = async (id: number): Promise<ArticleDetailResponse> => {
  const response = await Api.get<ArticleDetailResponse>(`/visitor/articles/${id}`);
  return response.data;
};

const searchArticles = async (params: SearchArticlesParams): Promise<ArticleSummaryResponse[]> => {
  const { search, categorie = "all", sortBy = "newest" } = params;
  
  const queryParams = new URLSearchParams();
  if (search) queryParams.append("search", search);
  if (categorie && categorie !== "all") queryParams.append("categorie", categorie);
  queryParams.append("sortBy", sortBy);

  const url = `/visitor/articles/search?${queryParams.toString()}`;
  const response = await Api.get<ArticleSummaryResponse[]>(url);
  return response.data;
};

const getPopularArticles = async (): Promise<ArticleSummaryResponse[]> => {
  const response = await Api.get<ArticleSummaryResponse[]>("/visitor/articles/popular");
  return response.data;
};

const getArticlesByCategorie = async (categorie: string): Promise<ArticleSummaryResponse[]> => {
  const response = await Api.get<ArticleSummaryResponse[]>(`/visitor/articles/categorie/${categorie}`);
  return response.data;
};

const getSimilarArticles = async (id: number, categorie: string): Promise<ArticleSummaryResponse[]> => {
  const response = await Api.get<ArticleSummaryResponse[]>(`/visitor/articles/${id}/similar?categorie=${categorie}`);
  return response.data;
};

const getCategoriesWithCount = async (): Promise<Record<string, number>> => {
  const response = await Api.get<Record<string, number>>("/visitor/articles/categories");
  return response.data;
};

const createArticle = async (
  request: ArticleCreationRequest, 
  file?: File
): Promise<ArticleDetailResponse> => {
  const formData = new FormData();
  
  // Ajouter l'article comme JSON
  const articleBlob = new Blob([JSON.stringify(request)], { type: 'application/json' });
  formData.append('article', articleBlob);
  
  // Ajouter le fichier si présent
  if (file) {
    formData.append('image', file);
  }

  const response = await Api.post<ArticleDetailResponse>('/admin/articles', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

const updateArticle = async (
  id: number,
  request: ArticleUpdateRequest,
  file?: File
): Promise<ArticleDetailResponse> => {
  const formData = new FormData();
  
  // Ajouter l'article comme JSON
  const articleBlob = new Blob([JSON.stringify(request)], { type: 'application/json' });
  formData.append('article', articleBlob);
  
  // Ajouter le fichier si présent
  if (file) {
    formData.append('image', file);
  }

  const response = await Api.put<ArticleDetailResponse>(`/admin/articles/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

const deleteArticle = async (id: number): Promise<void> => {
  await Api.delete(`/admin/articles/${id}`);
};

// Fonctions utilitaires pour les fichiers
export const openArticleFile = (filePath: string) => {
  if (!filePath) return;

  let fileUrl = filePath;
  
  // Construire l'URL complète si nécessaire
  if (!filePath.startsWith('http')) {
    const baseUrl = process.env.REACT_APP_API_URL || '';
    fileUrl = `${baseUrl}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
  }

  window.open(fileUrl, '_blank');
};

export const downloadArticleFile = async (filePath: string, articleTitle: string) => {
  if (!filePath) return;

  try {
    let fileUrl = filePath;
    
    if (!filePath.startsWith('http')) {
      const baseUrl = process.env.REACT_APP_API_URL || '';
      fileUrl = `${baseUrl}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
    }

    const link = document.createElement('a');
    link.href = fileUrl;
    link.setAttribute('download', `${articleTitle.replace(/\s+/g, '_')}_image.jpg`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error);
    openArticleFile(filePath);
  }
};

// Query keys
export const articleKeys = {
  all: ["articles"] as const,
  lists: () => [...articleKeys.all, "list"] as const,
  list: (filters: SearchArticlesParams) => [...articleKeys.lists(), filters] as const,
  details: () => [...articleKeys.all, "detail"] as const,
  detail: (slug: string) => [...articleKeys.details(), slug] as const,
  detailById: (id: number) => [...articleKeys.details(), id] as const,
  popular: () => [...articleKeys.all, "popular"] as const,
  categories: () => [...articleKeys.all, "categories"] as const,
  similar: (id: number, categorie: string) => [...articleKeys.all, "similar", id, categorie] as const,
};

// React Query hooks - GET (déjà existants)
export const useGetAllArticles = () =>
  useQuery({
    queryKey: articleKeys.lists(),
    queryFn: getAllArticles,
    staleTime: 5 * 60 * 1000,
  });

export const useGetArticleBySlug = (slug: string) =>
  useQuery({
    queryKey: articleKeys.detail(slug),
    queryFn: () => getArticleBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

export const useGetArticleById = (id: number, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: articleKeys.detailById(id),
    queryFn: () => getArticleById(id),
    enabled: options?.enabled ?? !!id,
    staleTime: 5 * 60 * 1000,
  });

export const useSearchArticles = (params: SearchArticlesParams) =>
  useQuery({
    queryKey: articleKeys.list(params),
    queryFn: () => searchArticles(params),
    staleTime: 5 * 60 * 1000,
  });

export const useGetPopularArticles = () =>
  useQuery({
    queryKey: articleKeys.popular(),
    queryFn: getPopularArticles,
    staleTime: 5 * 60 * 1000,
  });

export const useGetArticlesByCategorie = (categorie: string) =>
  useQuery({
    queryKey: [...articleKeys.lists(), { categorie }],
    queryFn: () => getArticlesByCategorie(categorie),
    enabled: !!categorie,
    staleTime: 5 * 60 * 1000,
  });

export const useGetSimilarArticles = (id: number, categorie: string) =>
  useQuery({
    queryKey: articleKeys.similar(id, categorie),
    queryFn: () => getSimilarArticles(id, categorie),
    enabled: !!id && !!categorie,
    staleTime: 5 * 60 * 1000,
  });

export const useGetCategoriesWithCount = () =>
  useQuery({
    queryKey: articleKeys.categories(),
    queryFn: getCategoriesWithCount,
  });

// React Query hooks - MUTATIONS (NOUVEAUX)
export const useCreateArticle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ request, file }: { request: ArticleCreationRequest; file?: File }) =>
      createArticle(request, file),
    onSuccess: () => {
      // Invalider les queries pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: articleKeys.all });
    },
  });
};

export const useUpdateArticle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, request, file }: { id: number; request: ArticleUpdateRequest; file?: File }) =>
      updateArticle(id, request, file),
    onSuccess: (data, variables) => {
      // Invalider les queries pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: articleKeys.all });
      // Invalider spécifiquement l'article modifié
      queryClient.invalidateQueries({ queryKey: articleKeys.detail(data.slug) });
      queryClient.invalidateQueries({ queryKey: articleKeys.detailById(variables.id) });
    },
  });
};

export const useDeleteArticle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteArticle,
    onSuccess: () => {
      // Invalider les queries pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: articleKeys.all });
    },
  });
};


