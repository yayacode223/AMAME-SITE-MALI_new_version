import { createContext, useContext, ReactNode } from "react";
import * as authService from "@/service/authService";
import * as Type from "@/types/userType";


interface AuthContextType {
  user: Type.RegisterResponse | null;
  isAuthenticated: boolean;
  isRegistering: boolean;
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  isUserLoading: boolean; 
  register: (data: Type.RegisterPayload) => Promise<Type.RegisterResponse>;
  login: (credentials: Type.LoginType) => Promise<Type.RegisterResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { mutateAsync: registerMutation, isPending: isRegistering } = authService.useRegisterMutation();
  const { mutateAsync: loginMutation, isPending: isLoggingIn } = authService.useLoginMutation();
  const { mutateAsync: logoutMutation, isPending: isLoggingOut } = authService.useLogoutMutation();

  const { data: user, isLoading: isUserLoading } = authService.useGetCurrentUser(); 

  const register = (data: Type.RegisterPayload) => {
    return registerMutation(data);
  };

  const login = (credentials: Type.LoginType) => {
    return loginMutation(credentials);
  };
  
  const logout = () => {
    return logoutMutation();
  };

  const finalUser = user ?? null; // S'assurer que la valeur est `null` et non `undefined`
  const isAuthenticated = !!finalUser;

  const value: AuthContextType = {
    user: finalUser,
    isAuthenticated,
    isRegistering,
    isLoggingIn,
    isLoggingOut,
    isUserLoading,
    register,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Le hook d'accès reste le même, c'est la beauté de l'abstraction !
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};