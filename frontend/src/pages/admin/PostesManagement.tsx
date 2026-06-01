import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import DataTable from "@/components/admin/DataTable";
import Pagination from "@/components/Pagination";
import { useGetAllArticles, useDeleteArticle } from "@/service/articleService";
import { ArticleSummaryResponse } from "@/types/articleType";

const PostesManagement: React.FC = () => {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // On filtre côté serveur par catégorie "POSTES"
  const { data: postesPage, isLoading } = useGetAllArticles({
    page,
    size: 10,
    categorie: "POSTES",
    sortBy: "datePublication",
    sortDirection: "DESC",
  });
  const deleteArticleMutation = useDeleteArticle();
  const navigate = useNavigate();

  const filtered = (postesPage?.content || []).filter(
    (a) =>
      a.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.auteur.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const columns = [
    { key: "titre", label: "Titre" },
    { key: "auteur", label: "Auteur" },
    {
      key: "datePublication",
      label: "Date de publication",
      render: (value: string) =>
        value ? new Date(value).toLocaleDateString("fr-FR") : <span className="text-amame-muted">—</span>,
    },
    {
      key: "vues",
      label: "Vues",
      render: (value: number) => (
        <span className="text-sm text-amame-muted">{value ?? 0}</span>
      ),
    },
  ];

  const handleDelete = (article: ArticleSummaryResponse) => {
    deleteArticleMutation.mutate(article.id);
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-nunito font-bold text-2xl text-amame-charcoal">Postes</h1>
          <p className="mt-1 text-sm text-amame-muted">
            {postesPage?.totalElements ?? 0} poste{(postesPage?.totalElements ?? 0) > 1 ? "s" : ""} publiés
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/admin/postes/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-amame-green hover:bg-amame-green-dark transition-colors shadow-green"
          >
            <PlusIcon className="h-4 w-4" />
            Nouveau poste
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
        data={filtered}
        onEdit={(a) => navigate(`/admin/postes/edit/${a.id}`)}
        onDelete={handleDelete}
        deleteConfirmMessage={(row) => `Le poste "${row.titre}" sera définitivement supprimé.`}
        onView={(a) => window.open(`/articles/${a.slug}`, "_blank")}
        isLoading={isLoading}
      />

      {postesPage && (
        <Pagination
          totalPages={postesPage.totalPages}
          currentPage={postesPage.currentPage}
          hasNext={postesPage.hasNext}
          hasPrevious={postesPage.hasPrevious}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default PostesManagement;
