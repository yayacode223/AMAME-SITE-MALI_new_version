import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import DataTable from "@/components/admin/DataTable";
import Pagination from "@/components/Pagination";
import { useGetLiensUtilesAdmin, useDeleteLienUtile } from "@/service/lienUtileService";
import { LienUtile } from "@/types/lienUtileType";

const LiensUtilesManagement: React.FC = () => {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: liensPage, isLoading } = useGetLiensUtilesAdmin({ page, size: 10 });
  const deleteMutation = useDeleteLienUtile();
  const navigate = useNavigate();

  const filtered = (liensPage?.content ?? []).filter(
    (l) =>
      l.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.categorie?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const columns = [
    { key: "titre", label: "Titre" },
    {
      key: "categorie",
      label: "Catégorie",
      render: (v: string) =>
        v ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            {v}
          </span>
        ) : <span className="text-amame-muted">—</span>,
    },
    {
      key: "url",
      label: "URL",
      render: (v: string) =>
        v ? (
          <a href={v} target="_blank" rel="noopener noreferrer"
            className="text-amame-green hover:underline text-xs truncate block max-w-[200px]">
            {v}
          </a>
        ) : <span className="text-amame-muted">—</span>,
    },
    { key: "ordre", label: "Ordre" },
    {
      key: "isActif",
      label: "Statut",
      render: (v: boolean) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${v ? "bg-amame-green-light text-amame-green-dark" : "bg-gray-100 text-gray-600"}`}>
          {v ? "Actif" : "Inactif"}
        </span>
      ),
    },
  ];

  const handleDelete = (lien: LienUtile) => {
    deleteMutation.mutate(lien.id);
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-nunito font-bold text-2xl text-amame-charcoal">Liens utiles</h1>
          <p className="mt-1 text-sm text-amame-muted">
            {liensPage?.totalElements ?? 0} lien{(liensPage?.totalElements ?? 0) > 1 ? "s" : ""} référencés
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/admin/liens-utiles/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-amame-green hover:bg-amame-green-dark transition-colors shadow-green"
          >
            <PlusIcon className="h-4 w-4" />
            Nouveau lien
          </Link>
        </div>
      </div>

      <div className="mb-5">
        <div className="relative max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amame-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par titre ou catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm border border-amame-border rounded-xl focus:outline-none focus:ring-1 focus:ring-amame-green focus:border-amame-green placeholder-amame-muted/60 bg-white"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        onEdit={(l) => navigate(`/admin/liens-utiles/edit/${l.id}`)}
        onDelete={handleDelete}
        deleteConfirmMessage={(row) => `Le lien "${row.titre}" sera définitivement supprimé.`}
        isLoading={isLoading}
      />

      {liensPage && (
        <Pagination
          totalPages={liensPage.totalPages}
          currentPage={liensPage.currentPage}
          hasNext={liensPage.hasNext}
          hasPrevious={liensPage.hasPrevious}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default LiensUtilesManagement;
