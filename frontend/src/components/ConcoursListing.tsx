import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ConcoursCardItem from "./ConcoursCardItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, GraduationCap, SearchX, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useConcoursLists, useConcoursFilter, useConcoursSearch } from "@/service/concoursService";
import { ConcoursFilterParams, NiveauType, StatusType } from "@/types/concoursType";

const NIVEAU_OPTIONS = [
  { value: "all", label: "Tous les niveaux" },
  { value: "BACHELIER", label: "Bachelier" },
  { value: "LICENCE", label: "Licence" },
  { value: "MASTER", label: "Master" },
  { value: "DOCTORAT", label: "Doctorat" },
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
      <div className="space-y-1.5 pt-2">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-3.5 w-1/2 rounded-md" />)}
      </div>
      <Skeleton className="h-9 w-full rounded-lg mt-2" />
    </div>
  </div>
);

interface ConcoursListingProps {
  defaultStatus?: "NATIONAL" | "INTERNATIONAL";
}

const ConcoursListing = ({ defaultStatus }: ConcoursListingProps) => {
  const [filter, setFilter] = useState<ConcoursFilterParams>(
    defaultStatus ? { status: defaultStatus as StatusType } : {}
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  const hasSearch = Boolean(searchTerm.trim());
  const hasNiveau = Boolean(filter.niveau);
  const hasStatus = Boolean(filter.status);

  const commonParams = { page: currentPage, size: 9, sortBy: "dateLimite", sortDirection: "ASC" };

  const { data: allConcours, isLoading: isAllLoading } = useConcoursLists(commonParams, {
    enabled: !hasSearch && !hasNiveau && !hasStatus,
  });
  const { data: filtered, isLoading: isFilterLoading } = useConcoursFilter(
    { ...commonParams, ...filter },
    { enabled: (hasNiveau || hasStatus) && !hasSearch }
  );
  const { data: searched, isLoading: isSearchLoading } = useConcoursSearch(
    { ...commonParams, search: searchTerm },
    { enabled: hasSearch }
  );

  const data = useMemo(() => {
    if (hasSearch) return searched ?? null;
    if (hasNiveau || hasStatus) return filtered ?? null;
    return allConcours ?? null;
  }, [allConcours, filtered, searched, hasSearch, hasNiveau, hasStatus]);

  const isLoading = isAllLoading || isFilterLoading || isSearchLoading;
  const hasUserFilters = hasSearch || hasNiveau;

  const resetFilters = () => {
    setFilter(defaultStatus ? { status: defaultStatus as StatusType } : {});
    setSearchTerm("");
    setCurrentPage(0);
  };

  const handleNext = () => { if (data?.hasNext) { setCurrentPage(p => p + 1); window.scrollTo({ top: 400, behavior: "smooth" }); } };
  const handlePrev = () => { if (data?.hasPrevious) { setCurrentPage(p => p - 1); window.scrollTo({ top: 400, behavior: "smooth" }); } };
  const handlePage = (page: number) => { setCurrentPage(page); window.scrollTo({ top: 400, behavior: "smooth" }); };

  const pageNumbers = () => {
    if (!data) return [];
    const total = data.totalPages;
    const current = data.currentPage + 1;
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
    <>
      {/* Filtres */}
      <section className="bg-white border-b border-amame-border py-5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amame-muted pointer-events-none" />
              <Input
                type="text"
                placeholder="Rechercher un concours..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
                className="pl-10 h-11 border-amame-border focus:border-amame-green rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 min-w-[160px]">
              <GraduationCap className="h-4 w-4 text-amame-muted shrink-0" />
              <Select
                value={filter.niveau || "all"}
                onValueChange={(v) => {
                  setFilter(f => v === "all"
                    ? (({ niveau, ...rest }) => rest)(f)
                    : { ...f, niveau: v as NiveauType }
                  );
                  setCurrentPage(0);
                }}
              >
                <SelectTrigger className="h-11 border-amame-border rounded-xl flex-1">
                  <SelectValue placeholder="Niveau" />
                </SelectTrigger>
                <SelectContent>
                  {NIVEAU_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {hasUserFilters && (
              <Button variant="ghost" onClick={resetFilters} className="h-11 text-amame-muted hover:text-amame-charcoal gap-2 rounded-xl shrink-0">
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Réinitialiser</span>
              </Button>
            )}
          </motion.div>
        </div>
      </section>

      {/* Contenu */}
      <section className="flex-grow py-8 lg:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
              </motion.div>
            ) : !data || data.concours.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-5">
                  <SearchX className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="font-nunito font-bold text-xl text-amame-charcoal mb-2">Aucun concours trouvé</h3>
                <p className="text-amame-muted text-sm max-w-md mx-auto mb-6">
                  {hasUserFilters ? "Aucun concours ne correspond à vos critères." : "Aucun concours disponible pour le moment."}
                </p>
                {hasUserFilters && (
                  <Button onClick={resetFilters} className="bg-amame-green hover:bg-amame-green-dark text-white font-semibold rounded-xl">
                    Réinitialiser les filtres
                  </Button>
                )}
              </motion.div>
            ) : (
              <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-nunito font-bold text-lg text-amame-charcoal">Concours disponibles</h2>
                    <p className="text-sm text-amame-muted">{data.totalElements} résultat{data.totalElements > 1 ? "s" : ""}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                  {data.concours.map((item, index) => (
                    <motion.div key={item.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.05 }}>
                      <ConcoursCardItem {...item} />
                    </motion.div>
                  ))}
                </div>

                {data.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <Button variant="outline" size="sm" disabled={!data.hasPrevious} onClick={handlePrev} className="rounded-lg border-amame-border gap-1">
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Précédent</span>
                    </Button>
                    <div className="flex items-center gap-1">
                      {pageNumbers().map((page, i) =>
                        page === "..." ? (
                          <span key={`d-${i}`} className="px-2 text-amame-muted text-sm">…</span>
                        ) : (
                          <Button
                            key={page}
                            variant={data.currentPage + 1 === page ? "default" : "outline"}
                            size="sm"
                            className={`w-9 h-9 p-0 rounded-lg text-sm ${data.currentPage + 1 === page ? "bg-amame-green hover:bg-amame-green-dark text-white" : "border-amame-border hover:bg-gray-50"}`}
                            onClick={() => handlePage(Number(page) - 1)}
                          >
                            {page}
                          </Button>
                        )
                      )}
                    </div>
                    <Button variant="outline" size="sm" disabled={!data.hasNext} onClick={handleNext} className="rounded-lg border-amame-border gap-1">
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
    </>
  );
};

export default ConcoursListing;
