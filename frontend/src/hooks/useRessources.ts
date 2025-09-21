
// import { useState } from 'react';
// import { useQuery } from '@tanstack/react-query';

// interface Resource {
//   id?: string;
//   titre: string;
//   title?: string;
//   // type: string;
//   description: string;
//   file_size?: string;
//   fileSize?: string;
//   category?: string;
//   created_at?: string;
// }

// // Static backup data in case the API fails
// const staticResources: Resource[] = [
//   {
//     titre: "Guide de préparation au concours d'entrée à l'ENI",
//     title: "Guide de préparation au concours d'entrée à l'ENI",
//     type: "Guide",
//     description: "Un guide complet pour vous aider à préparer le concours d'entrée à l'École Nationale d'Ingénieurs.",
//     fileSize: "2.5 MB",
//     category: "concours"
//   },
//   {
//     titre: "Modèle de lettre de motivation - Bourses d'études",
//     title: "Modèle de lettre de motivation - Bourses d'études",
//     type: "Document",
//     description: "Template de lettre de motivation pour les candidatures aux bourses d'études internationales.",
//     fileSize: "500 KB",
//     category: "bourses"
//   },
//   {
//     titre: "Programme détaillé - Série Sciences",
//     title: "Programme détaillé - Série Sciences",
//     type: "PDF",
//     description: "Programme complet des matières pour la série Sciences au lycée.",
//     fileSize: "1.8 MB",
//     category: "filieres"
//   },
//   {
//     titre: "Formulaire d'inscription aux concours nationaux",
//     title: "Formulaire d'inscription aux concours nationaux",
//     type: "Formulaire",
//     description: "Formulaire officiel pour l'inscription aux concours nationaux.",
//     fileSize: "750 KB",
//     category: "concours"
//   }
// ];

// export interface Category {
//   id: string;
//   label: string;
// }

// export const useRessources = () => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState('all');

//   const { data: ressources, isLoading } = useQuery({
//     queryKey: ['ressources'],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from('ressources')
//         .select('*')
//         .order('created_at', { ascending: false });
      
//       if (error) {
//         console.error("Erreur lors de la récupération des ressources:", error);
//         return [];
//       }
      
//       return data || [];
//     }
//   });

//   // Get categories from data
//   const getCategories = (): Category[] => {
//     if (ressources && ressources.length > 0) {
//       const uniqueCategories = Array.from(
//         new Set(
//           ressources
//             .map(r => r.category as string)
//             .filter(Boolean)
//         )
//       );
      
//       return [
//         { id: 'all', label: 'Tous les documents' },
//         ...uniqueCategories.map(cat => ({ 
//           id: cat as string, 
//           label: (cat as string).charAt(0).toUpperCase() + (cat as string).slice(1) 
//         }))
//       ];
//     }
    
//     return [
//       { id: 'all', label: 'Tous les documents' },
//       { id: 'concours', label: 'Concours' },
//       { id: 'bourses', label: 'Bourses' },
//       { id: 'filieres', label: 'Filières' }
//     ];
//   };

//   const categories = getCategories();

//   const filteredResources = isLoading ? [] : (ressources && ressources.length > 0 ? ressources : staticResources)
//     .filter(resource => {
//       const title = resource.titre || resource.title || '';
//       const description = resource.description || '';
//       const category = resource.category || '';
      
//       const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                            description.toLowerCase().includes(searchTerm.toLowerCase());
//       const matchesCategory = selectedCategory === 'all' || category === selectedCategory;
//       return matchesSearch && matchesCategory;
//     });

//   return {
//     searchTerm,
//     setSearchTerm,
//     selectedCategory,
//     setSelectedCategory,
//     categories,
//     filteredResources,
//     isLoading
//   };
// };

// export type { Resource };
