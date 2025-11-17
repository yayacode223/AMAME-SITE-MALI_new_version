// Bourses.tsx - VERSION FINALE CORRIGÉE
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BourseCardItem from '../components/BourseCardItem';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, MapPin, GraduationCap, SearchX, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGetBourses, useGetBourseByFilter, useGetBourseBySearch } from '@/service/bourseService';
import { BourseFilterParams, BourseSearchRequest} from '@/types/bourseType';

const Bourses = () => {
  // États locaux pour les filtres et la recherche
  const [filter, setFilter] = useState<BourseFilterParams>({});
  const [searchTerm, setSearchTerm] = useState<BourseSearchRequest>({});
  const [currentPage, setCurrentPage] = useState<number>(0);

  // Déterminer quels appels activer
  const hasSearch = Boolean(searchTerm.titre && searchTerm.titre.trim() !== '');
  const hasFilter = Boolean(filter.niveau || filter.pays);

  // Paramètres communs
  const commonParams = {
    page: currentPage, 
    size: 9, 
    sortBy: 'dateLimite', 
    sortDirection: 'DESC' 
  };

  // Appels API avec TOUS les paramètres dans les queryKeys
  const { data: bourses, isLoading: isBourseDataLoading } = useGetBourses(
    commonParams,
    { enabled: !hasSearch && !hasFilter }
  );

  const { data: filteredBySearchBourses, isLoading: isSearchLoading } = useGetBourseBySearch(
    {
      ...commonParams,
      titre: searchTerm.titre || undefined,
      description: undefined,
      pays: undefined,
    },
    { enabled: hasSearch }
  );

  const { data: filteredByFilterBourses, isLoading: isFilterLoading } = useGetBourseByFilter(
    {
      ...commonParams,
      categorie: undefined,
      niveau: filter.niveau || undefined,
      pays: filter.pays || undefined,
    },
    { enabled: hasFilter && !hasSearch }
  );

  // Déterminer quelle source de données utiliser
  const filteredBourses = useMemo(() => {
    if (hasSearch) {
      return filteredBySearchBourses || null;
    }
    if (hasFilter) {
      return filteredByFilterBourses || null;
    }
    return bourses || null;
  }, [
    bourses, 
    filteredBySearchBourses, 
    filteredByFilterBourses, 
    hasSearch, 
    hasFilter
  ]);

  // État de chargement combiné
  const isLoading = isBourseDataLoading || isSearchLoading || isFilterLoading;

  // Options pour les filtres
  const niveauOptions = [
    { value: "all", label: "Tous les niveaux" },
    { value: "licence", label: "Licence" },
    { value: "master", label: "Master" },
    { value: "doctorat", label: "Doctorat" },
  ];

  const paysOptions = [
    { value: "all", label: "Tous les pays" },
    { value: "France", label: "France" },
    { value: "Canada", label: "Canada" },
    { value: "États-Unis", label: "États-Unis" },
    { value: "Allemagne", label: "Allemagne" },
    { value: "Royaume-Uni", label: "Royaume-Uni" },
    { value: "Australie", label: "Australie" },
    { value: "Suisse", label: "Suisse" },
    { value: "Suède", label: "Suède" },
  ];

  // Handlers
  const handleSearchChange = (value: string) => {
    setSearchTerm({ 
      ...searchTerm, 
      titre: value 
    });
    setCurrentPage(0);
  };

  const handleNiveauChange = (value: string) => {
    setFilter({ 
      ...filter, 
      niveau: value === "all" ? undefined : value 
    });
    setCurrentPage(0);
  };

  const handlePaysChange = (value: string) => {
    setFilter({ 
      ...filter, 
      pays: value === "all" ? undefined : value 
    });
    setCurrentPage(0);
  };

  const resetFilters = () => {
    setFilter({});
    setSearchTerm({});
    setCurrentPage(0);
  };

  const getSelectValue = (value: string | undefined) => value || "all";

  // Navigation entre pages
  const handleNextPage = () => {
    if (filteredBourses?.hasNext) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 600, behavior: 'smooth' });
    }
  };

  const handlePreviousPage = () => {
    if (filteredBourses?.hasPrevious) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo({ top: 600, behavior: 'smooth' });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 600, behavior: 'smooth' });
  };

  // Générer les numéros de page à afficher
  const getPageNumbers = () => {
    if (!filteredBourses) return [];
    
    const totalPages = filteredBourses.totalPages;
    const current = filteredBourses.currentPage + 1;
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= current - delta && i <= current + delta)) {
        range.push(i);
      }
    }

    let prev = 0;
    for (const i of range) {
      if (i - prev > 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(i);
      prev = i;
    }

    return rangeWithDots;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-500 to-blue-500 text-white py-5 lg:py-10">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Trouvez Votre
              <span className="block text-yellow-300">Bourse Idéale</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8 leading-relaxed">
              Des milliers d'opportunités de bourses internationales vous attendent. 
              Filtrez par pays, niveau d'études et trouvez la bourse parfaite.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search & Filters Section */}
      <section className="py-8 lg:py-12 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 border border-gray-100"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Recherche */}
              <div className="lg:col-span-1">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                  <Search className="h-4 w-4 mr-2 text-purple-600" />
                  Rechercher une bourse
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Titre, description..."
                    value={searchTerm.titre || ''}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="h-12 pl-11 border-2 border-gray-200 focus:border-purple-500 rounded-xl"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                </div>
              </div>

              {/* Niveau Filter */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <GraduationCap className="h-4 w-4 mr-2 text-blue-600" />
                  Niveau d'études
                </label>
                <Select value={getSelectValue(filter.niveau)} onValueChange={handleNiveauChange}>
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-purple-500 rounded-xl">
                    <SelectValue placeholder="Tous les niveaux" />
                  </SelectTrigger>
                  <SelectContent>
                    {niveauOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pays Filter */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 mr-2 text-green-600" />
                  Pays
                </label>
                <Select value={getSelectValue(filter.pays)} onValueChange={handlePaysChange}>
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-purple-500 rounded-xl">
                    <SelectValue placeholder="Tous les pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {paysOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={resetFilters}
                className="border-2 border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl font-medium px-8"
              >
                <Filter className="mr-2 h-4 w-4" />
                Réinitialiser les filtres
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-8 lg:py-16 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                {[...Array(6)].map((_, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <div className="border-0 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                      <div className="p-6">
                        <Skeleton className="h-7 w-3/4 mb-3 rounded-lg" />
                        <Skeleton className="h-4 w-1/2 mb-4 rounded-lg" />
                        <div className="flex gap-2 mb-4">
                          <Skeleton className="h-6 w-20 rounded-full" />
                          <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-full mb-2 rounded-lg" />
                        <Skeleton className="h-4 w-2/3 mb-4 rounded-lg" />
                        <Skeleton className="h-20 w-full rounded-lg mb-4" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : !filteredBourses || filteredBourses.bourseSummaryDtos.length === 0 ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-12 lg:py-16"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 lg:w-24 lg:h-24 bg-purple-100 rounded-3xl mb-6">
                  <SearchX className="h-10 w-10 lg:h-12 lg:w-12 text-purple-600" />
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                  Aucune bourse trouvée
                </h3>
                <p className="text-gray-600 text-base lg:text-lg max-w-md mx-auto mb-8">
                  Aucune bourse ne correspond à vos critères de recherche. 
                  Essayez de modifier vos filtres.
                </p>
                <Button 
                  onClick={resetFilters}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl"
                >
                  Voir toutes les bourses
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="bourses-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 lg:mb-8">
                  <div className="mb-4 lg:mb-0">
                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                      Bourses Disponibles
                    </h2>
                    <p className="text-gray-600">
                      {filteredBourses.totalElements} bourse{filteredBourses.totalElements > 1 ? 's' : ''} 
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                  {filteredBourses.bourseSummaryDtos.map((bourse, index) => (
                    <motion.div
                      key={bourse.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ y: -4 }}
                    >
                      <BourseCardItem 
                        id={bourse.id}
                        titre={bourse.titre}
                        descriptionCourte={bourse.descriptionCourte}
                        bailleur={bourse.bailleur}
                        paysHote={bourse.paysHote}
                        niveau={bourse.niveau}
                        categorie={bourse.categorie}
                        financementStatut={bourse.financementStatut}
                        organisation={bourse.organisation}
                        dateLimite={bourse.dateLimite}
                      />
                    </motion.div>
                  ))}
                </div>

                {filteredBourses.totalPages > 1 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col items-center gap-4 mt-12"
                  >
                    <div className="text-sm text-gray-600 mb-4">
                      Page {filteredBourses.currentPage + 1} sur {filteredBourses.totalPages} • 
                      {filteredBourses.totalElements} résultat{filteredBourses.totalElements > 1 ? 's' : ''}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!filteredBourses.hasPrevious}
                        onClick={handlePreviousPage}
                        className="flex items-center gap-2 px-4"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Précédent
                      </Button>

                      <div className="flex items-center gap-1">
                        {getPageNumbers().map((page, index) => (
                          page === '...' ? (
                            <span key={`dots-${index}`} className="px-3 py-2 text-gray-500">
                              ...
                            </span>
                          ) : (
                            <Button
                              key={page}
                              variant={filteredBourses.currentPage + 1 === page ? "default" : "outline"}
                              size="sm"
                              className={`w-10 h-10 ${
                                filteredBourses.currentPage + 1 === page 
                                  ? 'bg-purple-600 text-white' 
                                  : 'hover:bg-gray-100'
                              }`}
                              onClick={() => handlePageChange(Number(page) - 1)}
                            >
                              {page}
                            </Button>
                          )
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!filteredBourses.hasNext}
                        onClick={handleNextPage}
                        className="flex items-center gap-2 px-4"
                      >
                        Suivant
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Bourses;