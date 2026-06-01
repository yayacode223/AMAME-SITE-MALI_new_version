import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import DataTable from "@/components/admin/DataTable";
import Pagination from "@/components/Pagination";
import { useGetRessourcesAdmin, useDeleteRessource } from "@/service/ressourceAcademiqueService";
import { RessourceAcademique } from "@/types/ressourceAcademiqueType";

const PROD_URL = "https://amame.ml";

const RessourcesManagement: React.FC = () => {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: ressourcesPage, isLoading } = useGetRessourcesAdmin({ page, size: 10 });
  const deleteMutation = useDeleteRessource();
  const navigate = useNavigate();

  const filtered = (ressourcesPage?.content ?? []).filter(
    (r) =>
      r.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.niveau?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const columns = [
    { key: "titre", label: "Titre" },
    {
      key: "type",
      label: "Type",
      render: (v: string) =>
        v ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amame-gold-subtle text-amame-gold border border-amame-gold/20">
            {v}
          </span>
        ) : <span className="text-amame-muted">—</span>,
    },
    { key: "niveau", label: "Niveau" },
    {
      key: "filePath",
      label: "Document",
      render: (v: string) =>
        v ? (
          <a href={`${PROD_URL}/${v}`} target="_blank" rel="noopener noreferrer"
            className="text-amame-green hover:underline text-xs">
            Voir le fichier
          </a>
        ) : <span className="text-amame-muted text-xs">Aucun</span>,
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

  const handleDelete = (r: RessourceAcademique) => {
    deleteMutation.mutate(r.id);
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-nunito font-bold text-2xl text-amame-charcoal">Ressources académiques</h1>
          <p className="mt-1 text-sm text-amame-muted">
            {ressourcesPage?.totalElements ?? 0} ressource{(ressourcesPage?.totalElements ?? 0) > 1 ? "s" : ""} disponibles
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/admin/ressources/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-amame-green hover:bg-amame-green-dark transition-colors shadow-green"
          >
            <PlusIcon className="h-4 w-4" />
            Nouvelle ressource
          </Link>
        </div>
      </div>

      <div className="mb-5">
        <div className="relative max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amame-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par titre, type ou niveau..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm border border-amame-border rounded-xl focus:outline-none focus:ring-1 focus:ring-amame-green focus:border-amame-green placeholder-amame-muted/60 bg-white"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        onEdit={(r) => navigate(`/admin/ressources/edit/${r.id}`)}
        onDelete={handleDelete}
        deleteConfirmMessage={(row) => `La ressource "${row.titre}" sera définitivement supprimée.`}
        isLoading={isLoading}
      />

      {ressourcesPage && (
        <Pagination
          totalPages={ressourcesPage.totalPages}
          currentPage={ressourcesPage.currentPage}
          hasNext={ressourcesPage.hasNext}
          hasPrevious={ressourcesPage.hasPrevious}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default RessourcesManagement;
