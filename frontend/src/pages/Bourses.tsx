import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import BourseCardItem from "../components/BourseCardItem";
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
import {
  Search,
  Award,
  MapPin,
  GraduationCap,
  SearchX,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import {
  useGetBourses,
  useGetBourseByFilter,
  useGetBourseBySearch,
} from "@/service/bourseService";
import { BourseFilterParams, BourseSearchRequest } from "@/types/bourseType";

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

const CardSkeleton = () => (
  <div className="bg-white rounded-xl border border-amame-border shadow-card overflow-hidden">
    <div className="h-1 bg-gray-100" />
    <div className="p-5 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-5 w-3/4 rounded-md" />
      <Skeleton className="h-4 w-full rounded-md" />
      <Skeleton className="h-4 w-2/3 rounded-md" />
      <div className="space-y-1.5 pt-2">
        <Skeleton className="h-3.5 w-1/2 rounded-md" />
        <Skeleton className="h-3.5 w-2/5 rounded-md" />
        <Skeleton className="h-3.5 w-1/3 rounded-md" />
      </div>
      <Skeleton className="h-9 w-full rounded-lg mt-2" />
    </div>
  </div>
);

const Bourses = () => {
  const [filter, setFilter] = useState<BourseFilterParams>({});
  const [searchTerm, setSearchTerm] = useState<BourseSearchRequest>({});
  const [currentPage, setCurrentPage] = useState(0);

  const hasSearch = Boolean(searchTerm.titre?.trim());
  const hasFilter = Boolean(filter.niveau || filter.pays);

  const commonParams = { page: currentPage, size: 9, sortBy: "dateLimite", sortDirection: "DESC" };

  const { data: bourses, isLoading: isBourseDataLoading } = useGetBourses(commonParams, { enabled: !hasSearch && !hasFilter });
  const { data: filteredBySearchBourses, isLoading: isSearchLoading } = useGetBourseBySearch(
    { ...commonParams, titre: searchTerm.titre || undefined, description: undefined, pays: undefined },
    { enabled: hasSearch },
  );
  const { data: filteredByFilterBourses, isLoading: isFilterLoading } = useGetBourseByFilter(
    { ...commonParams, categorie: undefined, niveau: filter.niveau || undefined, pays: filter.pays || undefined },
    { enabled: hasFilter && !hasSearch },
  );

  const filteredBourses = useMemo(() => {
    if (hasSearch) return filteredBySearchBourses || null;
    if (hasFilter) return filteredByFilterBourses || null;
    return bourses || null;
  }, [bourses, filteredBySearchBourses, filteredByFilterBourses, hasSearch, hasFilter]);

  const isLoading = isBourseDataLoading || isSearchLoading || isFilterLoading;

  const resetFilters = () => { setFilter({}); setSearchTerm({}); setCurrentPage(0); };
  const handleNextPage = () => { if (filteredBourses?.hasNext) { setCurrentPage(p => p + 1); window.scrollTo({ top: 400, behavior: "smooth" }); } };
  const handlePreviousPage = () => { if (filteredBourses?.hasPrevious) { setCurrentPage(p => p - 1); window.scrollTo({ top: 400, behavior: "smooth" }); } };
  const handlePageChange = (page: number) => { setCurrentPage(page); window.scrollTo({ top: 400, behavior: "smooth" }); };

  const getPageNumbers = () => {
    if (!filteredBourses) return [];
    const total = filteredBourses.totalPages;
    const current = filteredBourses.currentPage + 1;
    const delta = 2;
    const range: (number | string)[] = [];
    let prev = 0;
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
        if (i - prev > 1) range.push("...");
        range.push(i);
        prev = i;
      }
    }
    return range;
  };

  const hasActiveFilters = hasSearch || hasFilter;

  return (
    <div className="min-h-screen bg-amame-surface flex flex-col">
      <SEO
        title="Bourses d'études"
        description="Trouvez votre bourse idéale parmi des centaines d'opportunités nationales et internationales pour étudiants maliens. Filtrez par pays, niveau et type de financement."
        path="/bourses"
        keywords="bourses études Mali, bourses internationales, financement études, étudiants maliens"
      />
      <Navbar />

      <PageHero
        icon={Award}
        label="Opportunités"
        title="Trouvez votre"
        titleHighlight="bourse idéale"
        description="" //Des centaines d'opportunités de bourses nationales et internationales. Filtrez par pays et niveau d'études pour trouver celle qui vous correspond.
        imageSrc="/images/heroes/hero-bourses.png"
        imageAlt="Étudiante malienne avec bourse d'études"
      />

      {/* Search & Filters */}
      <section className="bg-white border-b border-amame-border py-5 lg:py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
          >
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amame-muted pointer-events-none" />
              <Input
                type="text"
                placeholder="Rechercher une bourse..."
                value={searchTerm.titre || ""}
                onChange={(e) => { setSearchTerm({ titre: e.target.value }); setCurrentPage(0); }}
                className="pl-10 h-11 border-amame-border focus:border-amame-green focus:ring-amame-green/20 rounded-xl"
              />
            </div>

            {/* Niveau */}
            <div className="flex items-center gap-2 min-w-[160px]">
              <GraduationCap className="h-4 w-4 text-amame-muted shrink-0" />
              <Select value={filter.niveau || "all"} onValueChange={(v) => { setFilter(f => ({ ...f, niveau: v === "all" ? undefined : v })); setCurrentPage(0); }}>
                <SelectTrigger className="h-11 border-amame-border focus:border-amame-green rounded-xl flex-1">
                  <SelectValue placeholder="Niveau" />
                </SelectTrigger>
                <SelectContent>
                  {niveauOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Pays */}
            <div className="flex items-center gap-2 min-w-[160px]">
              <MapPin className="h-4 w-4 text-amame-muted shrink-0" />
              <Select value={filter.pays || "all"} onValueChange={(v) => { setFilter(f => ({ ...f, pays: v === "all" ? undefined : v })); setCurrentPage(0); }}>
                <SelectTrigger className="h-11 border-amame-border focus:border-amame-green rounded-xl flex-1">
                  <SelectValue placeholder="Pays" />
                </SelectTrigger>
                <SelectContent>
                  {paysOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" onClick={resetFilters} className="h-11 text-amame-muted hover:text-amame-charcoal hover:bg-gray-100 rounded-xl gap-2 shrink-0">
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Réinitialiser</span>
              </Button>
            )}
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="flex-grow py-8 lg:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
              </motion.div>
            ) : !filteredBourses || filteredBourses.bourseSummaryDtos.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amame-green-subtle rounded-2xl mb-5">
                  <SearchX className="h-8 w-8 text-amame-green" />
                </div>
                <h3 className="font-nunito font-bold text-xl text-amame-charcoal mb-2">Aucune bourse trouvée</h3>
                <p className="text-amame-muted text-sm max-w-md mx-auto mb-6">
                  Aucune bourse ne correspond à vos critères. Essayez de modifier les filtres.
                </p>
                <Button onClick={resetFilters} className="bg-amame-green hover:bg-amame-green-dark text-white font-semibold rounded-xl">
                  Voir toutes les bourses
                </Button>
              </motion.div>
            ) : (
              <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-nunito font-bold text-lg text-amame-charcoal">Bourses disponibles</h2>
                    <p className="text-sm text-amame-muted">{filteredBourses.totalElements} résultat{filteredBourses.totalElements > 1 ? "s" : ""}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                  {filteredBourses.bourseSummaryDtos.map((bourse, index) => (
                    <motion.div key={bourse.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.06 }}>
                      <BourseCardItem {...bourse} />
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {filteredBourses.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <Button variant="outline" size="sm" disabled={!filteredBourses.hasPrevious} onClick={handlePreviousPage} className="rounded-lg border-amame-border gap-1">
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Précédent</span>
                    </Button>

                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((page, i) =>
                        page === "..." ? (
                          <span key={`d-${i}`} className="px-2 text-amame-muted text-sm">…</span>
                        ) : (
                          <Button
                            key={page}
                            variant={filteredBourses.currentPage + 1 === page ? "default" : "outline"}
                            size="sm"
                            className={`w-9 h-9 p-0 rounded-lg text-sm ${filteredBourses.currentPage + 1 === page ? "bg-amame-green hover:bg-amame-green-dark text-white" : "border-amame-border hover:bg-gray-50"}`}
                            onClick={() => handlePageChange(Number(page) - 1)}
                          >
                            {page}
                          </Button>
                        )
                      )}
                    </div>

                    <Button variant="outline" size="sm" disabled={!filteredBourses.hasNext} onClick={handleNextPage} className="rounded-lg border-amame-border gap-1">
                      <span className="hidden sm:inline">Suivant</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
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
