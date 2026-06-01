import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import DataTable from "@/components/admin/DataTable";
import {
  useGetAdminArticles,
  useDeleteArticle,
} from "../../service/articleService";
import { ArticleSummaryResponse } from "@/types/articleType";
const ArticlesManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: articles, isLoading } = useGetAdminArticles();
  const deleteArticleMutation = useDeleteArticle();
  const navigate = useNavigate();

  const filteredArticles =
    (articles?.content || []).filter(
      (article) =>
        article.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.auteur.toLowerCase().includes(searchTerm.toLowerCase()),
    );

  const columns = [
    { key: "titre", label: "Titre" },
    { key: "auteur", label: "Auteur" },
    { key: "categorie", label: "Catégorie" },
    {
      key: "datePublication",
      label: "Date de publication",
      render: (value: string) => new Date(value).toLocaleDateString("fr-FR"),
    },
    {
      key: "estPublie",
      label: "Statut",
      render: (value: boolean) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            value
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {value ? "Publié" : "Brouillon"}
        </span>
      ),
    },
  ];

  const handleDelete = (article: ArticleSummaryResponse) => {
    deleteArticleMutation.mutate(article.id);
  };

  const handleEdit = (article: ArticleSummaryResponse) => {
    // Navigation vers la page d'édition
    window.location.href = `/admin/articles/edit/${article.id}`;
  };

  const handleView = (article: ArticleSummaryResponse) => {
    // Navigation vers la page de détail publique
    window.open(`/articles/${article.slug}`, "_blank");
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-nunito font-bold text-2xl text-amame-charcoal">Articles</h1>
          <p className="mt-1 text-sm text-amame-muted">
            {articles?.totalElements ?? 0} article{(articles?.totalElements ?? 0) > 1 ? "s" : ""} au total
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/admin/articles/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-amame-green hover:bg-amame-green-dark transition-colors shadow-green"
          >
            <PlusIcon className="h-4 w-4" />
            Nouvel article
          </Link>
        </div>
      </div>

      <div className="mb-5">
        <div className="relative max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amame-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par titre ou auteur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm border border-amame-border rounded-xl focus:outline-none focus:ring-1 focus:ring-amame-green focus:border-amame-green placeholder-amame-muted/60 bg-white"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredArticles}
        onEdit={handleEdit}
        onDelete={handleDelete}
        deleteConfirmMessage={(row) => `L'article "${row.titre}" sera définitivement supprimé.`}
        onView={handleView}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ArticlesManagement;
