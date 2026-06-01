import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Calendar, User, Clock, Eye, ArrowLeft, Newspaper, Tag, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { motion } from "framer-motion";
import SEO from "../components/SEO";
import { useGetAllArticles, useGetArticleBySlug } from "@/service/articleService";
import { adaptArticleForDetail, adaptArticleForNews } from "@/utils/articleAdapter";

const PROD_URL = "https://amame.ml";

const CATEGORY_STYLES: Record<string, string> = {
  Conseils: "bg-amame-green-light text-amame-green-dark border-amame-green/20",
  Orientation: "bg-blue-50 text-blue-700 border-blue-200",
  Bourses: "bg-amame-gold-subtle text-amame-gold border-amame-gold/20",
  Concours: "bg-purple-50 text-purple-700 border-purple-200",
  Témoignages: "bg-rose-50 text-rose-700 border-rose-200",
};

const getCatStyle = (cat: string) => CATEGORY_STYLES[cat] || "bg-gray-50 text-gray-600 border-gray-200";
const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
const formatDateShort = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

/* ─── Rendu du contenu (paragraphes + sauts de ligne) ── */
const renderContent = (contenu: string) =>
  contenu.split("\n\n").map((para, i) => {
    if (!para.trim()) return null;
    const lines = para.split("\n");
    return (
      <p key={i} className="mb-5 text-[15px] sm:text-base leading-8 text-amame-slate">
        {lines.map((line, j) => (
          <span key={j}>{line}{j < lines.length - 1 && <br />}</span>
        ))}
      </p>
    );
  });

export function ArticleDetail() {
  const { slug } = useParams();
  const { data: articleData, isLoading } = useGetArticleBySlug(slug || "");
  const { data: allArticlesData } = useGetAllArticles({ page: 0, size: 10, sortBy: "datePublication", sortDirection: "DESC" });

  const article = useMemo(() => articleData ? adaptArticleForDetail(articleData) : null, [articleData]);

  const recentArticles = useMemo(() => {
    if (!allArticlesData) return [];
    return (allArticlesData.content || []).map(adaptArticleForNews)
      .filter(a => a.slug !== slug)
      .slice(0, 5);
  }, [allArticlesData, slug]);

  const similarArticles = useMemo(() => {
    if (!allArticlesData || !article) return [];
    return (allArticlesData.content || []).map(adaptArticleForNews)
      .filter(a => a.categorie === article.categorie && a.slug !== slug)
      .slice(0, 3);
  }, [allArticlesData, article, slug]);

  /* ─── Loading ─── */
  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-amame-surface">
          <div className="bg-white border-b border-amame-border py-3">
            <div className="container mx-auto px-4"><Skeleton className="h-9 w-36 rounded-lg" /></div>
          </div>
          <div className="bg-white border-b border-amame-border py-10 text-center space-y-4">
            <Skeleton className="h-6 w-24 mx-auto rounded-full" />
            <Skeleton className="h-10 w-3/4 max-w-2xl mx-auto rounded-lg" />
            <div className="flex justify-center gap-4">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-4 w-28 rounded-full" />
            </div>
          </div>
          <div className="container mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-5">
              <Skeleton className="w-full rounded-2xl" style={{ aspectRatio: "16/7" }} />
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-5 w-full rounded-md" />)}
            </div>
            <div className="space-y-4">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}</div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  /* ─── Not found ─── */
  if (!article) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-amame-surface flex items-center justify-center">
          <div className="text-center p-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amame-green-subtle rounded-2xl mb-5">
              <Newspaper className="h-8 w-8 text-amame-green" />
            </div>
            <h2 className="font-nunito font-bold text-xl text-amame-charcoal mb-3">Article non trouvé</h2>
            <p className="text-amame-muted mb-6">L'article que vous recherchez n'existe pas ou a été déplacé.</p>
            <Button asChild className="bg-amame-green hover:bg-amame-green-dark text-white font-semibold rounded-xl gap-2">
              <Link to="/articles"><ArrowLeft className="h-4 w-4" />Retour aux actualités</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SEO
        title={article.titre}
        description={article.metaDescription || article.contenu?.slice(0, 155) || `Article AMAME : ${article.titre}`}
        path={`/articles/${article.slug}`}
        type="article"
        image={article.filePath ? `${PROD_URL}/${article.filePath}` : undefined}
      />
      <Navbar />
      <div className="min-h-screen bg-amame-surface flex flex-col">

        {/* Breadcrumb */}
        <div className="bg-white border-b border-amame-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-1.5 text-xs text-amame-muted">
            <Button variant="ghost" asChild className="text-amame-muted hover:text-amame-charcoal hover:bg-gray-100 rounded-lg gap-2 h-8 text-xs px-3">
              <Link to="/articles"><ArrowLeft className="h-3.5 w-3.5" />Actualités</Link>
            </Button>
            <span>/</span>
            <span className="text-amame-charcoal font-medium line-clamp-1 max-w-xs">{article.titre}</span>
          </div>
        </div>

        {/* Header article */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="bg-white border-b border-amame-border py-10"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl text-center">
            <span className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border mb-4 ${getCatStyle(article.categorie)}`}>
              {article.categorie}
            </span>
            <h1 className="font-nunito font-black text-2xl sm:text-3xl lg:text-[2.25rem] text-amame-charcoal mb-5 leading-tight">
              {article.titre}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-amame-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-full bg-amame-green flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {(article.auteur || "A")[0].toUpperCase()}
                </span>
                {article.auteur || "AMAME"}
              </span>
              <span className="text-amame-border">·</span>
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{formatDate(article.date_publication)}</span>
              {article.temps_lecture && (
                <>
                  <span className="text-amame-border">·</span>
                  <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{article.temps_lecture} min de lecture</span>
                </>
              )}
              {article.vues != null && (
                <>
                  <span className="text-amame-border">·</span>
                  <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" />{article.vues} vues</span>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Contenu principal + sidebar */}
        <section className="flex-grow py-8 lg:py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

              {/* Article */}
              <motion.div
                className="lg:col-span-3 space-y-0"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="bg-white rounded-2xl border border-amame-border shadow-card overflow-hidden">
                  {/* Image hero */}
                  {article.filePath && (
                    <div className="w-full overflow-hidden bg-amame-green-subtle">
                      <img
                        src={`${PROD_URL}/${article.filePath}`}
                        alt={article.titre}
                        className="w-full object-cover"
                        style={{ aspectRatio: "16 / 7", objectPosition: "center" }}
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Corps */}
                  <div className="p-6 lg:p-8 xl:p-10">
                    <div className="max-w-none">
                      {renderContent(article.contenu)}
                    </div>

                    {/* Tags */}
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-amame-border">
                        <Tag className="h-3.5 w-3.5 text-amame-muted shrink-0" />
                        {article.tags.map((tag, i) => (
                          <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amame-green-subtle text-amame-green border border-amame-green/20">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Auteur card */}
                    <div className="mt-8 pt-6 border-t border-amame-border">
                      <div className="flex items-center gap-4 p-4 bg-amame-green-subtle/60 rounded-2xl border border-amame-green/15">
                        <div className="w-12 h-12 bg-amame-green rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                          {(article.auteur || "A")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-amame-charcoal text-sm">{article.auteur || "AMAME"}</p>
                          <p className="text-xs text-amame-muted mt-0.5">Expert en orientation et conseils académiques — AMAME</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Articles similaires (bas de page) */}
                {similarArticles.length > 0 && (
                  <div className="mt-8">
                    <h3 className="font-nunito font-bold text-lg text-amame-charcoal mb-4 flex items-center gap-2">
                      <span className="w-1 h-5 bg-amame-green rounded-full inline-block" />
                      Articles similaires
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {similarArticles.map(a => (
                        <Link key={a.id} to={`/articles/${a.slug}`}
                          className="group bg-white rounded-2xl border border-amame-border shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden">
                          <div className="overflow-hidden bg-gradient-to-br from-amame-green-subtle to-green-100">
                            {a.filePath ? (
                              <img src={`${PROD_URL}/${a.filePath}`} alt={a.titre}
                                className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy" />
                            ) : (
                              <div className="w-full h-36 flex items-center justify-center">
                                <Newspaper className="h-8 w-8 text-amame-green/20" />
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <p className="font-nunito font-semibold text-sm text-amame-charcoal line-clamp-2 leading-snug group-hover:text-amame-green transition-colors mb-2">
                              {a.titre}
                            </p>
                            <p className="text-[11px] text-amame-muted flex items-center gap-1">
                              <Calendar className="h-3 w-3" />{formatDateShort(a.date_publication)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Sidebar */}
              <motion.aside
                className="space-y-5"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {/* Articles récents */}
                {recentArticles.length > 0 && (
                  <div className="bg-white rounded-2xl border border-amame-border shadow-card p-5">
                    <h3 className="font-nunito font-bold text-xs text-amame-charcoal uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-amame-green" />Articles récents
                    </h3>
                    <div className="space-y-3">
                      {recentArticles.map(a => (
                        <Link key={a.id} to={`/articles/${a.slug}`}
                          className="flex gap-3 group p-2 rounded-xl hover:bg-amame-green-subtle/50 transition-colors">
                          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-amame-green-subtle to-green-100 flex items-center justify-center">
                            {a.filePath
                              ? <img src={`${PROD_URL}/${a.filePath}`} alt={a.titre} className="w-full h-full object-cover" loading="lazy" />
                              : <Newspaper className="h-4 w-4 text-amame-green/30" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-amame-charcoal group-hover:text-amame-green line-clamp-2 leading-tight mb-1 transition-colors">
                              {a.titre}
                            </p>
                            <p className="text-[11px] text-amame-muted flex items-center gap-1">
                              <Calendar className="h-3 w-3" />{formatDateShort(a.date_publication)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Toutes les actualités */}
                <Link to="/articles"
                  className="group flex items-center justify-between p-4 bg-amame-green text-white rounded-2xl hover:bg-amame-green-dark transition-colors shadow-green">
                  <div>
                    <p className="font-nunito font-bold text-sm">Toutes les actualités</p>
                    <p className="text-green-100 text-xs mt-0.5">Voir tous les articles</p>
                  </div>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.aside>

            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}

export default ArticleDetail;
