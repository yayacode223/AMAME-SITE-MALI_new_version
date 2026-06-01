import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import ConcoursCardItem from "../components/ConcoursCardItem";
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
  Trophy,
  GraduationCap,
  Target,
  SearchX,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import {
  useConcoursLists,
  useConcoursFilter,
  useConcoursSearch,
} from "@/service/concoursService";
import { ConcoursFilterParams, NiveauType, StatusType } from "@/types/concoursType";

const niveauOptions = [
  { value: "all", label: "Tous les niveaux" },
  { value: "BACHELIER", label: "Bachelier" },
  { value: "LICENCE", label: "Licence" },
  { value: "MASTER", label: "Master" },
  { value: "DOCTORAT", label: "Doctorat" },
];

const statusOptions = [
  { value: "all", label: "Tous les types" },
  { value: "NATIONAL", label: "National" },
  { value: "INTERNATIONAL", label: "International" },
];

const CardSkeleton = () => (
  <div className="bg-white rounded-xl border border-amame-border shadow-card overflow-hidden">
    <div className="h-1 bg-gray-100" />
    <div className="p-5 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <Skeleton className="h-5 w-3/4 rounded-md" />
      <Skeleton className="h-4 w-full rounded-md" />
      <Skeleton className="h-4 w-2/3 rounded-md" />
      <div className="space-y-1.5 pt-2">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-3.5 w-1/2 rounded-md" />)}
      </div>
      <Skeleton className="h-9 w-full rounded-lg mt-2" />
    </div>
  </div>
);

const Concours = () => {
  const [filter, setFilter] = useState<ConcoursFilterParams>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  const hasSearch = Boolean(searchTerm.trim());
  const hasNiveauFilter = Boolean(filter.niveau);
  const hasStatusFilter = Boolean(filter.status);

  const commonParams = { page: currentPage, size: 9, sortBy: "dateLimite", sortDirection: "ASC" };

  const { data: concours, isLoading: isConcoursLoading } = useConcoursLists(commonParams, { enabled: !hasSearch && !hasNiveauFilter && !hasStatusFilter });
  const { data: concoursByFilter, isLoading: isConcoursByFilterLoading } = useConcoursFilter({ ...commonParams, ...filter }, { enabled: (hasStatusFilter || hasNiveauFilter) && !hasSearch });
  const { data: searchedConcours, isLoading: isSearchLoading } = useConcoursSearch({ ...commonParams, search: searchTerm }, { enabled: hasSearch });

  const filteredConcours = useMemo(() => {
    if (hasSearch) return searchedConcours || null;
    if (hasNiveauFilter || hasStatusFilter) return concoursByFilter || null;
    return concours || null;
  }, [concours, concoursByFilter, searchedConcours, hasSearch, hasNiveauFilter, hasStatusFilter]);

  const isLoading = isConcoursLoading || isConcoursByFilterLoading || isSearchLoading;
  const hasActiveFilters = hasSearch || hasNiveauFilter || hasStatusFilter;

  const resetFilters = () => { setFilter({}); setSearchTerm(""); setCurrentPage(0); };
  const handleNextPage = () => { if (filteredConcours?.hasNext) { setCurrentPage(p => p + 1); window.scrollTo({ top: 400, behavior: "smooth" }); } };
  const handlePreviousPage = () => { if (filteredConcours?.hasPrevious) { setCurrentPage(p => p - 1); window.scrollTo({ top: 400, behavior: "smooth" }); } };
  const handlePageChange = (page: number) => { setCurrentPage(page); window.scrollTo({ top: 400, behavior: "smooth" }); };

  const getPageNumbers = () => {
    if (!filteredConcours) return [];
    const total = filteredConcours.totalPages;
    const current = filteredConcours.currentPage + 1;
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

  return (
    <div className="min-h-screen bg-amame-surface flex flex-col">
      <SEO
        title="Concours"
        description="Découvrez les concours nationaux et internationaux ouverts aux étudiants maliens. Filtrez par niveau, type et dates pour trouver le concours idéal."
        path="/concours"
        keywords="concours Mali, concours nationaux, concours internationaux, étudiants Mali"
      />
      <Navbar />

      <PageHero
        icon={Trophy}
        label="Compétitions"
        title="Découvrez vos"
        titleHighlight="concours idéaux"
        description="" //Des centaines de concours nationaux et internationaux vous attendent. Filtrez par niveau et type pour trouver l'opportunité parfaite.
        imageSrc="/images/heroes/hero-concours.png"
        imageAlt="Podium académique — étudiants maliens en compétition"
      />

      {/* Filters */}
      <section className="bg-white border-b border-amame-border py-5 lg:py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amame-muted pointer-events-none" />
              <Input
                type="text"
                placeholder="Rechercher un concours..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
                className="pl-10 h-11 border-amame-border focus:border-amame-green focus:ring-amame-green/20 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 min-w-[160px]">
              <GraduationCap className="h-4 w-4 text-amame-muted shrink-0" />
              <Select
                value={filter.niveau || "all"}
                onValueChange={(v) => { setFilter(f => v === "all" ? (({ niveau, ...rest }) => rest)(f) : { ...f, niveau: v as NiveauType }); setCurrentPage(0); }}
              >
                <SelectTrigger className="h-11 border-amame-border focus:border-amame-green rounded-xl flex-1">
                  <SelectValue placeholder="Niveau" />
                </SelectTrigger>
                <SelectContent>
                  {niveauOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 min-w-[160px]">
              <Target className="h-4 w-4 text-amame-muted shrink-0" />
              <Select
                value={filter.status || "all"}
                onValueChange={(v) => { setFilter(f => v === "all" ? (({ status, ...rest }) => rest)(f) : { ...f, status: v as StatusType }); setCurrentPage(0); }}
              >
                <SelectTrigger className="h-11 border-amame-border focus:border-amame-green rounded-xl flex-1">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
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
            ) : !filteredConcours || filteredConcours.concours.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-5">
                  <SearchX className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="font-nunito font-bold text-xl text-amame-charcoal mb-2">Aucun concours trouvé</h3>
                <p className="text-amame-muted text-sm max-w-md mx-auto mb-6">
                  {hasActiveFilters ? "Aucun concours ne correspond à vos critères. Essayez de modifier les filtres." : "Aucun concours n'est disponible pour le moment. Revenez plus tard."}
                </p>
                {hasActiveFilters && (
                  <Button onClick={resetFilters} className="bg-amame-green hover:bg-amame-green-dark text-white font-semibold rounded-xl">
                    Voir tous les concours
                  </Button>
                )}
              </motion.div>
            ) : (
              <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-nunito font-bold text-lg text-amame-charcoal">Concours disponibles</h2>
                    <p className="text-sm text-amame-muted">{filteredConcours.totalElements} résultat{filteredConcours.totalElements > 1 ? "s" : ""}</p>
                  </div>
                  {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2">
                      {filter.niveau && <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-medium">{niveauOptions.find(o => o.value === filter.niveau)?.label}</span>}
                      {filter.status && <span className="text-xs bg-amame-green-light text-amame-green-dark border border-amame-green/20 px-2.5 py-1 rounded-full font-medium">{statusOptions.find(o => o.value === filter.status)?.label}</span>}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                  {filteredConcours.concours.map((item, index) => (
                    <motion.div key={item.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.06 }}>
                      <ConcoursCardItem {...item} />
                    </motion.div>
                  ))}
                </div>

                {filteredConcours.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <Button variant="outline" size="sm" disabled={!filteredConcours.hasPrevious} onClick={handlePreviousPage} className="rounded-lg border-amame-border gap-1">
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
                            variant={filteredConcours.currentPage + 1 === page ? "default" : "outline"}
                            size="sm"
                            className={`w-9 h-9 p-0 rounded-lg text-sm ${filteredConcours.currentPage + 1 === page ? "bg-amame-green hover:bg-amame-green-dark text-white" : "border-amame-border hover:bg-gray-50"}`}
                            onClick={() => handlePageChange(Number(page) - 1)}
                          >
                            {page}
                          </Button>
                        )
                      )}
                    </div>
                    <Button variant="outline" size="sm" disabled={!filteredConcours.hasNext} onClick={handleNextPage} className="rounded-lg border-amame-border gap-1">
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

export default Concours;
