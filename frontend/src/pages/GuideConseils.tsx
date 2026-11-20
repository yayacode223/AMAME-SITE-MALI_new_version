import { useMemo } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Calendar, User, ArrowRight, Newspaper } from "lucide-react";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import CardSkeleton from "@/components/CardSkeleton";
import QueryError from "@/components/QueryError";
import { motion } from "framer-motion";
import { useGetAllArticles } from "@/service/articleService";
import { adaptArticleForNews } from "@/utils/articleAdapter";
import MediaImage from "@/components/MediaImage";

const GuideConseils = () => {
  const { data: allArticles, isLoading, isLoadingError, error, refetch, isFetching } = useGetAllArticles();

  const conseils = useMemo(() => {
    if (!allArticles) return [];
    return (allArticles.content || [])
      .map(adaptArticleForNews)
      .filter(a => a.categorie === "Conseils" || a.categorie === "Orientation")
      .sort((a, b) => new Date(b.date_publication).getTime() - new Date(a.date_publication).getTime());
  }, [allArticles]);

  return (
    <div className="min-h-screen bg-amame-surface flex flex-col">
      <SEO
        title="Guide & Conseils"
        description="Conseils et guides pratiques pour réussir vos études et votre orientation au Mali. Articles de l'AMAME pour accompagner les étudiants maliens vers l'excellence."
        path="/orientation/guide-conseils"
        keywords="guide études Mali, conseils orientation Mali, réussir études Mali, AMAME guide"
      />
      <Navbar />
      <PageHero
        icon={BookOpen}
        label="Orientation"
        title="Guide &"
        titleHighlight="Conseils"
        description="" //Nos experts vous guident dans votre parcours académique. Conseils pratiques, stratégies d'orientation et recommandations personnalisées.
        image="heroes/hero-guide-conseils"
        imageAlt="Mentor et étudiant malien — conseils académiques"
      />

      <section className="flex-grow py-8 lg:py-12">
        <div className="page-container">
          {isLoading ? (
            <div className="space-y-5">
              {[...Array(4)].map((_, i) => <CardSkeleton key={i} layout="row" lines={3} />)}
            </div>
          ) : isLoadingError ? (
            <QueryError error={error} onRetry={refetch} isRetrying={isFetching} title="Les guides et conseils n'ont pas pu être chargés." />
          ) : conseils.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amame-green-subtle rounded-2xl mb-5">
                <BookOpen className="h-8 w-8 text-amame-green" />
              </div>
              <h3 className="font-nunito font-bold text-xl text-amame-charcoal mb-2">Aucun conseil disponible</h3>
              <p className="text-amame-muted text-sm">Les guides et conseils seront bientôt disponibles.</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="font-nunito font-bold text-lg text-amame-charcoal">Guides & Conseils</h2>
                <p className="text-sm text-amame-muted">{conseils.length} article{conseils.length > 1 ? "s" : ""}</p>
              </div>
              <div className="space-y-5">
                {conseils.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.06 }}
                  >
                    {/* Carte .amame-card en ligne (index.css) ; toute la carte est un lien (avant : seul
                        « Lire le guide » l'était) */}
                    <Link to={`/articles/${article.slug}`} className="amame-card amame-card-row amame-card-interactive group">
                      <div className="amame-card-media flex items-center justify-center bg-amame-green-subtle">
                        {(article.fileUrl ?? article.filePath) ? (
                          <MediaImage
                            src={article.fileUrl ?? article.filePath}
                            maxWidth={640}
                            sizes="(min-width: 640px) 224px, 100vw"
                            alt={article.titre}
                            className="amame-card-img"
                          />
                        ) : (
                          <Newspaper className="h-10 w-10 text-amame-green/30" />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="amame-card-body">
                          <span className="inline-block text-xs font-semibold text-amame-green-dark bg-amame-green-subtle border border-amame-green/20 px-2.5 py-1 rounded-full mb-2 w-fit">
                            {article.categorie}
                          </span>
                          <h3 className="amame-card-title group-hover:text-amame-green-dark">{article.titre}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-amame-muted mt-2">
                            <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{article.auteur || "AMAME"}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(article.date_publication).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                            </span>
                          </div>
                          <p className="amame-card-text line-clamp-2 mt-3">
                            {article.contenu || "Lire l'article pour plus de détails."}
                          </p>
                        </div>
                        <div className="amame-card-footer justify-end">
                          <span className="amame-card-action text-amame-green-dark group-hover:gap-1.5">
                            Lire le guide <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
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

export default GuideConseils;
