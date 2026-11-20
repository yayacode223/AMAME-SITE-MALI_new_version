import { useMemo, useState } from "react";
import { Images, Calendar, MapPin, Search } from "lucide-react";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import Pagination from "../components/Pagination";
import { Input } from "@/components/ui/input";
import CardSkeleton from "@/components/CardSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useGetAllGaleries } from "@/service/galerieService";
import MediaImage from "@/components/MediaImage";

const Galeries = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  const { data: galeriesPage, isLoading } = useGetAllGaleries({
    page: currentPage,
    size: 6,
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
        image="heroes/hero-galeries"
        imageAlt="Galerie photo — événements et cérémonies AMAME"
      />

      {/* Recherche */}
      <section className="bg-white border-b border-amame-border py-5">
        <div className="page-container">
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
        <div className="page-container">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                {[...Array(6)].map((_, i) => <CardSkeleton key={i} lines={2} footer={false} />)}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                  {filtered.map((galerie, index) => (
                    <motion.div
                      key={galerie.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.06 }}
                    >
                    {/* Carte .amame-card (index.css). Une galerie n'a pas de page à ouvrir : la carte
                        n'est pas un lien et ne bouge pas au survol. */}
                    <div className="amame-card">
                      <div className="amame-card-media bg-amame-green-subtle">
                        {(galerie.coverImageUrl ?? galerie.coverImagePath) ? (
                          <MediaImage
                            src={galerie.coverImageUrl ?? galerie.coverImagePath}
                            maxWidth={640}
                            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                            alt={galerie.titre}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Images className="h-12 w-12 text-amame-green/30" />
                          </div>
                        )}
                      </div>

                      <div className="amame-card-body">
                        <h3 className="amame-card-title">{galerie.titre}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-amame-muted mt-2">
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
                          <p className="amame-card-text mt-2">{galerie.descriptionCourte}</p>
                        )}
                      </div>
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
