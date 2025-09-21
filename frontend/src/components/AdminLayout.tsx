
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client'
import { Loader2 } from 'lucide-react';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  
  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      try {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return false;
        
        // Use has_role RPC to check admin role
        const { data: hasAdminRole, error } = await supabase.rpc(
          'has_role',
          { role: 'admin' }
        );
        
        if (error) {
          console.error("Erreur lors de la vérification du rôle admin:", error);
          return false;
        }
        
        return hasAdminRole;
      } catch (err) {
        console.error("Erreur lors de la vérification du rôle admin:", err);
        return false;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // If still checking admin status
  if (checkingAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Vérification des droits d'accès...</span>
      </div>
    );
  }

  // If not admin, return children (Admin component will handle error message)
  if (isAdmin === false) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="container mx-auto px-4">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
