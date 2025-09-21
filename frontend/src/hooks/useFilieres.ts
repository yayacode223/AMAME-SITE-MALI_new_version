
// import { useQuery } from '@tanstack/react-query';

// export const useFilieres = () => {
//   return useQuery({
//     queryKey: ['filieres'],
//     queryFn: async () => {
//       const { data, error } = await 
//         .from('filieres')
//         .select('*');
      
//       if (error) {
//         console.error("Erreur lors de la récupération des filières:", error);
//         return { secondary: [], superior: [] };
//       }
      
//       // Split data into secondary and superior
//       const secondary = data.filter(f => f.niveau?.toLowerCase().includes('lycée') || 
//                                         f.niveau?.toLowerCase().includes('secondaire'));
//       const superior = data.filter(f => !secondary.includes(f));
      
//       return {
//         secondary,
//         superior
//       };
//     }
//   });
// };
