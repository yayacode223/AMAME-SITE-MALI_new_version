import { createContext, useCallback, useContext, ReactNode } from "react";
import * as authService from "@/service/userService";
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
  /** Vérifie si l'utilisateur courant possède une permission effective. */
  hasPermission: (permission: Type.Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { mutateAsync: registerMutation, isPending: isRegistering } =
    authService.useRegisterMutation();
  const { mutateAsync: loginMutation, isPending: isLoggingIn } =
    authService.useLoginMutation();
  const { mutateAsync: logoutMutation, isPending: isLoggingOut } =
    authService.useLogoutMutation();

  const { data: user, isLoading: isUserLoading } =
    authService.useGetCurrentUser();

  const register = (data: Type.RegisterPayload) => {
    return registerMutation(data);
  };

  const login = (credentials: Type.LoginType) => {
    return loginMutation(credentials);
  };

  const logout = () => {
    return logoutMutation();
  };

  const finalUser = user ?? null;
  const isAuthenticated = !!finalUser;

  const hasPermission = useCallback(
    (permission: Type.Permission): boolean =>
      finalUser?.permissions?.includes(permission) ?? false,
    [finalUser],
  );

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
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};


// context/AuthContext.tsx
// import { createContext, useContext, ReactNode } from "react";
// import * as authService from "@/service/userService";
// import * as Type from "@/types/userType";
// import { useAuthQuery } from "@/hooks/useAuthQuery"; // ← Nouveau hook

// interface AuthContextType {
//   user: Type.RegisterResponse | null;
//   isAuthenticated: boolean;
//   isRegistering: boolean;
//   isLoggingIn: boolean;
//   isLoggingOut: boolean;
//   isUserLoading: boolean;
//   register: (data: Type.RegisterPayload) => Promise<Type.RegisterResponse>;
//   login: (credentials: Type.LoginType) => Promise<Type.RegisterResponse>;
//   logout: () => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const AuthProvider = ({ children }: { children: ReactNode }) => {
//   const { mutateAsync: registerMutation, isPending: isRegistering } =
//     authService.useRegisterMutation();
//   const { mutateAsync: loginMutation, isPending: isLoggingIn } =
//     authService.useLoginMutation();
//   const { mutateAsync: logoutMutation, isPending: isLoggingOut } =
//     authService.useLogoutMutation();

//   // Utiliser notre nouveau hook
//   const { user, isLoading: isUserLoading, isAuthenticated } = useAuthQuery();

//   const register = (data: Type.RegisterPayload) => {
//     return registerMutation(data);
//   };

//   const login = (credentials: Type.LoginType) => {
//     return loginMutation(credentials);
//   };

//   const logout = () => {
//     return logoutMutation();
//   };

//   const value: AuthContextType = {
//     user,
//     isAuthenticated,
//     isRegistering,
//     isLoggingIn,
//     isLoggingOut,
//     isUserLoading,
//     register,
//     login,
//     logout,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// };