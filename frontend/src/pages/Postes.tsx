import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Calendar, User, Search, ArrowRight, Newspaper } from "lucide-react";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useGetAllArticles } from "@/service/articleService";
import { adaptArticleForNews } from "@/utils/articleAdapter";

const PROD_URL = "https://amame.ml";

const Postes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: allArticles, isLoading } = useGetAllArticles();

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
        imageSrc="/images/heroes/hero-postes.png"
        imageAlt="Offres d'emploi et opportunités professionnelles"
      />

      {/* Recherche */}
      <section className="bg-white border-b border-amame-border py-5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-amame-border p-5 flex gap-4">
                  <Skeleton className="h-40 w-48 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-3/4 rounded-md" />
                    <Skeleton className="h-4 w-1/3 rounded-md" />
                    <Skeleton className="h-4 w-full rounded-md" />
                  </div>
                </div>
              ))}
            </div>
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
                    <div className="bg-white rounded-xl border border-amame-border shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden group">
                      <div className="md:flex">
                        <div className="md:w-48 md:shrink-0 bg-amame-gold-subtle flex items-center justify-center overflow-hidden">
                          {article.filePath ? (
                            <img
                              src={`${PROD_URL}/${article.filePath}`}
                              alt={article.titre}
                              className="w-full h-40 md:h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          ) : (
                            <Newspaper className="h-10 w-10 text-amame-gold/40 m-10" />
                          )}
                        </div>
                        <div className="p-5 flex flex-col flex-grow">
                          <span className="inline-block text-xs font-semibold text-amame-gold bg-amame-gold-subtle border border-amame-gold/20 px-2.5 py-1 rounded-full mb-2 w-fit">
                            Poste
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
                            {article.contenu || "Lire l'annonce pour plus de détails."}
                          </p>
                          <Link
                            to={`/articles/${article.slug}`}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-amame-green hover:text-amame-green-dark transition-colors group/link"
                          >
                            Voir l'offre
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

export default Postes;
