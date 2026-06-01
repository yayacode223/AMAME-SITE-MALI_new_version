import { useMemo } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Calendar, User, ArrowRight, Newspaper } from "lucide-react";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useGetAllArticles } from "@/service/articleService";
import { adaptArticleForNews } from "@/utils/articleAdapter";

const PROD_URL = "https://amame.ml";

const GuideConseils = () => {
  const { data: allArticles, isLoading } = useGetAllArticles();

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
        imageSrc="/images/heroes/hero-guide-conseils.png"
        imageAlt="Mentor et étudiant malien — conseils académiques"
      />

      <section className="flex-grow py-8 lg:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="space-y-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-amame-border p-5 flex gap-4">
                  <Skeleton className="h-40 w-48 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-3/4 rounded-md" />
                    <Skeleton className="h-4 w-1/3 rounded-md" />
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-4 w-2/3 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
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
                    <div className="bg-white rounded-xl border border-amame-border shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden group">
                      <div className="md:flex">
                        <div className="md:w-56 md:shrink-0 bg-amame-green-subtle flex items-center justify-center overflow-hidden">
                          {article.filePath ? (
                            <img
                              src={`${PROD_URL}/${article.filePath}`}
                              alt={article.titre}
                              className="w-full h-44 md:h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          ) : (
                            <Newspaper className="h-10 w-10 text-amame-green/30 m-10" />
                          )}
                        </div>
                        <div className="p-5 flex flex-col flex-grow">
                          <span className="inline-block text-xs font-semibold text-amame-green bg-amame-green-subtle border border-amame-green/20 px-2.5 py-1 rounded-full mb-2 w-fit">
                            {article.categorie}
                          </span>
                          <h3 className="font-nunito font-bold text-base text-amame-charcoal mb-2 line-clamp-2 group-hover:text-amame-green transition-colors">
                            {article.titre}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-amame-muted mb-3">
                            <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{article.auteur || "AMAME"}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(article.date_publication).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                            </span>
                          </div>
                          <p className="text-sm text-amame-muted leading-relaxed line-clamp-2 flex-grow mb-4">
                            {article.contenu || "Lire l'article pour plus de détails."}
                          </p>
                          <Link
                            to={`/articles/${article.slug}`}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-amame-green hover:text-amame-green-dark transition-colors group/link"
                          >
                            Lire le guide
                            <ArrowRight className="h-3.5 w-3.5 group-hover/link:translate-x-1 transition-transform" />
                          </Link>
                        </div>
                      </div>
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

export default GuideConseils;
