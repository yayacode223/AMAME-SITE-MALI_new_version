// pages/admin/ArticlesManagement.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import DataTable from '@/components/admin/DataTable';
import { useGetAllArticles, useDeleteArticle} from '../../service/articleService';
import {ArticleSummaryResponse } from "@/types/articleType"; 
const ArticlesManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: articles, isLoading } = useGetAllArticles();
  const deleteArticleMutation = useDeleteArticle();
  const navigate = useNavigate(); 

  const filteredArticles = articles?.filter(article =>
    article.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.auteur.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const columns = [
    { key: 'titre', label: 'Titre' },
    { key: 'auteur', label: 'Auteur' },
    { key: 'categorie', label: 'Catégorie' },
    { 
      key: 'datePublication', 
      label: 'Date de publication',
      render: (value: string) => new Date(value).toLocaleDateString('fr-FR')
    },
    { 
      key: 'estPublie', 
      label: 'Statut',
      render: (value: boolean) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {value ? 'Publié' : 'Brouillon'}
        </span>
      )
    },
  ];

  const handleDelete = (article: ArticleSummaryResponse) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'article "${article.titre}" ?`)) {
      deleteArticleMutation.mutate(article.id);
    }
  };

  const handleEdit = (article: ArticleSummaryResponse) => {
    // Navigation vers la page d'édition
    window.location.href = `/admin/articles/edit/${article.id}`;
  };

  const handleView = (article: ArticleSummaryResponse) => {
    // Navigation vers la page de détail publique
    window.open(`/articles/${article.slug}`, '_blank');
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gestion des articles</h1>
          <p className="mt-2 text-sm text-gray-700">
            Créez et gérez les articles de votre blog
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/admin/articles/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nouvel article
          </Link>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Rechercher un article..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tableau des articles */}
      <DataTable
        columns={columns}
        data={filteredArticles}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ArticlesManagement;