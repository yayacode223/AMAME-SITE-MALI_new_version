// articleService.ts
import { Api } from "@/utils/axiosInstance";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArticleCreationRequest,
  ArticleDetailResponse,
  ArticleSummaryResponse,
  SearchArticlesParams,
  ArticleUpdateRequest,
} from "@/types/articleType";
import { PageResponse, PaginationParams } from "@/types/commonTypes";

export interface ArticlePageParams extends PaginationParams {
  search?: string;
  categorie?: string;
}

// /visitor/articles/search gère tous les cas : sans search/categorie = liste complète
const getAllArticles = async (params?: ArticlePageParams): Promise<PageResponse<ArticleSummaryResponse>> => {
  const {
    page = 0,
    size = 9,
    sortBy = "datePublication",
    sortDirection = "DESC",
    search,
    categorie = "all",
  } = params || {};
  const q = new URLSearchParams({
    page: String(page),
    size: String(size),
    sortBy,
    sortDirection,
    categorie,
  });
  if (search?.trim()) q.append("search", search.trim());
  const response = await Api.get<PageResponse<ArticleSummaryResponse>>(
    `/visitor/articles/search?${q}`,
  );
  return response.data;
};

// Admin : liste complète (publiés + brouillons)
const getAdminArticles = async (params?: ArticlePageParams): Promise<PageResponse<ArticleSummaryResponse>> => {
  const {
    page = 0,
    size = 10,
    sortBy = "datePublication",
    sortDirection = "DESC",
    search,
    categorie = "all",
  } = params || {};
  const q = new URLSearchParams({
    page: String(page),
    size: String(size),
    sortBy,
    sortDirection,
    categorie,
  });
  if (search?.trim()) q.append("search", search.trim());
  const response = await Api.get<PageResponse<ArticleSummaryResponse>>(
    `/admin/articles?${q}`,
  );
  return response.data;
};

// Autres fonctions pour les pages de détail
const getArticleBySlug = async (
  slug: string,
): Promise<ArticleDetailResponse> => {
  const response = await Api.get<ArticleDetailResponse>(
    `/visitor/articles/slug/${slug}`,
  );
  return response.data;
};

const getArticleById = async (id: number): Promise<ArticleDetailResponse> => {
  const response = await Api.get<ArticleDetailResponse>(
    `/visitor/articles/${id}`,
  );
  return response.data;
};

const getAvailableCategories = async (): Promise<string[]> => {
  const response = await Api.get<string[]>("/visitor/articles/categories");
  return response.data;
};

// Mutations (identiques)
const createArticle = async (
  request: ArticleCreationRequest,
  file?: File,
): Promise<ArticleDetailResponse> => {
  const formData = new FormData();
  const articleBlob = new Blob([JSON.stringify(request)], {
    type: "application/json",
  });
  formData.append("article", articleBlob);

  if (file) {
    formData.append("image", file);
  }

  const response = await Api.post<ArticleDetailResponse>(
    "/admin/articles",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};

const updateArticle = async (
  id: number,
  request: ArticleUpdateRequest,
  file?: File,
): Promise<ArticleDetailResponse> => {
  const formData = new FormData();
  const articleBlob = new Blob([JSON.stringify(request)], {
    type: "application/json",
  });
  formData.append("article", articleBlob);

  if (file) {
    formData.append("image", file);
  }

  const response = await Api.put<ArticleDetailResponse>(
    `/admin/articles/${id}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};

const deleteArticle = async (id: number): Promise<void> => {
  await Api.delete(`/admin/articles/${id}`);
};

// Fonctions utilitaires (identiques)
export const openArticleFile = (filePath: string) => {
  if (!filePath) return;

  let fileUrl = filePath;

  if (!filePath.startsWith("http")) {
    const baseUrl = process.env.REACT_APP_API_URL || "";
    fileUrl = `${baseUrl}${filePath.startsWith("/") ? "" : "/"}${filePath}`;
  }

  window.open(fileUrl, "_blank");
};

export const downloadArticleFile = async (
  filePath: string,
  articleTitle: string,
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
      `${articleTitle.replace(/\s+/g, "_")}_image.jpg`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Erreur lors du téléchargement:", error);
    openArticleFile(filePath);
  }
};

// Query keys
export const articleKeys = {
  all: ["articles"] as const,
  lists: (params?: ArticlePageParams) => [...articleKeys.all, "list", params] as const,
  details: () => [...articleKeys.all, "detail"] as const,
  detail: (slug: string) => [...articleKeys.details(), slug] as const,
  detailById: (id: number) => [...articleKeys.details(), id] as const,
  categories: () => [...articleKeys.all, "categories"] as const,
};

export const useGetAllArticles = (params?: ArticlePageParams, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: articleKeys.lists(params),
    queryFn: () => getAllArticles(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    placeholderData: (prev) => prev,
    enabled: options?.enabled ?? true,
  });

// Hook pour récupérer les catégories disponibles
export const useGetAvailableCategories = () =>
  useQuery({
    queryKey: articleKeys.categories(),
    queryFn: getAvailableCategories,
    staleTime: 60 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

// Hooks pour les pages de détail
export const useGetArticleBySlug = (
  slug: string,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: articleKeys.detail(slug),
    queryFn: () => getArticleBySlug(slug),
    enabled: options?.enabled ?? !!slug,
    staleTime: 10 * 60 * 1000,
  });

export const useGetArticleById = (
  id: number,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: articleKeys.detailById(id),
    queryFn: () => getArticleById(id),
    enabled: options?.enabled ?? !!id,
    staleTime: 10 * 60 * 1000,
  });

export const useGetAdminArticles = (params?: ArticlePageParams) =>
  useQuery({
    queryKey: [...articleKeys.all, "admin", params],
    queryFn: () => getAdminArticles(params),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

// HOOKS DÉSACTIVÉS pour compatibilité
export const useSearchArticles = (params: SearchArticlesParams) =>
  useQuery({
    queryKey: articleKeys.lists(),
    queryFn: () => Promise.resolve([]),
    enabled: false, // DÉSACTIVÉ
  });

export const useGetPopularArticles = () =>
  useQuery({
    queryKey: [...articleKeys.lists(), "popular"],
    queryFn: () => Promise.resolve([]),
    enabled: false, // DÉSACTIVÉ
  });

export const useGetArticlesByCategorie = (categorie: string) =>
  useQuery({
    queryKey: [...articleKeys.lists(), { categorie }],
    queryFn: () => Promise.resolve([]),
    enabled: false, // DÉSACTIVÉ
  });

export const useGetCategoriesWithCount = () =>
  useQuery({
    queryKey: [...articleKeys.lists(), "categoriesWithCount"],
    queryFn: () => Promise.resolve({}),
    enabled: false, // DÉSACTIVÉ
  });

// Mutations (restent identiques)
export const useCreateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      request,
      file,
    }: {
      request: ArticleCreationRequest;
      file?: File;
    }) => createArticle(request, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.all });
    },
  });
};

export const useUpdateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      request,
      file,
    }: {
      id: number;
      request: ArticleUpdateRequest;
      file?: File;
    }) => updateArticle(id, request, file),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: articleKeys.all });
      queryClient.invalidateQueries({
        queryKey: articleKeys.detail(data.slug),
      });
      queryClient.invalidateQueries({
        queryKey: articleKeys.detailById(variables.id),
      });
    },
  });
};

export const useDeleteArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.all });
    },
  });
};
