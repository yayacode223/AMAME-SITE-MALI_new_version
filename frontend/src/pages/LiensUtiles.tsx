import { useState, useMemo } from "react";
import { Link2, ExternalLink, Search, Globe } from "lucide-react";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useGetLiensUtiles } from "@/service/lienUtileService";

const PROD_URL = "https://amame.ml";

const CATEGORY_COLORS: Record<string, string> = {
  Bourses: "bg-amame-gold-subtle text-amame-gold border-amame-gold/20",
  Concours: "bg-blue-50 text-blue-700 border-blue-200",
  Orientation: "bg-amame-green-light text-amame-green-dark border-amame-green/20",
  Emploi: "bg-purple-50 text-purple-700 border-purple-200",
  Formation: "bg-orange-50 text-orange-700 border-orange-200",
  Gouvernement: "bg-gray-50 text-gray-700 border-gray-200",
};

const getCatStyle = (cat?: string) =>
  cat ? (CATEGORY_COLORS[cat] || "bg-gray-50 text-gray-600 border-gray-200") : "bg-gray-50 text-gray-600 border-gray-200";

const CardSkeleton = () => (
  <div className="bg-white rounded-xl border border-amame-border p-5 space-y-3">
    <Skeleton className="h-5 w-3/4 rounded-md" />
    <Skeleton className="h-4 w-1/3 rounded-full" />
    <Skeleton className="h-12 w-full rounded-md" />
    <Skeleton className="h-8 w-1/3 rounded-md" />
  </div>
);

const LiensUtiles = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");

  const { data: liens, isLoading } = useGetLiensUtiles();

  const categories = useMemo(() => {
    if (!liens) return [];
    const set = new Set(liens.map(l => l.categorie).filter(Boolean) as string[]);
    return Array.from(set);
  }, [liens]);

  const filtered = useMemo(() => {
    if (!liens) return [];
    let list = liens;
    if (selectedCat !== "all") list = list.filter(l => l.categorie === selectedCat);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(l =>
        l.titre.toLowerCase().includes(term) ||
        l.description?.toLowerCase().includes(term)
      );
    }
    return list;
  }, [liens, selectedCat, searchTerm]);

  return (
    <div className="min-h-screen bg-amame-surface flex flex-col">
      <SEO
        title="Liens Utiles"
        description="Sélection de liens utiles pour les étudiants maliens : sites officiels, portails de bourses, concours et ressources académiques recommandés par l'AMAME."
        path="/orientation/liens-utiles"
        keywords="liens utiles étudiants Mali, ressources en ligne Mali, sites officiels bourses Mali, AMAME liens"
      />
      <Navbar />
      <PageHero
        icon={Link2}
        label="Orientation"
        title="Liens"
        titleHighlight="Utiles"
        description="" //Une sélection de ressources en ligne pour votre parcours : sites officiels, plateformes d'opportunités et portails éducatifs.
        imageSrc="/images/heroes/hero-liens-utiles.png"
        imageAlt="Ressources en ligne pour étudiants maliens"
      />

      {/* Filtres */}
      <section className="bg-white border-b border-amame-border py-5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amame-muted pointer-events-none" />
              <Input
                type="text"
                placeholder="Rechercher un lien..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 h-11 border-amame-border focus:border-amame-green rounded-xl"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setSelectedCat("all")}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${selectedCat === "all" ? "bg-amame-green text-white border-amame-green" : "bg-white text-amame-slate border-amame-border hover:border-amame-green hover:text-amame-green"}`}>
                Tous
              </button>
              {categories.map(cat => (
                <button key={cat} type="button" onClick={() => setSelectedCat(cat)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${selectedCat === cat ? "bg-amame-green text-white border-amame-green" : "bg-white text-amame-slate border-amame-border hover:border-amame-green hover:text-amame-green"}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="flex-grow py-8 lg:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amame-green-subtle rounded-2xl mb-5">
                <Globe className="h-8 w-8 text-amame-green" />
              </div>
              <h3 className="font-nunito font-bold text-xl text-amame-charcoal mb-2">Aucun lien disponible</h3>
              <p className="text-amame-muted text-sm">
                {searchTerm || selectedCat !== "all" ? "Aucun lien ne correspond à vos critères." : "Les liens utiles seront bientôt disponibles."}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="font-nunito font-bold text-lg text-amame-charcoal">Liens disponibles</h2>
                <p className="text-sm text-amame-muted">{filtered.length} lien{filtered.length > 1 ? "s" : ""}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((lien, index) => (
                  <motion.div key={lien.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.05 }}>
                    <div className="bg-white rounded-xl border border-amame-border shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 p-5 flex flex-col h-full group">
                      {lien.categorie && (
                        <span className={`inline-block text-xs font-semibold border px-2.5 py-1 rounded-full mb-3 w-fit ${getCatStyle(lien.categorie)}`}>
                          {lien.categorie}
                        </span>
                      )}
                      <h3 className="font-nunito font-bold text-sm text-amame-charcoal mb-2 group-hover:text-amame-green transition-colors flex-grow">
                        {lien.titre}
                      </h3>
                      {lien.description && (
                        <p className="text-xs text-amame-muted leading-relaxed line-clamp-3 mb-4">
                          {lien.description}
                        </p>
                      )}
                      <a
                        href={lien.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-auto inline-flex items-center gap-2 text-xs font-semibold text-amame-green hover:text-amame-green-dark transition-colors pt-3 border-t border-amame-border"
                      >
                        Accéder au lien <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default LiensUtiles;
