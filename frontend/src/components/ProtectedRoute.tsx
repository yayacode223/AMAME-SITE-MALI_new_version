import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/**
 * Protège les routes du dashboard admin.
 * Accès autorisé si l'utilisateur possède la permission DASHBOARD_ACCESS,
 * ce qui couvre ADMIN, SUPERADMIN et EDITOR par défaut,
 * ainsi que tout utilisateur à qui elle a été accordée individuellement.
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, hasPermission, isUserLoading } = useAuth();

  if (isUserLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amame-green" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission("DASHBOARD_ACCESS")) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
