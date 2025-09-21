import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Api } from '@/utils/axiosInstance';
import { LoginType, RegisterResponse, RegisterPayload } from '@/types/userType';


export const register = async (data: RegisterPayload): Promise<RegisterResponse> => {
  const formData = new FormData();

  formData.append('user', new Blob([JSON.stringify(data.user)], {
    type: 'application/json',
  }));

  if (data.cv) {
    formData.append('cv', data.cv, data.cv.name);
  }

  if (data.image) {
    formData.append('image', data.image, data.image.name);
  }

  const response = await Api.post<RegisterResponse>('/user/register', formData,{
     headers: {
        'Content-Type': null,//'multipart/form-data',
      }
  });

  return response.data;
};

export const login = async (credential: LoginType): Promise<RegisterResponse> => {
  const response = await Api.post<RegisterResponse>('/auth/login', credential);
  return response.data;
};

export const logout = async (): Promise<void> => {
  await Api.post<void>('/auth/logout');
};

export const getCurrentUser = async(): Promise<RegisterResponse> => {
  const response = await Api.get<RegisterResponse>('/auth/me'); 
  return response.data; 
}


export const authKeys = {
  all: ['auth'] as const, // Clé pour toutes les requêtes d'authentification
  currentUser: () => [...authKeys.all, 'currentUser'] as const, // Clé spécifique pour l'utilisateur connecté
};

export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: register,
  });
};

export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.currentUser(), user);
    },
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout, 
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: authKeys.currentUser() });
    },
  });
};


export const useGetCurrentUser = () => {
  return useQuery({
    queryKey: authKeys.currentUser(), 
    queryFn: getCurrentUser,
    staleTime: Infinity, // Les données de l'utilisateur ne deviennent "périmées" que lors de la déconnexion.
    gcTime: Infinity,    // Garder en cache indéfiniment jusqu'à invalidation.
    retry: false, // Ne pas réessayer de fetcher l'utilisateur s'il n'est pas là.
  })
}
