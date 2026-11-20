import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { Permission, Role } from "@/types/userType";
import { hasSessionEnded, loginPath } from "@/utils/authRedirect";

interface RequireAuthProps {
  children: ReactNode;
  /** Permission exigée (espace admin : DASHBOARD_ACCESS, que portent ADMIN, SUPERADMIN, EDITOR). */
  permission?: Permission;
  /** Rôles admis (espace membre). */
  roles?: Role[];
  /** Où envoyer un utilisateur connecté qui n'a pas l'accès. */
  deniedTo: string;
}

/**
 * Garde unique des pages réservées (/admin, /membre). Un visiteur non connecté part vers /login avec
 * la page demandée (chemin, paramètres, ancre), et y revient après la connexion (rapport 05, P2).
 * Les redirections remplacent l'entrée d'historique : le bouton Retour ne ramène pas sur la garde.
 */
export default function RequireAuth({ children, permission, roles, deniedTo }: RequireAuthProps) {
  const { user, isAuthenticated, isUserLoading, hasPermission } = useAuth();
  const location = useLocation();

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amame-surface" role="status" aria-label="Chargement">
        <div className="animate-spin h-8 w-8 border-2 border-amame-green border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={loginPath(location, hasSessionEnded() ? "session" : "acces")} replace />;
  }

  const allowed =
    (!permission || hasPermission(permission)) &&
    (!roles || (!!user?.role && roles.includes(user.role)));
  if (!allowed) {
    return <Navigate to={deniedTo} replace />;
  }

  return <>{children}</>;
}
