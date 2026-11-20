import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, User, Search, Clock, Eye, Newspaper, ArrowRight, Tag } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import CardSkeleton from "@/components/CardSkeleton";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import Pagination from "../components/Pagination";
import { motion, AnimatePresence } from "framer-motion";
import { useGetAllArticles } from "../service/articleService";
import { adaptArticleForNews } from "@/utils/articleAdapter";
import MediaImage from "@/components/MediaImage";

const CATEGORIES = [
  { id: "all", label: "Toutes" },
  { id: "Conseils", label: "Conseils", cls: "bg-amame-green-light text-amame-green-dark border-amame-green/20" },
  { id: "Orientation", label: "Orientation", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "Bourses", label: "Bourses", cls: "bg-amame-gold-subtle text-amame-gold border-amame-gold/20" },
  { id: "Concours", label: "Concours", cls: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "Témoignages", label: "Témoignages", cls: "bg-rose-50 text-rose-700 border-rose-200" },
];

const getCatStyle = (cat: string) =>
  CATEGORIES.find((c) => c.id === cat)?.cls || "bg-gray-50 text-gray-600 border-gray-200";

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

/* ─── Article card ──────────────────────────────────────────── */
const ArticleCard = ({ article, index }: { article: ReturnType<typeof adaptArticleForNews>; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.06 }}
  >
    {/* Carte .amame-card en ligne (index.css) : média à gauche dès 640 px ; toute la carte est un lien */}
    <Link to={`/articles/${article.slug}`} className="amame-card amame-card-row amame-card-interactive group">
        {/* Média */}
        <div className="amame-card-media bg-gradient-to-br from-amame-green-subtle to-green-100">
          {(article.fileUrl ?? article.filePath) ? (
            <MediaImage
              src={article.fileUrl ?? article.filePath}
              maxWidth={640}
              sizes="(min-width: 640px) 224px, 100vw"
              alt={article.titre}
              className="amame-card-img"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Newspaper className="h-12 w-12 text-amame-green/20" />
            </div>
          )}
        </div>

        {/* Corps et pied */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="amame-card-body">
            {/* Category + date */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getCatStyle(article.categorie)}`}>
                {article.categorie}
              </span>
              <span className="text-amame-border">·</span>
              <span className="text-[11px] text-amame-muted flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(article.date_publication)}
              </span>
              {article.temps_lecture && (
                <>
                  <span className="text-amame-border">·</span>
                  <span className="text-[11px] text-amame-muted flex items-center gap-1">
                    <Clock className="h-3 w-3" />{article.temps_lecture} min
                  </span>
                </>
              )}
            </div>

            {/* Titre (h3 : les articles sont sous le titre de section « Tous les articles ») */}
            <h3 className="amame-card-title group-hover:text-amame-green-dark">{article.titre}</h3>

            {/* Extrait */}
            <p className="amame-card-text line-clamp-2 mt-2">
              {article.contenu || "Cliquez pour lire cet article."}
            </p>
          </div>

          {/* Pied */}
          <div className="amame-card-footer">
            <span className="text-[11px] text-amame-muted flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amame-green flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                {(article.auteur || "A")[0].toUpperCase()}
              </span>
              {article.auteur || "AMAME"}
            </span>
            <div className="flex items-center gap-3">
              {article.vues !== undefined && (
                <span className="text-[11px] text-amame-muted flex items-center gap-1">
                  <Eye className="h-3 w-3" />{article.vues}
                </span>
              )}
              <span className="amame-card-action text-amame-green-dark group-hover:gap-1.5">
                Lire l'article <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </div>
    </Link>
  </motion.div>
);

/* ─── Page ──────────────────────────────────────────────────── */
export function Articles() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);

  const { data: articlesPage, isLoading } = useGetAllArticles({
    page: currentPage,
    size: 6,
    sortBy: "datePublication",
    sortDirection: "DESC",
    search: searchTerm || undefined,
    categorie: selectedCategory,
  });

  const { data: recentPage } = useGetAllArticles({
    page: 0,
    size: 5,
    sortBy: "datePublication",
    sortDirection: "DESC",
  });

  const articles = (articlesPage?.content || []).map(adaptArticleForNews);
  const recentArticles = (recentPage?.content || []).map(adaptArticleForNews);

  const handleSearch = (value: string) => { setSearchTerm(value); setCurrentPage(0); };
  const handleCategory = (id: string) => { setSelectedCategory(id); setCurrentPage(0); };
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 380, behavior: "smooth" });
  };
  const resetFilters = () => { setSearchTerm(""); setSelectedCategory("all"); setCurrentPage(0); };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-amame-surface flex flex-col">
        <SEO
          title="Actualités & Articles"
          description="Restez informé des dernières opportunités académiques et découvrez nos conseils pour réussir votre parcours."
          path="/articles"
          keywords="actualités éducatives Mali, conseils orientation, articles AMAME, blog académique"
        />
        <PageHero
          icon={Newspaper}
          label="Blog & Actualités"
          title="Actualités &"
          titleHighlight="Conseils"
          description="" //Restez informé des dernières opportunités et découvrez nos conseils pour réussir votre parcours académique.
          image="heroes/hero-articles"
          imageAlt="Blog et actualités éducatives AMAME"
        />

        {/* Barre de recherche + filtres */}
        <section className="bg-white border-b border-amame-border py-4">
          <div className="page-container">
            <div className="relative mb-4 max-w-xl">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amame-muted pointer-events-none" />
              <Input
                type="text"
                placeholder="Rechercher un article..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 h-11 border-amame-border focus:border-amame-green rounded-xl bg-amame-surface"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleCategory(id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                    selectedCategory === id
                      ? "bg-amame-green text-white border-amame-green shadow-green"
                      : "bg-white text-amame-slate border-amame-border hover:border-amame-green hover:text-amame-green"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Contenu principal */}
        <section className="flex-grow py-8 lg:py-12">
          <div className="page-container">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

              {/* Liste articles */}
              <div className="lg:col-span-3">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-nunito font-bold text-lg text-amame-charcoal">
                    {selectedCategory === "all" ? "Tous les articles" : selectedCategory}
                  </h2>
                  {articlesPage && (
                    <span className="text-xs text-amame-muted bg-white border border-amame-border px-2.5 py-1 rounded-full">
                      {articlesPage.totalElements} article{articlesPage.totalElements > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="space-y-4">
                      {[...Array(3)].map((_, i) => <CardSkeleton key={i} layout="row" lines={2} />)}
                    </motion.div>
                  ) : articles.length === 0 ? (
                    <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-20 amame-panel">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-amame-green-subtle rounded-2xl mb-4">
                        <Search className="h-8 w-8 text-amame-green" />
                      </div>
                      <h3 className="font-nunito font-bold text-xl text-amame-charcoal mb-2">Aucun article trouvé</h3>
                      <p className="text-sm text-amame-muted mb-6">Essayez de modifier vos critères de recherche.</p>
                      <Button onClick={resetFilters} className="bg-amame-green hover:bg-amame-green-dark text-white font-semibold rounded-xl">
                        Voir tous les articles
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                      <div className="space-y-4">
                        {articles.map((article, i) => (
                          <ArticleCard key={article.id} article={article} index={i} />
                        ))}
                      </div>
                      {articlesPage && (
                        <Pagination
                          totalPages={articlesPage.totalPages}
                          currentPage={articlesPage.currentPage}
                          hasNext={articlesPage.hasNext}
                          hasPrevious={articlesPage.hasPrevious}
                          onPageChange={handlePageChange}
                        />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sidebar */}
              <aside className="space-y-5">
                {/* Catégories */}
                <div className="amame-panel p-5">
                  <h3 className="font-nunito font-bold text-xs text-amame-charcoal mb-3 uppercase tracking-widest flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-amame-green" />
                    Catégories
                  </h3>
                  <div className="space-y-0.5">
                    {CATEGORIES.map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleCategory(id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                          selectedCategory === id
                            ? "bg-amame-green-subtle text-amame-green"
                            : "text-amame-slate hover:bg-gray-50 hover:text-amame-green"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Articles récents */}
                {recentArticles.length > 0 && (
                  <div className="amame-panel p-5">
                    <h3 className="font-nunito font-bold text-xs text-amame-charcoal mb-4 uppercase tracking-widest flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-amame-green" />
                      Articles récents
                    </h3>
                    <div className="space-y-3">
                      {recentArticles.map((a) => (
                        <Link key={a.id} to={`/articles/${a.slug}`}
                          className="flex gap-3 group p-2 rounded-xl hover:bg-amame-green-subtle/50 transition-colors">
                          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-amame-green-subtle to-green-100 flex items-center justify-center">
                            {(a.fileUrl ?? a.filePath) ? (
                              <MediaImage src={a.fileUrl ?? a.filePath} maxWidth={320} sizes="64px" alt={a.titre}
                                className="w-full h-full object-cover" />
                            ) : (
                              <Newspaper className="h-5 w-5 text-amame-green/30" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-amame-charcoal group-hover:text-amame-green line-clamp-2 leading-tight mb-1 transition-colors">
                              {a.titre}
                            </p>
                            <p className="text-[11px] text-amame-muted flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(a.date_publication).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}

export default Articles;
