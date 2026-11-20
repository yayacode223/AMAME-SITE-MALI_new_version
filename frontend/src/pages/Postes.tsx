import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Calendar, User, Search, ArrowRight, Newspaper } from "lucide-react";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import { Input } from "@/components/ui/input";
import CardSkeleton from "@/components/CardSkeleton";
import QueryError from "@/components/QueryError";
import { motion } from "framer-motion";
import { useGetAllArticles } from "@/service/articleService";
import { adaptArticleForNews } from "@/utils/articleAdapter";
import MediaImage from "@/components/MediaImage";

const Postes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: allArticles, isLoading, isLoadingError, error, refetch, isFetching } = useGetAllArticles();

  const postes = useMemo(() => {
    if (!allArticles) return [];
    let list = (allArticles.content || [])
      .map(adaptArticleForNews)
      .filter(a => a.categorie === "Postes")
      .sort((a, b) => new Date(b.date_publication).getTime() - new Date(a.date_publication).getTime());

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(a =>
        a.titre.toLowerCase().includes(term) ||
        a.contenu?.toLowerCase().includes(term) ||
        a.auteur?.toLowerCase().includes(term)
      );
    }
    return list;
  }, [allArticles, searchTerm]);

  return (
    <div className="min-h-screen bg-amame-surface flex flex-col">
      <SEO
        title="Postes & Opportunités"
        description="Découvrez les postes et opportunités professionnelles pour les membres et étudiants maliens. Offres sélectionnées et publiées par l'AMAME."
        path="/articles/postes"
        keywords="postes Mali, opportunités emploi Mali, offres AMAME, carrière étudiant malien"
      />
      <Navbar />
      <PageHero
        icon={Briefcase}
        label="Actualités"
        title="Offres de"
        titleHighlight="Postes"
        description="" //Découvrez les offres d'emploi, stages et opportunités professionnelles partagées par l'AMAME pour les étudiants et jeunes diplômés maliens.
        image="heroes/hero-postes"
        imageAlt="Offres d'emploi et opportunités professionnelles"
      />

      {/* Recherche */}
      <section className="bg-white border-b border-amame-border py-5">
        <div className="page-container">
          <div className="relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amame-muted pointer-events-none" />
            <Input
              type="text"
              placeholder="Rechercher un poste..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 h-11 border-amame-border focus:border-amame-green rounded-xl"
            />
          </div>
        </div>
      </section>

      <section className="flex-grow py-8 lg:py-12">
        <div className="page-container">
          {isLoading ? (
            <div className="space-y-5">
              {[...Array(4)].map((_, i) => <CardSkeleton key={i} layout="row" lines={3} />)}
            </div>
          ) : isLoadingError ? (
            <QueryError error={error} onRetry={refetch} isRetrying={isFetching} title="Les offres de postes n'ont pas pu être chargées." />
          ) : postes.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amame-green-subtle rounded-2xl mb-5">
                <Briefcase className="h-8 w-8 text-amame-green" />
              </div>
              <h3 className="font-nunito font-bold text-xl text-amame-charcoal mb-2">Aucun poste disponible</h3>
              <p className="text-amame-muted text-sm max-w-md mx-auto">
                {searchTerm ? "Aucun poste ne correspond à votre recherche." : "Aucune offre de poste n'est disponible pour le moment. Revenez bientôt."}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-nunito font-bold text-lg text-amame-charcoal">Offres disponibles</h2>
                  <p className="text-sm text-amame-muted">{postes.length} poste{postes.length > 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="space-y-5">
                {postes.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.06 }}
                  >
                    {/* Carte .amame-card en ligne (index.css) ; toute la carte est un lien (avant : seul
                        « Voir l'offre » l'était) */}
                    <Link to={`/articles/${article.slug}`} className="amame-card amame-card-row amame-card-interactive group">
                      <div className="amame-card-media flex items-center justify-center bg-amame-gold-subtle">
                        {(article.fileUrl ?? article.filePath) ? (
                          <MediaImage
                            src={article.fileUrl ?? article.filePath}
                            maxWidth={640}
                            sizes="(min-width: 640px) 224px, 100vw"
                            alt={article.titre}
                            className="amame-card-img"
                          />
                        ) : (
                          <Newspaper className="h-10 w-10 text-amame-gold/40" />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="amame-card-body">
                          <span className="inline-block text-xs font-semibold text-amber-700 bg-amame-gold-subtle border border-amame-gold/20 px-2.5 py-1 rounded-full mb-2 w-fit">
                            Poste
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
                            {article.contenu || "Lire l'annonce pour plus de détails."}
                          </p>
                        </div>
                        <div className="amame-card-footer justify-end">
                          <span className="amame-card-action text-amame-green-dark group-hover:gap-1.5">
                            Voir l'offre <ArrowRight className="h-3.5 w-3.5" />
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

export default Postes;
