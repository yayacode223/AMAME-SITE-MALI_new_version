import React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, Search, Filter, Clock, Eye} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { useSearchArticles, useGetCategoriesWithCount, useGetPopularArticles, useGetArticlesByCategorie } from '../service/articleService';
import { adaptArticleForNews, generateCategoriesFromData } from '@/utils/articleAdapter';

const url = import.meta.env.VITE_API_BASE_URL; 

export function Articles() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Récupérer les articles avec recherche/filtre
  const { 
    data: articlesData, 
    isLoading: articlesLoading, 
    error: articlesError 
  } = useSearchArticles({
    search: searchTerm,
    categorie: selectedCategory === 'all' ? undefined : selectedCategory,
    sortBy
  });

  // Récupérer les articles par catégorie
  const { 
    data: articlesByCategorieData, 
    isLoading: articlesByCategorieLoading 
  } = useGetArticlesByCategorie(selectedCategory === 'all' ? undefined : selectedCategory);

  // Récupérer les catégories avec comptes
  const { 
    data: categoriesData, 
    isLoading: categoriesLoading 
  } = useGetCategoriesWithCount();

  // Récupérer les articles populaires
  const { 
    data: popularArticlesData 
  } = useGetPopularArticles();

  // Adapter les données pour le frontend
  const filteredArticles = articlesData?.map(adaptArticleForNews) || [];
  const categoriesArticles = articlesByCategorieData?.map(adaptArticleForNews) || [];

  // Générer les catégories pour les filtres
  const categories = categoriesData 
    ? generateCategoriesFromData(categoriesData)
    : [];

  const popularArticles = popularArticlesData?.map(adaptArticleForNews) || [];

  const displayedArticles = selectedCategory === 'all' ? filteredArticles : categoriesArticles;

  const getCategoryColor = (category) => {
    const colors = {
      'Conseils': 'emerald',
      'Orientation': 'blue',
      'Bourses': 'amber',
      'Concours': 'purple',
      'Témoignages': 'pink'
    };
    return colors[category] || 'gray';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  if (articlesLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-purple-500 to-blue-500 text-white py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h1 
              className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Actualités & <span className="text-yellow-300">Conseils</span>
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Restez informé des dernières opportunités et découvrez nos conseils pour réussir votre parcours académique
            </motion.p>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="bg-white rounded-2xl shadow-lg p-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="flex-1 w-full">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      type="text"
                      placeholder="Rechercher des articles, conseils..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-12 text-lg border-2 border-gray-200 focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <select
                      aria-label="Filtrer par catégorie"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full lg:w-48 h-12 pl-10 pr-4 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors appearance-none bg-white"
                    >
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.label} ({category.count})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main Content */}
              <motion.div 
                className="lg:col-span-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Articles Récents
                  </h2>
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    {displayedArticles.length} article{displayedArticles.length > 1 ? 's' : ''}
                  </Badge>
                </div>

                {displayedArticles.length === 0 ? (
                  <Card className="p-12 text-center">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Aucun article trouvé
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Essayez de modifier vos critères de recherche ou explorez toutes les catégories.
                    </p>
                    <Button 
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('all');
                      }}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Voir tous les articles
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-8">
                    {displayedArticles.map((article) => (
                      <motion.div key={article.id} variants={itemVariants}>
                        <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                          <div className="md:flex">
                            {article.filePath && (
                              <div className="md:w-80 md:flex-shrink-0 relative overflow-hidden">
                                <img
                                  src={`${url}/${article.filePath}`}
                                  alt={article.titre}
                                  className="w-full h-64 md:h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute top-4 left-4">
                                  <Badge className={`bg-${getCategoryColor(article.categorie)}-100 text-${getCategoryColor(article.categorie)}-800 border-0`}>
                                    {article.categorie}
                                  </Badge>
                                </div>
                              </div>
                            )}
                            <div className="p-6 flex-1 flex flex-col">
                              <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors line-clamp-2">
                                  {article.titre}
                                </h2>
                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 flex-wrap">
                                  <div className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    <span>{article.auteur}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                      {new Date(article.date_publication).toLocaleDateString('fr-FR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                      })}
                                    </span>
                                  </div>
                                  {article.vues && (
                                    <div className="flex items-center gap-1">
                                      <Eye className="h-4 w-4" />
                                      <span>{article.vues} vues</span>
                                    </div>
                                  )}
                                  {article.temps_lecture && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      <span>{article.temps_lecture} min</span>
                                    </div>
                                  )}
                                </div>
                                <p className="text-gray-700 mb-6 line-clamp-3 leading-relaxed">
                                  {article.contenu}
                                </p>
                              </div>
                              
                              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <Link
                                  to={`/articles/${article.slug}`}
                                  className="text-purple-600 hover:text-purple-700 font-semibold inline-flex items-center gap-2 group/link"
                                >
                                  Lire l'article
                                  <span className="group-hover/link:translate-x-1 transition-transform">→</span>
                                </Link>
                                
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Sidebar */}
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                {/* Categories */}
                <Card className="p-6 border-0 shadow-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Filter className="h-5 w-5 mr-2 text-purple-600" />
                    Catégories
                  </h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex justify-between items-center ${
                          selectedCategory === category.id
                            ? 'bg-purple-100 text-purple-700 font-semibold'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span>{category.label}</span>
                        <Badge variant="secondary" className="text-xs">
                          {category.count}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </Card>

                {/* Popular Articles */}
                <Card className="p-6 border-0 shadow-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Eye className="h-5 w-5 mr-2 text-amber-600" />
                    Articles Populaires
                  </h3>
                  <div className="space-y-4">
                    {popularArticles.map((article) => (
                      <Link
                        key={article.id}
                        to={`/actualites/${article.slug}`}
                        className="block group p-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          {article.filePath && (
                            <img
                              src={`${url}/${article.filePath}`}
                              alt={article.titre}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 mb-1 line-clamp-2 text-sm leading-tight">
                              {article.titre}
                            </h4>
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(article.date_publication).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short'
                              })}
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

export default Articles;