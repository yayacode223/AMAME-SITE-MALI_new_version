import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Api } from "@/utils/axiosInstance";
import {
  LoginType,
  RegisterResponse,
  RegisterPayload,
  RegisterUpdatePayload,
} from "@/types/userType";
import { toast } from "@/hooks/use-toast";

export const register = async (
  data: RegisterPayload,
): Promise<RegisterResponse> => {
  const formData = new FormData();

  formData.append(
    "user",
    new Blob([JSON.stringify(data.user)], {
      type: "application/json",
    }),
  );

  if (data.cv) {
    formData.append("cv", data.cv, data.cv.name);
  }

  if (data.image) {
    formData.append("image", data.image, data.image.name);
  }

  const response = await Api.post<RegisterResponse>(
    "/visitor/register",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
};

export const getUserById = async (id: number): Promise<RegisterResponse> => {
  const response = await Api.get<RegisterResponse>(`/user/${id}`);
  return response.data;
};

export const update = async (
  data: RegisterUpdatePayload,
): Promise<RegisterResponse> => {
  const formData = new FormData();
  formData.append(
    "user",
    new Blob([JSON.stringify(data.user)], {
      type: "application/json",
    }),
  );

  if (data.cv) {
    formData.append("cv", data.cv, data.cv.name);
  }
  if (data.image) {
    formData.append("image", data.image, data.image.name);
  }
  const response = await Api.put<RegisterResponse>(
    `/user/update/${data.id}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};

export const login = async (
  credential: LoginType,
): Promise<RegisterResponse> => {
  const response = await Api.post<RegisterResponse>("/auth/login", credential);
  return response.data;
};

export const logout = async (): Promise<void> => {
  await Api.post<void>("/auth/logout");
};

export const getAllUsers = async (): Promise<RegisterResponse[]> => {
  const response = await Api.get<RegisterResponse[]>("/admin/users");
  return response.data;
};

export const getCurrentUser = async (): Promise<RegisterResponse> => {
  const response = await Api.get<RegisterResponse>("/auth/me");
  return response.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await Api.delete<void>(`/admin/user/${id}`);
};

export const authKeys = {
  all: ["auth"] as const,
  currentUser: () => [...authKeys.all, "currentUser"] as const,
  users: () => [...authKeys.all, "users"] as const,
  detail: (id: number) => [...authKeys.all, "detail", id] as const,
};

export const useRegisterMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: register,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
};

export const useGetUserById = (id: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: authKeys.detail(id),
    queryFn: () => getUserById(id),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: update,
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.currentUser(), user);
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      toast({
        title: "Modifie avec succes !",
      });
    },
    onError: () => {
      toast({
        title: "Impossible de modifier",
        variant: "destructive",
      });
    },
  });
};

export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.currentUser(), user);
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: authKeys.currentUser() });
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
};

export const useGetCurrentUser = () => {
  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: getCurrentUser,
    staleTime: Infinity, // Les données de l'utilisateur ne deviennent "périmées" que lors de la déconnexion.
    gcTime: Infinity, // Garder en cache indéfiniment jusqu'à invalidation.
    retry: false, // Ne pas réessayer de fetcher l'utilisateur s'il n'est pas là.
    // enabled: options?.enabled ?? true,
  });
};

export const useGetAllUsers = (options?: { enabled: boolean }) => {
  return useQuery({
    queryKey: [...authKeys.all, "users"],
    queryFn: getAllUsers,
    staleTime: 60 * 60 * 1000,
    ...options,
  });
};

export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.users() });
      toast({
        title: "Supprime avec succes !",
      });
    },
    onError: () => {
      toast({
        title: "Impossible de supprimer",
        variant: "destructive",
      });
    },
  });
};
