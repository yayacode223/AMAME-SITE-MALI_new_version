// ProtectedRoute.ts
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types/userType";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, user, isUserLoading } = useAuth();

  if (isUserLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== UserRole.ADMIN && user?.role !== UserRole.SUPERADMIN) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
