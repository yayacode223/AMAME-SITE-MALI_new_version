import { useState, useMemo } from 'react';
import { useGetBourses, useGetBourseByFilter, useGetBourseBySearch } from "@/service/bourseService";
import { BourseDefaultSearchParams, BourseSearchRequest, BourseFilterParams} from "@/types/bourseType";

export const useBourses = () => {
  const [filter, setFilter] = useState<BourseFilterParams>({});
  const [searchTerm, setSearchTerm] = useState<BourseSearchRequest>({});

  const { data: bourses, isLoading: isBourseDataLoading } = useGetBourses({} as BourseDefaultSearchParams);

  const { 
    data: filteredBySearchBourses, 
    isLoading: isSearchLoading 
  } = useGetBourseBySearch({
    titre: searchTerm.titre,
    description: searchTerm.description,
    pays: searchTerm.pays,
  }, {
    enabled: Boolean(searchTerm.titre || searchTerm.description || searchTerm.pays) // Active seulement si recherche
  });

  const { 
    data: filteredByFilterBourses, 
    isLoading: isFilterLoading 
  } = useGetBourseByFilter({
    categorie: filter.categorie,
    niveau: filter.niveau,
    pays: filter.pays,
  }, {
    enabled: Boolean(filter.categorie || filter.niveau || filter.pays) // Active seulement si filtre
  });

  const filteredBourses = useMemo(() => {
    // Priorité 1: Résultats de recherche
    if (searchTerm.titre || searchTerm.description || searchTerm.pays) {
      return filteredBySearchBourses || null;
    }
    
    if (filter.categorie || filter.niveau || filter.pays) {
      return filteredByFilterBourses || null;
    }
    
    return bourses || null;
    
  }, [bourses, filteredBySearchBourses, filteredByFilterBourses, searchTerm, filter]);

  const isLoading = isBourseDataLoading || isSearchLoading || isFilterLoading;

  const resetFilters = () => {
    setFilter({});
    setSearchTerm({});
  };

  const resetSearch = () => {
    setSearchTerm({});
  };
  
  const resetFilter = () => {
    setFilter({});
  };

  return {
    isLoading,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    filteredBourses,
    resetFilters,
    resetSearch,
    resetFilter
  };
};