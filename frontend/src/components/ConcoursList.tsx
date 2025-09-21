
// import React, { useState } from 'react';
// import { useQuery } from '@tanstack/react-query';
// import { useNavigate } from 'react-router-dom';
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Skeleton } from "@/components/ui/skeleton";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

// interface Concours {
//   id: string;
//   titre: string;
//   type: string;
//   institution: string;
//   description: string;
//   deadline: string;
// }

// const ConcoursList = () => {
//   const navigate = useNavigate();
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filter, setFilter] = useState('all');
  
//   // Fetch concours data from Supabase
//   const { data: concours, isLoading } = useQuery({
//     queryKey: ['concours'],
//     queryFn: async () => {
//       try {
//         const { data, error } = await supabase
//           .from('concours')
//           .select('*')
//           .order('created_at', { ascending: false });
        
//         if (error) {
//           console.error("Error fetching concours:", error);
//           return [];
//         }
        
//         return data || [];
//       } catch (error) {
//         console.error("Error fetching concours:", error);
//         return [];
//       }
//     }
//   });

//   // Backup data for display when no DB data is available
//   const staticConcours: Concours[] = [
//     {
//       id: "1",
//       titre: "Concours d'entrée à l'École Nationale d'Ingénieurs",
//       type: "Concours national",
//       institution: "ENI-ABT",
//       description: "Concours annuel d'entrée à l'École Nationale d'Ingénieurs Abderhamane Baba Touré.",
//       deadline: new Date("2024-07-15").toISOString()
//     },
//     {
//       id: "2",
//       titre: "Concours d'entrée à la Faculté de Médecine",
//       type: "Concours national",
//       institution: "FMOS",
//       description: "Concours d'entrée à la Faculté de Médecine et d'Odonto-Stomatologie de Bamako.",
//       deadline: new Date("2024-06-30").toISOString()
//     },
//     {
//       id: "3",
//       titre: "Bourses d'excellence Fulbright",
//       type: "Concours international",
//       institution: "Ambassade des USA",
//       description: "Programme de bourses d'excellence pour les études aux États-Unis.",
//       deadline: new Date("2024-09-30").toISOString()
//     },
//     {
//       id: "4",
//       titre: "Concours de l'ENA",
//       type: "Concours national",
//       institution: "École Nationale d'Administration",
//       description: "Concours d'entrée à l'École Nationale d'Administration pour la formation des hauts cadres.",
//       deadline: new Date("2024-08-15").toISOString()
//     }
//   ];

//   // Function to filter concours based on search term and filter
//   const filterConcours = () => {
//     const dataToUse = concours && concours.length > 0 ? concours : staticConcours;
    
//     return dataToUse.filter(item => {
//       const matchesSearch = item.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                           (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
//       const matchesFilter = filter === 'all' || item.type === filter;
//       return matchesSearch && matchesFilter;
//     });
//   };

//   const handleViewDetails = (id: string) => {
//     navigate(`/concours/${id}`);
//   };

//   const filteredConcours = filterConcours();

//   if (isLoading) {
//     return (
//       <div className="space-y-4">
//         <div className="flex justify-between items-center">
//           <Skeleton className="h-10 w-1/3" />
//           <Skeleton className="h-10 w-1/4" />
//         </div>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           {[...Array(4)].map((_, index) => (
//             <div key={index} className="border rounded-lg p-4 space-y-2">
//               <Skeleton className="h-6 w-3/4" />
//               <Skeleton className="h-4 w-1/4" />
//               <Skeleton className="h-4 w-full" />
//               <Skeleton className="h-10 w-1/3" />
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div>
//       <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
//         <Input
//           type="search"
//           placeholder="Rechercher un concours..."
//           className="max-w-sm"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
        
//         <Select value={filter} onValueChange={setFilter}>
//           <SelectTrigger className="w-[180px]">
//             <SelectValue placeholder="Filtrer par type" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="all">Tous les types</SelectItem>
//             <SelectItem value="Concours national">Concours nationaux</SelectItem>
//             <SelectItem value="Concours international">Concours internationaux</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {filteredConcours.map((item) => (
//           <div key={item.id} className="border rounded-lg p-6 bg-white shadow-sm">
//             <h3 className="text-lg font-semibold mb-2">{item.titre}</h3>
//             <p className="text-sm text-gray-500 mb-1">{item.institution}</p>
//             <p className="text-sm text-gray-500 mb-3">
//               <span className="inline-block px-2 py-1 rounded-full bg-gray-100 text-xs">
//                 {item.type || "Concours"}
//               </span>
//             </p>
//             <p className="text-gray-600 mb-4 line-clamp-2">{item.description}</p>
            
//             <div className="flex justify-between items-center">
//               <div>
//                 <p className="text-sm font-medium">Date limite:</p>
//                 <p className="text-sm text-red-600">
//                   {item.deadline ? new Date(item.deadline).toLocaleDateString() : "Non spécifiée"}
//                 </p>
//               </div>
//               <Button onClick={() => handleViewDetails(item.id)}>
//                 Voir les détails
//               </Button>
//             </div>
//           </div>
//         ))}

//         {filteredConcours.length === 0 && (
//           <div className="col-span-2 text-center py-8">
//             <p className="text-gray-500">Aucun concours ne correspond à votre recherche.</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ConcoursList;
