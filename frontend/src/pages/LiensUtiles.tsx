import { useState, useMemo } from "react";
import { Link2, ExternalLink, Search, Globe } from "lucide-react";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import { Input } from "@/components/ui/input";
import CardSkeleton from "@/components/CardSkeleton";
import { motion } from "framer-motion";
import { useGetLiensUtiles } from "@/service/lienUtileService";

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
        image="heroes/hero-liens-utiles"
        imageAlt="Ressources en ligne pour étudiants maliens"
      />

      {/* Filtres */}
      <section className="bg-white border-b border-amame-border py-5">
        <div className="page-container">
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
        <div className="page-container">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {[...Array(6)].map((_, i) => <CardSkeleton key={i} media="none" lines={2} />)}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                {filtered.map((lien, index) => (
                  <motion.div key={lien.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.05 }}>
                    {/* Carte .amame-card sans média (index.css) ; toute la carte est le lien externe
                        (avant : seul « Accéder au lien » l'était) */}
                    <a
                      href={lien.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="amame-card amame-card-interactive group"
                    >
                      <div className="amame-card-body">
                        {lien.categorie && (
                          <span className={`inline-block text-xs font-semibold border px-2.5 py-1 rounded-full mb-3 w-fit ${getCatStyle(lien.categorie)}`}>
                            {lien.categorie}
                          </span>
                        )}
                        <h3 className="amame-card-title group-hover:text-amame-green-dark">{lien.titre}</h3>
                        {lien.description && <p className="amame-card-text mt-2">{lien.description}</p>}
                      </div>
                      <div className="amame-card-footer justify-end">
                        <span className="amame-card-action text-amame-green-dark group-hover:gap-1.5">
                          Accéder au lien <ExternalLink className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </a>
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
