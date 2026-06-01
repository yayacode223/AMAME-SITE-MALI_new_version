import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import DataTable from "@/components/admin/DataTable";
import Pagination from "@/components/Pagination";
import { useGetAllPartenairesAdmin, useDeletePartenaire } from "@/service/partenaireService";
import { Partenaire } from "@/types/partenaireType";

const PartenairesManagement: React.FC = () => {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: partenairesPage, isLoading } = useGetAllPartenairesAdmin({ page, size: 10 });
  const deleteMutation = useDeletePartenaire();
  const navigate = useNavigate();

  const filtered = (partenairesPage?.content ?? []).filter(
    (p) =>
      p.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.type?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const columns = [
    { key: "nom", label: "Nom" },
    {
      key: "type",
      label: "Type",
      render: (value: string) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          {value || "—"}
        </span>
      ),
    },
    {
      key: "siteWeb",
      label: "Site web",
      render: (v: string) =>
        v ? (
          <a href={v} target="_blank" rel="noopener noreferrer"
            className="text-amame-green hover:underline text-xs truncate block max-w-[180px]">
            {v}
          </a>
        ) : <span className="text-amame-muted">—</span>,
    },
    { key: "ordre", label: "Ordre" },
    {
      key: "isActif",
      label: "Statut",
      render: (value: boolean) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${value ? "bg-amame-green-light text-amame-green-dark" : "bg-gray-100 text-gray-600"}`}>
          {value ? "Actif" : "Inactif"}
        </span>
      ),
    },
  ];

  const handleDelete = (partenaire: Partenaire) => {
    deleteMutation.mutate(partenaire.id);
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-nunito font-bold text-2xl text-amame-charcoal">Partenaires</h1>
          <p className="mt-1 text-sm text-amame-muted">
            {partenairesPage?.totalElements ?? 0} partenaire{(partenairesPage?.totalElements ?? 0) > 1 ? "s" : ""} et collaborateurs
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/admin/partenaires/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-amame-green hover:bg-amame-green-dark transition-colors shadow-green"
          >
            <PlusIcon className="h-4 w-4" />
            Nouveau partenaire
          </Link>
        </div>
      </div>

      <div className="mb-5">
        <div className="relative max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amame-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par nom ou type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm border border-amame-border rounded-xl focus:outline-none focus:ring-1 focus:ring-amame-green focus:border-amame-green placeholder-amame-muted/60 bg-white"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        onEdit={(p) => navigate(`/admin/partenaires/edit/${p.id}`)}
        onDelete={handleDelete}
        deleteConfirmMessage={(row) => `Le partenaire "${row.nom}" sera définitivement supprimé.`}
        isLoading={isLoading}
      />

      {partenairesPage && (
        <Pagination
          totalPages={partenairesPage.totalPages}
          currentPage={partenairesPage.currentPage}
          hasNext={partenairesPage.hasNext}
          hasPrevious={partenairesPage.hasPrevious}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default PartenairesManagement;
