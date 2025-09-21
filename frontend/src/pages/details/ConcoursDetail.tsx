
// import React from 'react';
// import { useParams, Link } from 'react-router-dom';
// import { useQuery } from '@tanstack/react-query';
// import { supabase } from '@/integrations/supabase/client';
// import { ArrowLeft, Calendar, Building2, FileText, Clock } from 'lucide-react';
// import Navbar from '@/components/Navbar';
// import Footer from '@/components/Footer';
// import { Button } from "@/components/ui/button";
// import { Skeleton } from "@/components/ui/skeleton";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";

// interface Concours {
//   id: string;
//   titre: string;
//   type: string;
//   institution: string;
//   description: string;
//   deadline: string;
//   conditions?: string;
//   documents?: string[];
// }

// const ConcoursDetail = () => {
//   const { id } = useParams<{ id: string }>();
  
//   const { data: concours, isLoading, error } = useQuery({
//     queryKey: ['concours', id],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from('concours')
//         .select('*')
//         .eq('id', id)
//         .single();
      
//       if (error) throw error;
//       return data;
//     }
//   });

//   // Backup static data for when no DB data is available
//   const staticConcours: Record<string, Concours> = {
//     "1": {
//       id: "1",
//       titre: "Concours d'entrée à l'École Nationale d'Ingénieurs",
//       type: "Concours national",
//       institution: "ENI-ABT",
//       description: "Concours annuel d'entrée à l'École Nationale d'Ingénieurs Abderhamane Baba Touré. Ce concours est ouvert aux bacheliers en série Sciences Exactes désireux de poursuivre leurs études en ingénierie. L'ENI-ABT est l'une des écoles d'ingénieurs les plus prestigieuses du Mali, formant des ingénieurs dans divers domaines techniques et technologiques.",
//       deadline: new Date("2024-07-15").toISOString(),
//       conditions: "Être titulaire d'un baccalauréat série Sciences Exactes avec une moyenne minimale de 12/20. Âge limite de 22 ans au 31 décembre de l'année du concours.",
//       documents: ["Copie légalisée du diplôme du baccalauréat", "Extrait d'acte de naissance", "Certificat de nationalité", "Reçu de paiement des frais d'inscription"]
//     },
//     "2": {
//       id: "2",
//       titre: "Concours d'entrée à la Faculté de Médecine",
//       type: "Concours national",
//       institution: "FMOS",
//       description: "Concours d'entrée à la Faculté de Médecine et d'Odonto-Stomatologie de Bamako. La FMOS est l'établissement de référence pour la formation médicale au Mali. Ce concours hautement sélectif permet d'accéder à des formations en médecine générale, pharmacie, odontologie et autres spécialités médicales.",
//       deadline: new Date("2024-06-30").toISOString(),
//       conditions: "Être titulaire d'un baccalauréat série Sciences Biologiques avec une moyenne minimale de 13/20. Avoir moins de 25 ans.",
//       documents: ["Copie légalisée du diplôme du baccalauréat", "Certificat médical d'aptitude physique", "Extrait d'acte de naissance", "Quatre photos d'identité", "Reçu de paiement des frais d'inscription"]
//     },
//     "3": {
//       id: "3",
//       titre: "Bourses d'excellence Fulbright",
//       type: "Concours international",
//       institution: "Ambassade des USA",
//       description: "Programme de bourses d'excellence pour les études aux États-Unis. Le programme Fulbright est l'un des programmes d'échanges éducatifs les plus prestigieux au monde, offrant aux étudiants maliens la possibilité de poursuivre des études supérieures ou de mener des recherches dans des universités américaines de renom.",
//       deadline: new Date("2024-09-30").toISOString(),
//       conditions: "Être titulaire d'un diplôme de licence ou équivalent. Score TOEFL minimum de 550. Excellents résultats académiques.",
//       documents: ["CV détaillé", "Relevés de notes", "Lettres de recommandation", "Projet d'études", "Résultats du TOEFL", "Formulaire de candidature complété"]
//     },
//     "4": {
//       id: "4",
//       titre: "Concours de l'ENA",
//       type: "Concours national",
//       institution: "École Nationale d'Administration",
//       description: "Concours d'entrée à l'École Nationale d'Administration pour la formation des hauts cadres. L'ENA forme les futurs administrateurs civils, diplomates, inspecteurs des finances et autres hauts fonctionnaires de l'État malien. Le concours est organisé une fois par an et est ouvert aux titulaires de certains diplômes universitaires.",
//       deadline: new Date("2024-08-15").toISOString(),
//       conditions: "Être titulaire d'une maîtrise ou d'un master. Être fonctionnaire de l'État avec au moins deux ans d'expérience ou être âgé de moins de 35 ans pour les candidats externes.",
//       documents: ["Copie légalisée des diplômes", "Attestation de travail pour les fonctionnaires", "CV détaillé", "Lettre de motivation", "Extrait de casier judiciaire"]
//     }
//   };

//   // Either use the data from the database or the static data
//   const concoursData = concours || staticConcours[id || "1"];

//   return (
//     <div className="flex flex-col min-h-screen">
//       <Navbar />
//       <main className="flex-grow">
//         {/* Hero Section */}
//         <section className="bg-amame-blue text-white py-6 px-4">
//           <div className="container mx-auto">
//             <Link to="/concours" className="flex items-center text-white mb-4 hover:underline">
//               <ArrowLeft className="mr-2 h-5 w-5" />
//               Retour aux concours
//             </Link>
            
//             {isLoading ? (
//               <Skeleton className="h-12 w-3/4 bg-white/20" />
//             ) : error ? (
//               <h1 className="text-3xl md:text-4xl font-bold">Concours non trouvé</h1>
//             ) : (
//               <h1 className="text-3xl md:text-4xl font-bold">{concoursData?.titre}</h1>
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
//                 <p className="text-gray-500 mt-2">Impossible de charger les détails de ce concours.</p>
//                 <Button asChild className="mt-4">
//                   <Link to="/concours">Retour aux concours</Link>
//                 </Button>
//               </div>
//             ) : concoursData ? (
//               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                 {/* Main info card */}
//                 <Card className="lg:col-span-2">
//                   <CardHeader>
//                     <div className="flex justify-between items-start">
//                       <CardTitle>Informations générales</CardTitle>
//                       <Badge variant="outline" className="text-sm">
//                         {concoursData.type}
//                       </Badge>
//                     </div>
//                   </CardHeader>
//                   <CardContent className="space-y-6">
//                     <div>
//                       <h3 className="font-medium text-lg">Description</h3>
//                       <p className="mt-2 text-gray-700">{concoursData.description}</p>
//                     </div>
                    
//                     <div>
//                       <h3 className="font-medium text-lg">Institution</h3>
//                       <div className="flex items-center mt-2">
//                         <Building2 className="h-5 w-5 text-gray-500 mr-2" />
//                         <span>{concoursData.institution}</span>
//                       </div>
//                     </div>
                    
//                     {concoursData.conditions && (
//                       <div>
//                         <h3 className="font-medium text-lg">Conditions d'éligibilité</h3>
//                         <p className="mt-2 text-gray-700">{concoursData.conditions}</p>
//                       </div>
//                     )}
                    
//                     {concoursData.documents && concoursData.documents.length > 0 && (
//                       <div>
//                         <h3 className="font-medium text-lg">Documents requis</h3>
//                         <ul className="mt-2 space-y-1 list-disc list-inside text-gray-700">
//                           {concoursData.documents.map((doc, index) => (
//                             <li key={index}>{doc}</li>
//                           ))}
//                         </ul>
//                       </div>
//                     )}
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
//                         <Calendar className="h-4 w-4 mr-2" />
//                         Date limite d'inscription
//                       </h3>
//                       <p className="text-sm font-bold text-red-600">
//                         {concoursData.deadline ? new Date(concoursData.deadline).toLocaleDateString() : "Non spécifiée"}
//                       </p>
//                     </div>
                    
//                     <div className="border-t pt-4">
//                       <h3 className="font-medium mb-2 flex items-center">
//                         <FileText className="h-4 w-4 mr-2" />
//                         Type de concours
//                       </h3>
//                       <p className="text-sm text-gray-700">{concoursData.type}</p>
//                     </div>
                    
//                     <div className="border-t pt-4">
//                       <h3 className="font-medium mb-2 flex items-center">
//                         <Clock className="h-4 w-4 mr-2" />
//                         Temps restant
//                       </h3>
//                       <p className="text-sm font-medium">
//                         {concoursData.deadline ? (
//                           new Date(concoursData.deadline) > new Date() ? 
//                             `${Math.ceil((new Date(concoursData.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} jours` : 
//                             "Terminé"
//                         ) : "Non spécifié"}
//                       </p>
//                     </div>
                    
//                     <Button className="w-full mt-6">
//                       S'inscrire maintenant
//                     </Button>
                    
//                     <Button variant="outline" className="w-full">
//                       Télécharger les informations
//                     </Button>
//                   </CardContent>
//                 </Card>
//               </div>
//             ) : (
//               <div className="text-center py-12">
//                 <h2 className="text-2xl font-bold text-gray-700">Concours non trouvé</h2>
//                 <p className="text-gray-500 mt-2">Le concours que vous recherchez n'existe pas.</p>
//                 <Button asChild className="mt-4">
//                   <Link to="/concours">Retour aux concours</Link>
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

// export default ConcoursDetail;
