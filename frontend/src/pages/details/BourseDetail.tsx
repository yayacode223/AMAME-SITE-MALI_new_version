
// import React from 'react';
// import { useParams, Link } from 'react-router-dom';
// import { useQuery } from '@tanstack/react-query';
// import { supabase } from '@/integrations/supabase/client';
// import { ArrowLeft, Calendar, GraduationCap, Globe, Check } from 'lucide-react';
// import Navbar from '@/components/Navbar';
// import Footer from '@/components/Footer';
// import { Button } from "@/components/ui/button";
// import { Skeleton } from "@/components/ui/skeleton";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";

// const BourseDetail = () => {
//   const { id } = useParams<{ id: string }>();
  
//   const { data: bourse, isLoading, error } = useQuery({
//     queryKey: ['bourses', id],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from('bourses')
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
//         <section className="bg-gradient-to-r from-amame-orange to-yellow-500 text-white py-6 px-4">
//           <div className="container mx-auto">
//             <Link to="/bourses" className="flex items-center text-white mb-4 hover:underline">
//               <ArrowLeft className="mr-2 h-5 w-5" />
//               Retour aux bourses
//             </Link>
            
//             {isLoading ? (
//               <Skeleton className="h-12 w-3/4 bg-white/20" />
//             ) : error ? (
//               <h1 className="text-3xl md:text-4xl font-bold">Bourse non trouvée</h1>
//             ) : (
//               <h1 className="text-3xl md:text-4xl font-bold">{bourse?.titre}</h1>
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
//                 <p className="text-gray-500 mt-2">Impossible de charger les détails de cette bourse.</p>
//                 <Button asChild className="mt-4">
//                   <Link to="/bourses">Retour aux bourses</Link>
//                 </Button>
//               </div>
//             ) : bourse ? (
//               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                 {/* Main info card */}
//                 <Card className="lg:col-span-2">
//                   <CardHeader>
//                     <div className="flex flex-wrap justify-between items-start gap-2">
//                       <CardTitle>
//                         {bourse.titre}
//                         <p className="text-sm font-normal text-gray-500 mt-1">
//                           Fourni par: {bourse.provider || 'Non spécifié'}
//                         </p>
//                       </CardTitle>
//                       <Badge variant="outline" className="text-sm">
//                         {bourse.level || 'Non spécifié'}
//                       </Badge>
//                     </div>
//                   </CardHeader>
//                   <CardContent className="space-y-6">
//                     <div>
//                       <h3 className="font-medium text-lg">Description</h3>
//                       <p className="mt-2 text-gray-700">{bourse.description || 'Aucune description disponible.'}</p>
//                     </div>
                    
//                     <div>
//                       <h3 className="font-medium text-lg">Avantages</h3>
//                       <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
//                         {bourse.benefits && Array.isArray(bourse.benefits) ? 
//                           bourse.benefits.map((benefit: string, index: number) => (
//                             <div key={index} className="flex items-start">
//                               <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
//                               <span>{benefit}</span>
//                             </div>
//                           )) : 
//                           <p className="text-gray-500">Avantages non spécifiés</p>
//                         }
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
                
//                 {/* Sidebar */}
//                 <Card>
//                   <CardHeader>
//                     <CardTitle>Informations clés</CardTitle>
//                   </CardHeader>
//                   <CardContent className="space-y-4">
//                     <div>
//                       <h3 className="font-medium mb-2 flex items-center">
//                         <Globe className="h-4 w-4 mr-2" />
//                         Pays
//                       </h3>
//                       <p className="text-sm text-gray-700">{bourse.country || 'Non spécifié'}</p>
//                     </div>
                    
//                     <div className="border-t pt-4">
//                       <h3 className="font-medium mb-2 flex items-center">
//                         <GraduationCap className="h-4 w-4 mr-2" />
//                         Niveau d'études
//                       </h3>
//                       <p className="text-sm text-gray-700">{bourse.level || 'Non spécifié'}</p>
//                     </div>
                    
//                     <div className="border-t pt-4">
//                       <h3 className="font-medium mb-2 flex items-center">
//                         <Calendar className="h-4 w-4 mr-2" />
//                         Date limite
//                       </h3>
//                       <p className="text-sm font-bold text-red-600">{bourse.deadline || 'Non spécifiée'}</p>
//                     </div>
                    
//                     <Button className="w-full mt-6">
//                       Postuler maintenant
//                     </Button>
                    
//                     <Button variant="outline" className="w-full">
//                       Télécharger les documents
//                     </Button>
//                   </CardContent>
//                 </Card>
//               </div>
//             ) : (
//               <div className="text-center py-12">
//                 <h2 className="text-2xl font-bold text-gray-700">Bourse non trouvée</h2>
//                 <p className="text-gray-500 mt-2">La bourse que vous recherchez n'existe pas.</p>
//                 <Button asChild className="mt-4">
//                   <Link to="/bourses">Retour aux bourses</Link>
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

// export default BourseDetail;
