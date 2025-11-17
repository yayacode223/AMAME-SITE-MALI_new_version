// ArticleDetail.tsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, User, Clock, Eye, Share2, Bookmark, ArrowLeft, Facebook, Twitter, Linkedin } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { useGetArticleBySlug, useGetPopularArticles, useGetSimilarArticles } from '@/service/articleService';
import { adaptArticleForDetail, adaptArticleForNews } from '@/utils/articleAdapter';



export function NewDetail() {
  const { slug } = useParams();
  const { data: articleData } = useGetArticleBySlug(slug || '');
  const { data: popularArticlesData } = useGetPopularArticles();
  const { data: similarArticlesData } = useGetSimilarArticles(articleData ? articleData.id : 0, articleData ? articleData.categorie : '');
  
  const article = articleData ? adaptArticleForDetail(articleData) : null;
  const popularArticles = popularArticlesData ? popularArticlesData.map(adaptArticleForNews) : [];
  const similarArticles = similarArticlesData ? similarArticlesData.map(adaptArticleForNews) : [];

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

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = article?.titre || '';
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    };

    if (shareUrls[platform as keyof typeof shareUrls]) {
      window.open(shareUrls[platform as keyof typeof shareUrls], '_blank', 'width=600,height=400');
    }
  };

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
              <Link to="/actualites">
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
              <Link to="/actualites">
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
              <Badge className={`mb-4 bg-${getCategoryColor(article.categorie)}-100 text-${getCategoryColor(article.categorie)}-800 border-0 text-lg px-4 py-2`}>
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
                  {article.image && (
                    <div className="mb-8 rounded-2xl overflow-hidden">
                      <img
                        src={article.image}
                        alt={article.titre}
                        className="w-full h-96 object-cover"
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

                    {/* Section conseils (exemple de contenu enrichi) */}
                    {(article.categorie === 'Conseils' || article.slug.includes('conseil')) && (
                      <div className="mt-12 p-6 bg-blue-50 rounded-2xl border border-blue-200">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                          💡 Points Clés à Retenir
                        </h3>
                        <ul className="space-y-3 text-gray-700">
                          <li className="flex items-start">
                            <span className="text-blue-600 mr-3">•</span>
                            Personnalisez chaque lettre de motivation selon l'établissement
                          </li>
                          <li className="flex items-start">
                            <span className="text-blue-600 mr-3">•</span>
                            Mettez en avant vos réalisations spécifiques
                          </li>
                          <li className="flex items-start">
                            <span className="text-blue-600 mr-3">•</span>
                            Structurez votre lettre en 3 parties claires
                          </li>
                          <li className="flex items-start">
                            <span className="text-blue-600 mr-3">•</span>
                            Relisez-vous attentivement pour éviter les fautes
                          </li>
                        </ul>
                      </div>
                    )}
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
                          to={`/actualites/${similarArticle.slug}`}
                          className="block group p-3 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start space-x-3">
                            {similarArticle.image && (
                              <img
                                src={similarArticle.image}
                                alt={similarArticle.titre}
                                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                              />
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
                    Articles Populaires
                  </h3>
                  <div className="space-y-4">
                    {popularArticles.map((popularArticle) => (
                      <Link
                        key={popularArticle.id}
                        to={`/actualites/${popularArticle.slug}`}
                        className="block group p-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          {popularArticle.image && (
                            <img
                              src={popularArticle.image}
                              alt={popularArticle.titre}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            />
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

export default NewDetail;