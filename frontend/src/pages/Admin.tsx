
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useQuery } from '@tanstack/react-query';
// import AdminLayout from '../components/AdminLayout';
// import AdminHeader from '../components/AdminHeader';
// import AdminTabs from '../components/admin/AdminTabs';
// import { Button } from '@/components/ui/button';
// import { Loader2, AlertCircle } from 'lucide-react';
// import { toast } from '@/hooks/use-toast';

// const Admin = () => {
//   const navigate = useNavigate();
//   const [error, setError] = useState<string | null>(null);
  
//   // Vérifier si l'utilisateur est connecté et a le rôle d'admin
//   const { data: sessionData, isLoading: checkingSession } = useQuery({
//     queryKey: ['adminSession'],
//     queryFn: async () => {
//       try {
//         // Vérifier si l'utilisateur est connecté
//         const { data: { session } } = await supabase.auth.getSession();
        
//         if (!session) {
//           setError("Vous devez être connecté pour accéder à l'administration");
//           return { isAdmin: false, session: null, userId: null };
//         }
        
//         console.log("Utilisateur connecté avec ID:", session.user.id);
        
//         // Utiliser la fonction rpc au lieu d'une requête directe pour éviter la récursion infinie
//         const { data: isAdmin, error: roleError } = await supabase.rpc(
//           'has_role', 
//           { role: 'admin' }
//         );
        
//         if (roleError) {
//           console.error("Erreur lors de la vérification du rôle:", roleError);
//           setError("Une erreur s'est produite lors de la vérification de vos droits");
//           return { isAdmin: false, session, userId: session.user.id };
//         }
        
//         if (!isAdmin) {
//           setError("Vous n'avez pas les droits d'administrateur nécessaires");
//           return { isAdmin: false, session, userId: session.user.id };
//         }
        
//         console.log("Rôle admin confirmé");
//         return { isAdmin: true, session, userId: session.user.id };
//       } catch (error) {
//         console.error("Erreur inattendue:", error);
//         setError("Une erreur inattendue s'est produite");
//         return { isAdmin: false, session: null, userId: null };
//       }
//     }
//   });

//   // Gérer le cas où l'utilisateur n'est pas admin
//   const handleAddAdminRole = async () => {
//     if (!sessionData?.userId) {
//       toast({
//         title: "Erreur",
//         description: "Vous devez être connecté pour effectuer cette action",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       const { data, error } = await 
//         .from('user_roles')
//         .insert([
//           { user_id: sessionData.userId, role: 'admin' }
//         ]);
      
//       if (error) throw error;
      
//       toast({
//         title: "Succès",
//         description: "Vous êtes maintenant administrateur",
//       });
      
//       // Rafraîchir la page pour montrer le tableau de bord admin
//       window.location.reload();
//     } catch (err) {
//       toast({
//         title: "Erreur",
//         description: err.message || "Une erreur s'est produite",
//         variant: "destructive",
//       });
//     }
//   };

//   // Afficher un chargement pendant la vérification
//   if (checkingSession) {
//     return (
//       <div className="flex min-h-screen items-center justify-center">
//         <Loader2 className="h-8 w-8 animate-spin text-primary" />
//         <span className="ml-2">Vérification des droits d'accès...</span>
//       </div>
//     );
//   }

//   // Si l'utilisateur n'est pas admin, afficher un message d'erreur
//   if (!sessionData?.isAdmin) {
//     return (
//       <div className="flex min-h-screen flex-col items-center justify-center p-4">
//         <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow-md">
//           <div className="mb-4 flex items-center justify-center text-red-500">
//             <AlertCircle size={48} />
//           </div>
//           <h1 className="mb-2 text-center text-2xl font-bold">Accès refusé</h1>
//           <p className="mb-6 text-center text-gray-600">
//             {error || "Vous n'avez pas les droits d'accès à l'administration"}
//           </p>
          
//           {sessionData?.userId && (
//             <div className="mb-4">
//               <Button 
//                 className="w-full" 
//                 onClick={handleAddAdminRole}
//               >
//                 Devenir administrateur
//               </Button>
//               <p className="mt-2 text-xs text-gray-500 text-center">
//                 Cette option est disponible uniquement en développement
//               </p>
//             </div>
//           )}
          
//           <Button 
//             className="w-full" 
//             variant="outline" 
//             onClick={() => navigate('/')}
//           >
//             Retour à l'accueil
//           </Button>
//         </div>
//       </div>
//     );
//   }

//   // Si l'utilisateur est bien admin, afficher le tableau de bord
//   return (
//     <AdminLayout>
//       <AdminHeader 
//         title="Administration" 
//         description="Gérez le contenu et les utilisateurs de la plateforme Orientation Académique."
//       />
//       <AdminTabs />
//     </AdminLayout>
//   );
// };

// export default Admin;
