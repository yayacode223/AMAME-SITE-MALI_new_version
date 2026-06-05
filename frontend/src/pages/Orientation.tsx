import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  Search,
  ArrowRight,
  Compass,
  Clock,
  RotateCcw,
} from "lucide-react";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import Pagination from "../components/Pagination";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useGetAllFilieres } from "../service/orientationService";
import { DomaineFiliereType } from "@/types/orientationType";

const difficultyConfig: Record<string, { label: string; cls: string }> = {
  TRES_ELEVEE: { label: "Très élevée", cls: "bg-red-50 text-red-700 border-red-200" },
  ELEVEE:      { label: "Élevée",      cls: "bg-orange-50 text-orange-700 border-orange-200" },
  MOYENNE:     { label: "Moyenne",     cls: "bg-amame-green-subtle text-amame-green-dark border-amame-green/20" },
  VARIABLE:    { label: "Variable",    cls: "bg-purple-50 text-purple-700 border-purple-200" },
};

const domains = [
  { value: DomaineFiliereType.ALL,                             label: "Tous les domaines"  },
  { value: DomaineFiliereType.SCIENCES_ET_TECHNOLOGIES,        label: "Sciences & Tech"    },
  { value: DomaineFiliereType.SCIENCES_DE_LA_SANTE,            label: "Santé"              },
  { value: DomaineFiliereType.SCIENCES_ECONOMIQUES_ET_GESTION, label: "Économie & Gestion" },
  { value: DomaineFiliereType.DROIT_ET_SCIENCES_POLITIQUES,    label: "Droit & Politique"  },
  { value: DomaineFiliereType.LETTRES_ET_SCIENCES_HUMAINES,    label: "Lettres & Humaines" },
  { value: DomaineFiliereType.ARTS_ET_COMMUNICATION,           label: "Arts & Com."        },
];

const CardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-amame-border shadow-card overflow-hidden">
    <Skeleton className="h-40 w-full rounded-none" />
    <div className="p-4 space-y-3">
      <Skeleton className="h-4 w-full rounded-md" />
      <Skeleton className="h-4 w-2/3 rounded-md" />
      <div className="flex gap-1.5 pt-1">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
    <div className="px-4 pb-4 pt-3 border-t border-amame-border flex items-center justify-between">
      <Skeleton className="h-4 w-20 rounded-md" />
      <Skeleton className="h-4 w-16 rounded-md" />
    </div>
  </div>
);

export function Orientation() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<DomaineFiliereType>(DomaineFiliereType.ALL);
  const [currentPage, setCurrentPage] = useState(0);

  const { data: filieresPage, isLoading } = useGetAllFilieres({
    page: currentPage,
    size: 6,
    sortBy: "nom",
    sortDirection: "ASC",
    search: searchTerm || undefined,
    domaine: selectedDomain,
  });

  const filieres = filieresPage?.content || [];
  const hasActiveFilters = searchTerm.trim() || selectedDomain !== DomaineFiliereType.ALL;

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(0);
  };

  const handleDomain = (domain: DomaineFiliereType) => {
    setSelectedDomain(domain);
    setCurrentPage(0);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedDomain(DomaineFiliereType.ALL);
    setCurrentPage(0);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  if (isLoading && !filieresPage) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-amame-surface">
          <div className="page-hero">
            <div className="container mx-auto px-4 py-12 text-center space-y-3">
              <Skeleton className="h-12 w-3/4 max-w-lg mx-auto rounded-xl" />
              <Skeleton className="h-5 w-1/2 max-w-md mx-auto rounded-md" />
            </div>
          </div>
          <div className="container mx-auto px-4 py-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-amame-surface flex flex-col">
        <SEO
          title="Orientation & Filières"
          description="Choisissez votre filière avec l'aide de l'AMAME. Explorez les domaines, débouchés professionnels, durées d'études et établissements disponibles au Mali."
          path="/orientation"
          keywords="orientation Mali, filières études Mali, débouchés professionnels, guide orientation scolaire"
        />
        <PageHero
          icon={Compass}
          label="Filières"
          title="Guide d'"
          titleHighlight="Orientation"
          description=""
          imageSrc="/images/heroes/hero-orientation.png"
          imageAlt="Étudiant malien choisissant sa voie professionnelle"
        />

        {/* Search & Domain filter */}
        <section className="bg-white border-b border-amame-border py-5">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amame-muted pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Rechercher une filière, un métier..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 h-11 border-amame-border focus:border-amame-green rounded-xl"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {domains.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleDomain(value)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                      selectedDomain === value
                        ? "bg-amame-green text-white border-amame-green shadow-green"
                        : "bg-white text-amame-slate border-amame-border hover:border-amame-green hover:text-amame-green"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" onClick={resetFilters}
                  className="h-11 text-amame-muted hover:text-amame-charcoal gap-2 rounded-xl shrink-0">
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">Réinitialiser</span>
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="flex-grow py-8 lg:py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-nunito font-bold text-lg text-amame-charcoal">Filières disponibles</h2>
                {filieresPage && (
                  <p className="text-sm text-amame-muted">
                    {filieresPage.totalElements} filière{filieresPage.totalElements > 1 ? "s" : ""} trouvée{filieresPage.totalElements > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
                  {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
                </motion.div>

              ) : filieres.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-amame-green-subtle rounded-2xl mb-5">
                    <Search className="h-8 w-8 text-amame-green" />
                  </div>
                  <h3 className="font-nunito font-bold text-xl text-amame-charcoal mb-2">Aucune filière trouvée</h3>
                  <p className="text-amame-muted text-sm max-w-md mx-auto mb-6">Essayez de modifier vos critères de recherche.</p>
                  <Button onClick={resetFilters} className="bg-amame-green hover:bg-amame-green-dark text-white font-semibold rounded-xl">
                    Voir toutes les filières
                  </Button>
                </motion.div>

              ) : (
                <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
                    {filieres.map((filiere) => {
                      const diff = difficultyConfig[filiere.difficulte] ?? difficultyConfig.MOYENNE;
                      return (
                        <Link key={filiere.id} to={`/orientation/${filiere.id}`} className="block h-full group">
                          <div className="h-full flex flex-col bg-white rounded-2xl border border-amame-border shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden">

                            {/* Header — image pleine largeur */}
                            <div className="relative h-40 overflow-hidden shrink-0 bg-gradient-to-br from-amame-green-subtle to-amame-green/10">
                              {filiere.filePath ? (
                                <img
                                  src={`/${filiere.filePath}`}
                                  alt={filiere.nom}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Briefcase className="h-12 w-12 text-amame-green/20" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                              {/* Badge difficulté — coin supérieur droit */}
                              <div className="absolute top-3 right-3">
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border bg-white/90 backdrop-blur-sm ${diff.cls}`}>
                                  {diff.label}
                                </span>
                              </div>

                              {/* Nom filière — overlay bas */}
                              <div className="absolute bottom-3 left-4 right-16">
                                <h3 className="font-nunito font-bold text-sm text-white leading-snug line-clamp-2 drop-shadow-sm">
                                  {filiere.nom}
                                </h3>
                              </div>
                            </div>

                            {/* Body */}
                            <div className="flex flex-col flex-grow px-4 pt-4 pb-3">
                              <p className="text-xs text-amame-muted leading-relaxed flex-grow line-clamp-3">
                                {filiere.descriptionCourte}
                              </p>

                              {filiere.debouches && filiere.debouches.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {filiere.debouches.slice(0, 3).map((d, i) => (
                                    <span key={i}
                                      className="text-xs bg-amame-green-subtle text-amame-green-dark border border-amame-green/15 px-2 py-0.5 rounded-full">
                                      {d}
                                    </span>
                                  ))}
                                  {filiere.debouches.length > 3 && (
                                    <span className="text-xs bg-gray-100 text-amame-muted border border-gray-200 px-2 py-0.5 rounded-full">
                                      +{filiere.debouches.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Footer */}
                            <div className="px-4 pb-4 pt-3 border-t border-amame-border flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 text-xs text-amame-muted min-w-0">
                                <Clock className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                                <span className="truncate">{filiere.dureeEtudes}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs font-semibold text-amame-green shrink-0 group-hover:gap-1.5 transition-all duration-200">
                                Voir détail <ArrowRight className="h-3 w-3" />
                              </div>
                            </div>

                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {filieresPage && (
                    <Pagination
                      totalPages={filieresPage.totalPages}
                      currentPage={filieresPage.currentPage}
                      hasNext={filieresPage.hasNext}
                      hasPrevious={filieresPage.hasPrevious}
                      onPageChange={handlePageChange}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}

export default Orientation;
