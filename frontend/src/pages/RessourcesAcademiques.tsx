import { useState, useMemo } from "react";
import { BookMarked, Download, FileText, Search } from "lucide-react";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import Pagination from "../components/Pagination";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useGetRessources } from "@/service/ressourceAcademiqueService";

const PROD_URL = "https://amame.ml";

const TYPE_COLORS: Record<string, string> = {
  Cours: "bg-blue-50 text-blue-700 border-blue-200",
  Guide: "bg-amame-green-light text-amame-green-dark border-amame-green/20",
  Formulaire: "bg-amame-gold-subtle text-amame-gold border-amame-gold/20",
  Annales: "bg-purple-50 text-purple-700 border-purple-200",
  Syllabus: "bg-orange-50 text-orange-700 border-orange-200",
  Règlement: "bg-gray-50 text-gray-700 border-gray-200",
};

const getTypeStyle = (type?: string) =>
  type ? TYPE_COLORS[type] || "bg-gray-50 text-gray-600 border-gray-200" : "";

const CardSkeleton = () => (
  <div className="bg-white rounded-xl border border-amame-border p-5 space-y-3">
    <Skeleton className="h-10 w-10 rounded-lg" />
    <Skeleton className="h-5 w-3/4 rounded-md" />
    <Skeleton className="h-4 w-1/3 rounded-full" />
    <Skeleton className="h-12 w-full rounded-md" />
    <Skeleton className="h-8 w-1/3 rounded-md" />
  </div>
);

const RessourcesAcademiques = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedNiveau, setSelectedNiveau] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);

  const { data: ressourcesPage, isLoading } = useGetRessources({
    page: currentPage,
    size: 12,
    sortBy: "ordre",
    sortDirection: "ASC",
  });

  // Types et niveaux extraits de la page courante (pour les boutons de filtre)
  const types = useMemo(() => {
    if (!ressourcesPage) return [];
    return Array.from(new Set(ressourcesPage.content.map((r) => r.type).filter(Boolean) as string[]));
  }, [ressourcesPage]);

  const niveaux = useMemo(() => {
    if (!ressourcesPage) return [];
    return Array.from(new Set(ressourcesPage.content.map((r) => r.niveau).filter(Boolean) as string[]));
  }, [ressourcesPage]);

  // Filtrage client-side dans la page courante
  const filtered = useMemo(() => {
    if (!ressourcesPage) return [];
    let list = ressourcesPage.content;
    if (selectedType !== "all") list = list.filter((r) => r.type === selectedType);
    if (selectedNiveau !== "all") list = list.filter((r) => r.niveau === selectedNiveau);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (r) =>
          r.titre.toLowerCase().includes(term) ||
          r.description?.toLowerCase().includes(term),
      );
    }
    return list;
  }, [ressourcesPage, selectedType, selectedNiveau, searchTerm]);

  const hasActiveFilters = searchTerm.trim() || selectedType !== "all" || selectedNiveau !== "all";

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSearchTerm("");
    setSelectedType("all");
    setSelectedNiveau("all");
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-amame-surface flex flex-col">
      <SEO
        title="Ressources Académiques"
        description="Cours, guides, annales et documents académiques gratuits pour étudiants maliens."
        path="/orientation/ressources"
        keywords="ressources académiques Mali, cours gratuits Mali, annales concours Mali, documents étudiants AMAME"
      />
      <Navbar />
      <PageHero
        icon={BookMarked}
        label="Orientation"
        title="Ressources"
        titleHighlight="Académiques"
        description="" //Téléchargez des documents, guides et ressources pour préparer vos concours, optimiser vos candidatures et réussir vos études.
        imageSrc="/images/heroes/hero-ressources.png"
        imageAlt="Ressources académiques — livres et documents pour étudiants maliens"
      />

      {/* Filtres */}
      <section className="bg-white border-b border-amame-border py-5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amame-muted pointer-events-none" />
            <Input
              type="text"
              placeholder="Rechercher dans cette page..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 border-amame-border focus:border-amame-green rounded-xl max-w-lg"
            />
          </div>
          {types.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-amame-muted font-medium">Type :</span>
              {["all", ...types].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedType === t ? "bg-amame-green text-white border-amame-green" : "bg-white text-amame-slate border-amame-border hover:border-amame-green hover:text-amame-green"}`}
                >
                  {t === "all" ? "Tous" : t}
                </button>
              ))}
            </div>
          )}
          {niveaux.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-amame-muted font-medium">Niveau :</span>
              {["all", ...niveaux].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSelectedNiveau(n)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedNiveau === n ? "bg-blue-600 text-white border-blue-600" : "bg-white text-amame-slate border-amame-border hover:border-blue-400 hover:text-blue-600"}`}
                >
                  {n === "all" ? "Tous niveaux" : n}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="flex-grow py-8 lg:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
              </motion.div>
            ) : filtered.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amame-green-subtle rounded-2xl mb-5">
                  <BookMarked className="h-8 w-8 text-amame-green" />
                </div>
                <h3 className="font-nunito font-bold text-xl text-amame-charcoal mb-2">Aucune ressource disponible</h3>
                <p className="text-amame-muted text-sm">
                  {hasActiveFilters ? "Aucune ressource ne correspond à vos critères." : "Les ressources académiques seront bientôt disponibles."}
                </p>
              </motion.div>
            ) : (
              <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <div className="mb-6">
                  <h2 className="font-nunito font-bold text-lg text-amame-charcoal">Ressources disponibles</h2>
                  {ressourcesPage && !hasActiveFilters && (
                    <p className="text-sm text-amame-muted">
                      {ressourcesPage.totalElements} ressource{ressourcesPage.totalElements > 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filtered.map((ressource, index) => (
                    <motion.div key={ressource.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.05 }}>
                      <div className="bg-white rounded-xl border border-amame-border shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 p-5 flex flex-col h-full group">
                        <div className="w-10 h-10 bg-amame-gold-subtle rounded-xl flex items-center justify-center mb-4 shrink-0">
                          <FileText className="h-5 w-5 text-amame-gold" />
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {ressource.type && (
                            <span className={`text-xs font-semibold border px-2 py-0.5 rounded-full ${getTypeStyle(ressource.type)}`}>{ressource.type}</span>
                          )}
                          {ressource.niveau && (
                            <span className="text-xs font-medium border border-blue-200 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{ressource.niveau}</span>
                          )}
                        </div>
                        <h3 className="font-nunito font-bold text-sm text-amame-charcoal mb-2 group-hover:text-amame-green transition-colors flex-grow">
                          {ressource.titre}
                        </h3>
                        {ressource.description && (
                          <p className="text-xs text-amame-muted leading-relaxed line-clamp-2 mb-4">{ressource.description}</p>
                        )}
                        {ressource.filePath ? (
                          <a
                            href={`${PROD_URL}/${ressource.filePath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="mt-auto inline-flex items-center gap-2 text-xs font-semibold text-amame-green hover:text-amame-green-dark transition-colors pt-3 border-t border-amame-border"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Télécharger
                          </a>
                        ) : (
                          <p className="mt-auto text-xs text-amame-muted pt-3 border-t border-amame-border italic">Aucun document joint</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {ressourcesPage && !hasActiveFilters && (
                  <Pagination
                    totalPages={ressourcesPage.totalPages}
                    currentPage={ressourcesPage.currentPage}
                    hasNext={ressourcesPage.hasNext}
                    hasPrevious={ressourcesPage.hasPrevious}
                    onPageChange={handlePageChange}
                  />
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

export default RessourcesAcademiques;
