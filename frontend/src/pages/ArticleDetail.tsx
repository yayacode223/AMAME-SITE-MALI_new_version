import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, User, Clock, Eye, ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { useGetAllArticles, useGetArticleBySlug } from '@/service/articleService';
import { adaptArticleForDetail, adaptArticleForNews } from '@/utils/articleAdapter';

// const url = import.meta.env.BASE; 
const url = 'https://amame.ml';

export function ArticleDetail() {
  const { slug } = useParams();
  
  // DEUX APPELS seulement (nécessaires pour cette page)
  const { data: articleData, isLoading: isArticleLoading } = useGetArticleBySlug(slug || '');
  const { data: allArticlesData, isLoading: isAllArticlesLoading } = useGetAllArticles();

  // Adapter l'article principal
  const article = useMemo(() => {
    return articleData ? adaptArticleForDetail(articleData) : null;
  }, [articleData]);

  // Articles populaires (les 5 plus récents)
  const popularArticles = useMemo(() => {
    if (!allArticlesData) return [];
    return allArticlesData
      .map(adaptArticleForNews)
      .sort((a, b) => new Date(b.date_publication).getTime() - new Date(a.date_publication).getTime())
      .slice(0, 5)
      .filter(a => a.slug !== slug); // Exclure l'article actuel
  }, [allArticlesData, slug]);

  // Articles similaires (même catégorie)
  const similarArticles = useMemo(() => {
    if (!allArticlesData || !article) return [];
    return allArticlesData
      .map(adaptArticleForNews)
      .filter(a => 
        a.categorie === article.categorie && 
        a.slug !== slug
      )
      .slice(0, 5);
  }, [allArticlesData, article, slug]);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Conseils': 'emerald',
      'Orientation': 'blue',
      'Bourses': 'amber',
      'Concours': 'purple',
      'Témoignages': 'pink'
    };
    return colors[category] || 'gray';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Loading state amélioré
  if (isArticleLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
          {/* Header skeleton */}
          <section className="bg-white border-b">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Skeleton className="h-10 w-32 mb-6 rounded-lg" />
              <div className="text-center mb-8">
                <Skeleton className="h-8 w-32 mx-auto mb-4 rounded-full" />
                <Skeleton className="h-12 w-3/4 max-w-3xl mx-auto mb-6 rounded-lg" />
                <div className="flex flex-wrap justify-center gap-6">
                  <Skeleton className="h-5 w-24 rounded-lg" />
                  <Skeleton className="h-5 w-32 rounded-lg" />
                  <Skeleton className="h-5 w-28 rounded-lg" />
                </div>
              </div>
            </div>
          </section>

          {/* Content skeleton */}
          <section className="py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main content skeleton */}
                <div className="lg:col-span-3">
                  <Skeleton className="h-96 w-full rounded-2xl mb-8" />
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-full rounded-lg" />
                    <Skeleton className="h-6 w-full rounded-lg" />
                    <Skeleton className="h-6 w-2/3 rounded-lg" />
                  </div>
                  <div className="mt-8 p-6 border-0 shadow-lg rounded-xl">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-16 h-16 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32 rounded-lg" />
                        <Skeleton className="h-4 w-full rounded-lg" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Sidebar skeleton */}
                <div className="space-y-6">
                  <Skeleton className="h-64 w-full rounded-xl" />
                  <Skeleton className="h-72 w-full rounded-xl" />
                </div>
              </div>
            </div>
          </section>
        </div>
        <Footer />
      </>
    );
  }

  if (!article) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Article non trouvé
            </h2>
            <p className="text-gray-600 mb-6">
              L'article que vous recherchez n'existe pas ou a été déplacé.
            </p>
            <Button asChild>
              <Link to="/articles">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux actualités
              </Link>
            </Button>
          </Card>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
        {/* Header */}
        <section className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Button variant="ghost" asChild className="mb-6">
              <Link to="/articles">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux actualités
              </Link>
            </Button>
            
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className={`mb-4 bg-${getCategoryColor(article.categorie)}-100 text-${getCategoryColor(article.categorie)}-800 border-0 text-lg px-4 py-2 hover:bg-${getCategoryColor(article.categorie)}-200 transition-colors`}>
                {article.categorie}
              </Badge>
              
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {article.titre}
              </h1>
              
              <div className="flex flex-wrap items-center justify-center gap-6 text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span className="font-medium">{article.auteur}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>{formatDate(article.date_publication)}</span>
                </div>
                {article.temps_lecture && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span>{article.temps_lecture} min de lecture</span>
                  </div>
                )}
                {article.vues && (
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    <span>{article.vues} vues</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Article Content */}
              <motion.div 
                className="lg:col-span-3"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="p-8 border-0 shadow-lg">
                  {article?.filePath && (
                    <div className="mb-8 rounded-2xl overflow-hidden">
                      <img
                        src={`${url}/${article.filePath}`}
                        alt={article.titre}
                        className="w-full h-96 object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = document.createElement('div');
                          fallback.className = 'w-full h-96 bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center';
                          fallback.innerHTML = '<div class="text-4xl text-white">📄</div>';
                          e.currentTarget.parentNode?.appendChild(fallback);
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="prose prose-lg max-w-none">
                    {/* Contenu de l'article formaté */}
                    <div className="text-gray-700 leading-relaxed space-y-6">
                      {article.contenu.split('\n\n').map((paragraph, index) => (
                        <p key={index} className="text-lg leading-8">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Auteur */}
                <Card className="mt-8 p-6 border-0 shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {article.auteur.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{article.auteur}</h4>
                      <p className="text-gray-600">
                        Expert en orientation et conseils académiques. Partage des conseils pratiques pour aider les étudiants dans leur parcours.
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Sidebar */}
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                {/* Articles similaires */}
                {similarArticles.length > 0 && (
                  <Card className="p-6 border-0 shadow-lg">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      📖 Articles Similaires
                    </h3>
                    <div className="space-y-4">
                      {similarArticles.map((similarArticle) => (
                        <Link
                          key={similarArticle.id}
                          to={`/articles/${similarArticle.slug}`}
                          className="block group p-3 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start space-x-3">
                            {similarArticle.filePath ? (
                              <img
                                src={`${url}/${similarArticle.filePath}`}
                                alt={similarArticle.titre}
                                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-400 rounded-lg flex items-center justify-center flex-shrink-0">
                                <div className="text-2xl">📄</div>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 mb-1 line-clamp-2 text-sm leading-tight">
                                {similarArticle.titre}
                              </h4>
                              <div className="flex items-center text-xs text-gray-500">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(similarArticle.date_publication)}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Articles populaires */}
                <Card className="p-6 border-0 shadow-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Eye className="h-5 w-5 mr-2 text-amber-600" />
                    Articles Récents
                  </h3>
                  <div className="space-y-4">
                    {popularArticles.map((popularArticle) => (
                      <Link
                        key={popularArticle.id}
                        to={`/articles/${popularArticle.slug}`}
                        className="block group p-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          {popularArticle.filePath ? (
                            <img
                              src={`${url}/${popularArticle.filePath}`}
                              alt={popularArticle.titre}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-400 rounded-lg flex items-center justify-center flex-shrink-0">
                              <div className="text-2xl">📄</div>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 mb-1 line-clamp-2 text-sm leading-tight">
                              {popularArticle.titre}
                            </h4>
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(popularArticle.date_publication)}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}

export default ArticleDetail;