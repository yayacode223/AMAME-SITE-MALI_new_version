import { useMemo, useState } from "react";
import { Images, Calendar, MapPin, Search } from "lucide-react";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import Pagination from "../components/Pagination";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useGetAllGaleries } from "@/service/galerieService";

const PROD_URL = "https://amame.ml";

const Galeries = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  const { data: galeriesPage, isLoading } = useGetAllGaleries({
    page: currentPage,
    size: 9,
    sortBy: "dateCreation",
    sortDirection: "DESC",
  });

  // Recherche client-side dans la page courante (pas de backend search pour les galeries)
  const filtered = useMemo(() => {
    const list = galeriesPage?.content || [];
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(
      (g) =>
        g.titre.toLowerCase().includes(term) ||
        g.lieu?.toLowerCase().includes(term) ||
        g.descriptionCourte?.toLowerCase().includes(term),
    );
  }, [galeriesPage, searchTerm]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSearchTerm("");
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-amame-surface flex flex-col">
      <SEO
        title="Galeries — AMAME"
        description="Revivez les moments forts de l'AMAME à travers notre galerie photo : événements, cérémonies, rencontres et activités de l'association."
        path="/galeries"
        keywords="galerie photo AMAME, événements Mali, photos association AMAME"
      />
      <Navbar />
      <PageHero
        icon={Images}
        label="Actualités"
        title="Nos"
        titleHighlight="Galeries"
        description="" //Revivez les moments forts de l'AMAME : cérémonies de remise de prix, ateliers, rencontres et événements organisés par l'association.
        imageSrc="/images/heroes/hero-galeries.png"
        imageAlt="Galerie photo — événements et cérémonies AMAME"
      />

      {/* Recherche */}
      <section className="bg-white border-b border-amame-border py-5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amame-muted pointer-events-none" />
            <Input
              type="text"
              placeholder="Rechercher dans cette page..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 border-amame-border focus:border-amame-green rounded-xl"
            />
          </div>
        </div>
      </section>

      <section className="flex-grow py-8 lg:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-amame-border overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4 rounded-md" />
                      <Skeleton className="h-4 w-1/2 rounded-md" />
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : filtered.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amame-green-subtle rounded-2xl mb-5">
                  <Images className="h-8 w-8 text-amame-green" />
                </div>
                <h3 className="font-nunito font-bold text-xl text-amame-charcoal mb-2">Aucune galerie disponible</h3>
                <p className="text-amame-muted text-sm max-w-md mx-auto">
                  {searchTerm ? "Aucune galerie ne correspond à votre recherche." : "Aucune galerie n'est disponible pour le moment."}
                </p>
              </motion.div>
            ) : (
              <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-nunito font-bold text-lg text-amame-charcoal">Albums photos</h2>
                    {galeriesPage && !searchTerm && (
                      <p className="text-sm text-amame-muted">{galeriesPage.totalElements} album{galeriesPage.totalElements > 1 ? "s" : ""}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((galerie, index) => (
                    <motion.div
                      key={galerie.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.06 }}
                      className="bg-white rounded-xl border border-amame-border shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden group"
                    >
                      <div className="relative h-48 bg-amame-green-subtle overflow-hidden">
                        {galerie.coverImagePath ? (
                          <img
                            src={`${PROD_URL}/${galerie.coverImagePath}`}
                            alt={galerie.titre}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Images className="h-12 w-12 text-amame-green/30" />
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="font-nunito font-bold text-base text-amame-charcoal mb-2 line-clamp-2 group-hover:text-amame-green transition-colors">
                          {galerie.titre}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-amame-muted">
                          {galerie.dateEvenement && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(galerie.dateEvenement).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                            </span>
                          )}
                          {galerie.lieu && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {galerie.lieu}
                            </span>
                          )}
                        </div>
                        {galerie.descriptionCourte && (
                          <p className="mt-2 text-sm text-amame-muted leading-relaxed line-clamp-2">
                            {galerie.descriptionCourte}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {galeriesPage && !searchTerm && (
                  <Pagination
                    totalPages={galeriesPage.totalPages}
                    currentPage={galeriesPage.currentPage}
                    hasNext={galeriesPage.hasNext}
                    hasPrevious={galeriesPage.hasPrevious}
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

export default Galeries;
