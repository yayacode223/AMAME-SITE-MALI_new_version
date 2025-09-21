import { useState } from 'react';
import {useGetBourses} from "@/service/bourseService"; 

// Static fallback data
// const staticBourses = [
//   {
//     title: "Bourse d'Excellence Campus France",
//     provider: "Gouvernement Français",
//     country: "France",
//     level: "Master - Doctorat",
//     deadline: "31 Mars 2025",
//     description: "Le programme de Bourses d'Excellence offre une opportunité aux étudiants maliens d'excellence de poursuivre leurs études supérieures en France.",
//     benefits: ["Frais de scolarité", "Allocation mensuelle", "Billet d'avion", "Couverture sociale"]
//   },
//   {
//     title: "Programme de Bourses de la Banque Mondiale",
//     provider: "Banque Mondiale",
//     country: "International",
//     level: "Master - Doctorat",
//     deadline: "15 Décembre 2024",
//     description: "Ces bourses sont destinées aux professionnels et étudiants des pays en développement souhaitant acquérir des compétences avancées en développement économique.",
//     benefits: ["Frais de scolarité", "Allocation mensuelle", "Frais de voyage", "Assurance maladie", "Matériel d'études"]
//   },
//   {
//     title: "Bourse Nationale du Mali",
//     provider: "Ministère de l'Enseignement Supérieur",
//     country: "Mali",
//     level: "Licence - Master",
//     deadline: "30 Septembre 2024",
//     description: "Bourse offerte par le gouvernement malien aux meilleurs étudiants pour poursuivre leurs études supérieures dans les universités maliennes.",
//     benefits: ["Allocation mensuelle", "Accès aux résidences universitaires", "Réduction des frais de scolarité"]
//   },
//   {
//     title: "Bourse de la Francophonie",
//     provider: "Agence Universitaire de la Francophonie",
//     country: "Pays Francophones",
//     level: "Master - Doctorat",
//     deadline: "28 Février 2025",
//     description: "Programme de bourses destiné aux étudiants des pays membres de la Francophonie pour des études dans un autre pays francophone.",
//     benefits: ["Allocation mensuelle", "Frais de déplacement", "Assurance maladie"]
//   },
//   {
//     title: "Bourses d'études du Canada",
//     provider: "Gouvernement Canadien",
//     country: "Canada",
//     level: "Licence - Master - Doctorat",
//     deadline: "15 Février 2025",
//     description: "Programme de bourses offert par le gouvernement canadien pour des études universitaires au Canada dans divers domaines.",
//     benefits: ["Frais de scolarité", "Allocation mensuelle", "Billet d'avion", "Assurance maladie"]
//   },
//   {
//     title: "Bourse Chevening",
//     provider: "Gouvernement Britannique",
//     country: "Royaume-Uni",
//     level: "Master",
//     deadline: "1 Novembre 2024",
//     description: "Programme international prestigieux qui offre aux futurs leaders l'opportunité de suivre des études de master au Royaume-Uni.",
//     benefits: ["Frais de scolarité", "Allocation mensuelle", "Billets d'avion", "Autres allocations"]
//   }
// ];

// export interface Bourse {
//   id?: string;
//   titre?: string;
//   title?: string;
//   provider: string;
//   country: string;
//   level: string;
//   deadline: string;
//   description: string;
//   benefits?: string[];
// }

export const useBourses = () => {
  const [filter, setFilter] = useState("Tous");
  const [searchTerm, setSearchTerm] = useState("");

//   const { data: bourses, isLoading } = useQuery({
//     queryKey: ['bourses'],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from('bourses')
//         .select('*');
      
//       if (error) {
//         console.error("Erreur lors de la récupération des bourses:", error);
//         return [];
//       }
      
//       return data || [];
//     }
//   });

const {data: bourses, isLoading: isBourseDataLoading} = useGetBourses(); 

  const filteredBourses = isBourseDataLoading ? [] : (bourses && bourses.length > 0 ? bourses : [])
    .filter(bourse => {
      const matchesFilter = filter === "Tous" || bourse.titre?.includes(filter);
      const matchesSearch = 
        bourse.titre?.toLowerCase().includes(searchTerm.toLowerCase()) 
        // ||
        // bourses.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // bourses.provider?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // bourses.country?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });

  return {
    bourses,
    isBourseDataLoading,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    filteredBourses
  };
};
