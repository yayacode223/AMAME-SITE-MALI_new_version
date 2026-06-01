import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, User, Search, Clock, Eye, Newspaper, ArrowRight, Tag } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import Pagination from "../components/Pagination";
import { motion, AnimatePresence } from "framer-motion";
import { useGetAllArticles } from "../service/articleService";
import { adaptArticleForNews } from "@/utils/articleAdapter";

const PROD_URL = "https://amame.ml";

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

/* ─── Skeleton card ─────────────────────────────────────────── */
const ArticleCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-amame-border shadow-card overflow-hidden">
    <div className="flex flex-col sm:flex-row sm:min-h-[180px]">
      <Skeleton className="sm:w-52 shrink-0 h-52 sm:h-auto" />
      <div className="flex-1 p-5 sm:p-6 space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
        <Skeleton className="h-6 w-4/5 rounded-md" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-2/3 rounded-md" />
        <div className="flex justify-between pt-2 border-t border-amame-border/50">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-4 w-20 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

/* ─── Article card ──────────────────────────────────────────── */
const ArticleCard = ({ article, index }: { article: ReturnType<typeof adaptArticleForNews>; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.06 }}
  >
    <Link to={`/articles/${article.slug}`} className="group block bg-white rounded-2xl border border-amame-border shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:min-h-[190px]">
        {/* Image */}
        <div className="sm:w-56 shrink-0 relative overflow-hidden bg-gradient-to-br from-amame-green-subtle to-green-100">
          {article.filePath ? (
            <img
              src={`${PROD_URL}/${article.filePath}`}
              alt={article.titre}
              className="w-full h-52 sm:h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-52 sm:h-full flex items-center justify-center">
              <Newspaper className="h-12 w-12 text-amame-green/20" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-5 sm:p-6">
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

          {/* Title */}
          <h2 className="font-nunito font-bold text-base sm:text-lg text-amame-charcoal line-clamp-2 leading-snug mb-2 group-hover:text-amame-green transition-colors duration-200">
            {article.titre}
          </h2>

          {/* Excerpt */}
          <p className="text-sm text-amame-muted leading-relaxed line-clamp-2 flex-1 mb-4">
            {article.contenu || "Cliquez pour lire cet article."}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-amame-border/50 pt-3 mt-auto">
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
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amame-green group-hover:gap-2 transition-all">
                Lire <ArrowRight className="h-3 w-3" />
              </span>
            </div>
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
    size: 9,
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
          imageSrc="/images/heroes/hero-articles.png"
          imageAlt="Blog et actualités éducatives AMAME"
        />

        {/* Barre de recherche + filtres */}
        <section className="bg-white border-b border-amame-border py-4">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
                      {[...Array(3)].map((_, i) => <ArticleCardSkeleton key={i} />)}
                    </motion.div>
                  ) : articles.length === 0 ? (
                    <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-20 bg-white rounded-2xl border border-amame-border">
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
                <div className="bg-white rounded-2xl border border-amame-border shadow-card p-5">
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
                  <div className="bg-white rounded-2xl border border-amame-border shadow-card p-5">
                    <h3 className="font-nunito font-bold text-xs text-amame-charcoal mb-4 uppercase tracking-widest flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-amame-green" />
                      Articles récents
                    </h3>
                    <div className="space-y-3">
                      {recentArticles.map((a) => (
                        <Link key={a.id} to={`/articles/${a.slug}`}
                          className="flex gap-3 group p-2 rounded-xl hover:bg-amame-green-subtle/50 transition-colors">
                          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-amame-green-subtle to-green-100 flex items-center justify-center">
                            {a.filePath ? (
                              <img src={`${PROD_URL}/${a.filePath}`} alt={a.titre}
                                className="w-full h-full object-cover" loading="lazy" />
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
