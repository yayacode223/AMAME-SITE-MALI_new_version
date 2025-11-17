// src/utils/articleAdapter.ts
import { ArticleSummaryResponse, ArticleDetailResponse } from  '../service/articleService';

// Adapter les données du backend pour le composant News
export const adaptArticleForNews = (article: ArticleSummaryResponse) => ({
  id: article.id.toString(),
  titre: article.titre,
  slug: article.slug,
  contenu: article.resume,
  auteur: article.auteur,
  categorie: article.categorie,
  date_publication: article.datePublication,
  image: article.imageUrl,
  vues: article.vues,
  temps_lecture: article.tempsLecture
});

// Adapter les données du backend pour le détail d'article
export const adaptArticleForDetail = (article: ArticleDetailResponse) => ({
  id: article.id.toString(),
  titre: article.titre,
  slug: article.slug,
  contenu: article.contenu,
  auteur: article.auteur,
  categorie: article.categorie,
  date_publication: article.datePublication,
  image: article.imageUrl,
  vues: article.vues,
  temps_lecture: article.tempsLecture,
  tags: article.tags,
  metaDescription: article.metaDescription
});

// Générer les catégories pour les filtres
export const generateCategoriesFromData = (categoriesData: Record<string, number>) => {
  const total = Object.values(categoriesData).reduce((sum, count) => sum + count, 0);
  
  return [
    { id: 'all', label: 'Toutes les catégories', count: total },
    ...Object.entries(categoriesData).map(([categorie, count]) => ({
      id: categorie,
      label: categorie,
      count
    }))
  ];
};