
// import React from 'react';
// import { useParams, Link } from 'react-router-dom';
// import { useQuery } from '@tanstack/react-query';
// import { supabase } from '@/integrations/supabase/client';
// import { ArrowLeft, FileText, Calendar, Download, ExternalLink, Info } from 'lucide-react';
// import Navbar from '@/components/Navbar';
// import Footer from '@/components/Footer';
// import { Button } from "@/components/ui/button";
// import { Skeleton } from "@/components/ui/skeleton";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";

// const RessourceDetail = () => {
//   const { id } = useParams<{ id: string }>();
  
//   const { data: ressource, isLoading, error } = useQuery({
//     queryKey: ['ressources', id],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from('ressources')
//         .select('*')
//         .eq('id', id)
//         .single();
      
//       if (error) throw error;
//       return data;
//     }
//   });

//   return (
//     <div className="flex flex-col min-h-screen">
//       <Navbar />
//       <main className="flex-grow">
//         {/* Hero Section */}
//         <section className="bg-amame-blue text-white py-6 px-4">
//           <div className="container mx-auto">
//             <Link to="/ressources" className="flex items-center text-white mb-4 hover:underline">
//               <ArrowLeft className="mr-2 h-5 w-5" />
//               Retour aux ressources
//             </Link>
            
//             {isLoading ? (
//               <Skeleton className="h-12 w-3/4 bg-white/20" />
//             ) : error ? (
//               <h1 className="text-3xl md:text-4xl font-bold">Ressource non trouvée</h1>
//             ) : (
//               <h1 className="text-3xl md:text-4xl font-bold">{ressource?.titre}</h1>
//             )}
//           </div>
//         </section>

//         {/* Main Content */}
//         <section className="py-8 px-4">
//           <div className="container mx-auto">
//             {isLoading ? (
//               <div className="space-y-4">
//                 <Skeleton className="h-8 w-full" />
//                 <Skeleton className="h-32 w-full" />
//                 <Skeleton className="h-8 w-full" />
//                 <Skeleton className="h-20 w-full" />
//               </div>
//             ) : error ? (
//               <div className="text-center py-12">
//                 <h2 className="text-2xl font-bold text-gray-700">Une erreur est survenue</h2>
//                 <p className="text-gray-500 mt-2">Impossible de charger les détails de cette ressource.</p>
//                 <Button asChild className="mt-4">
//                   <Link to="/ressources">Retour aux ressources</Link>
//                 </Button>
//               </div>
//             ) : ressource ? (
//               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                 {/* Main info card */}
//                 <Card className="lg:col-span-2">
//                   <CardHeader>
//                     <div className="flex justify-between items-start">
//                       <CardTitle>
//                         <div className="flex items-center">
//                           <FileText className="mr-2 h-5 w-5 text-amame-blue" />
//                           {ressource.titre}
//                         </div>
//                       </CardTitle>
//                       <Badge variant="outline" className="text-sm capitalize">
//                         {ressource.type || 'Document'}
//                       </Badge>
//                     </div>
//                   </CardHeader>
//                   <CardContent className="space-y-6">
//                     <div>
//                       <h3 className="font-medium text-lg">Description</h3>
//                       <p className="mt-2 text-gray-700">{ressource.description || 'Aucune description disponible.'}</p>
//                     </div>
                    
//                     {ressource.source && (
//                       <div>
//                         <h3 className="font-medium text-lg">Source</h3>
//                         <p className="mt-2 text-gray-700">{ressource.source}</p>
//                       </div>
//                     )}
                    
//                     <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
//                       <div className="flex items-center">
//                         <Calendar className="h-5 w-5 text-gray-500 mr-2" />
//                         <span className="text-gray-600 text-sm">Ajouté le {
//                           ressource.created_at 
//                             ? new Date(ressource.created_at).toLocaleDateString('fr-FR') 
//                             : 'date inconnue'
//                         }</span>
//                       </div>
                      
//                       {ressource.file_size && (
//                         <Badge variant="secondary">{ressource.file_size}</Badge>
//                       )}
//                     </div>
//                   </CardContent>
//                 </Card>
                
//                 {/* Sidebar */}
//                 <Card>
//                   <CardHeader>
//                     <CardTitle>Actions</CardTitle>
//                   </CardHeader>
//                   <CardContent className="space-y-4">
//                     <Button className="w-full flex items-center justify-center">
//                       <Download className="mr-2 h-4 w-4" />
//                       Télécharger
//                     </Button>
                    
//                     {ressource.lien_externe && (
//                       <Button variant="outline" className="w-full flex items-center justify-center" asChild>
//                         <a href={ressource.lien_externe} target="_blank" rel="noopener noreferrer">
//                           <ExternalLink className="mr-2 h-4 w-4" />
//                           Accéder au lien
//                         </a>
//                       </Button>
//                     )}
                    
//                     <div className="border-t pt-4 mt-4">
//                       <div className="flex items-start space-x-2">
//                         <Info className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
//                         <p className="text-sm text-gray-500">
//                           Cette ressource est fournie à titre informatif. Pour toute question, veuillez contacter l'administration.
//                         </p>
//                       </div>
//                     </div>
                    
//                     <div className="border-t pt-4">
//                       <h3 className="font-medium mb-2">Catégorie</h3>
//                       <p className="text-sm">
//                         {ressource.category ? (
//                           <Badge variant="outline" className="capitalize">
//                             {ressource.category}
//                           </Badge>
//                         ) : (
//                           'Non catégorisé'
//                         )}
//                       </p>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </div>
//             ) : (
//               <div className="text-center py-12">
//                 <h2 className="text-2xl font-bold text-gray-700">Ressource non trouvée</h2>
//                 <p className="text-gray-500 mt-2">La ressource que vous recherchez n'existe pas.</p>
//                 <Button asChild className="mt-4">
//                   <Link to="/ressources">Retour aux ressources</Link>
//                 </Button>
//               </div>
//             )}
//           </div>
//         </section>
//       </main>
//       <Footer />
//     </div>
//   );
// };

// export default RessourceDetail;
