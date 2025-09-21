
// import React from 'react';
// import { useParams, Link } from 'react-router-dom';
// import { useQuery } from '@tanstack/react-query';
// import { supabase } from '@/integrations/supabase/client';
// import { ArrowLeft, Book, Clock, GraduationCap, School } from 'lucide-react';
// import Navbar from '@/components/Navbar';
// import Footer from '@/components/Footer';
// import { Button } from "@/components/ui/button";
// import { Skeleton } from "@/components/ui/skeleton";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";

// const FiliereDetail = () => {
//   const { id } = useParams<{ id: string }>();
  
//   const { data: filiere, isLoading, error } = useQuery({
//     queryKey: ['filieres', id],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from('filieres')
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
//         <section className="bg-amame-green text-white py-6 px-4">
//           <div className="container mx-auto">
//             <Link to="/filieres" className="flex items-center text-white mb-4 hover:underline">
//               <ArrowLeft className="mr-2 h-5 w-5" />
//               Retour aux filières
//             </Link>
            
//             {isLoading ? (
//               <Skeleton className="h-12 w-3/4 bg-white/20" />
//             ) : error ? (
//               <h1 className="text-3xl md:text-4xl font-bold">Filière non trouvée</h1>
//             ) : (
//               <h1 className="text-3xl md:text-4xl font-bold">{filiere?.titre}</h1>
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
//                 <p className="text-gray-500 mt-2">Impossible de charger les détails de cette filière.</p>
//                 <Button asChild className="mt-4">
//                   <Link to="/filieres">Retour aux filières</Link>
//                 </Button>
//               </div>
//             ) : filiere ? (
//               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                 {/* Main info card */}
//                 <Card className="lg:col-span-2">
//                   <CardHeader>
//                     <div className="flex justify-between items-start">
//                       <CardTitle>Informations générales</CardTitle>
//                       <Badge variant="outline" className="text-sm">
//                         {filiere.niveau || 'Non spécifié'}
//                       </Badge>
//                     </div>
//                   </CardHeader>
//                   <CardContent className="space-y-6">
//                     <div>
//                       <h3 className="font-medium text-lg">Description</h3>
//                       <p className="mt-2 text-gray-700">{filiere.description || 'Aucune description disponible.'}</p>
//                     </div>
                    
//                     <div>
//                       <h3 className="font-medium text-lg">Institution</h3>
//                       <div className="flex items-center mt-2">
//                         <School className="h-5 w-5 text-gray-500 mr-2" />
//                         <span>{filiere.institution || 'Non spécifié'}</span>
//                       </div>
//                     </div>
                    
//                     <div>
//                       <h3 className="font-medium text-lg">Durée</h3>
//                       <div className="flex items-center mt-2">
//                         <Clock className="h-5 w-5 text-gray-500 mr-2" />
//                         <span>{filiere.duree || 'Non spécifiée'}</span>
//                       </div>
//                     </div>
                    
//                     <div>
//                       <h3 className="font-medium text-lg">Débouchés</h3>
//                       <p className="mt-2 text-gray-700">{filiere.debouches || 'Aucun débouché spécifié.'}</p>
//                     </div>
//                   </CardContent>
//                 </Card>
                
//                 {/* Sidebar */}
//                 <Card>
//                   <CardHeader>
//                     <CardTitle>Informations complémentaires</CardTitle>
//                   </CardHeader>
//                   <CardContent className="space-y-4">
//                     <div>
//                       <h3 className="font-medium mb-2 flex items-center">
//                         <Book className="h-4 w-4 mr-2" />
//                         Niveau requis
//                       </h3>
//                       <p className="text-sm text-gray-700">{filiere.niveau || 'Non spécifié'}</p>
//                     </div>
                    
//                     <div className="border-t pt-4">
//                       <h3 className="font-medium mb-2 flex items-center">
//                         <GraduationCap className="h-4 w-4 mr-2" />
//                         Perspectives de carrière
//                       </h3>
//                       <p className="text-sm text-gray-700">{filiere.debouches || 'Non spécifié'}</p>
//                     </div>
                    
//                     <div className="border-t pt-4">
//                       <Button className="w-full mt-2">
//                         Contacter pour plus d'informations
//                       </Button>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </div>
//             ) : (
//               <div className="text-center py-12">
//                 <h2 className="text-2xl font-bold text-gray-700">Filière non trouvée</h2>
//                 <p className="text-gray-500 mt-2">La filière que vous recherchez n'existe pas.</p>
//                 <Button asChild className="mt-4">
//                   <Link to="/filieres">Retour aux filières</Link>
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

// export default FiliereDetail;
