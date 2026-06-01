import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import DataTable from "@/components/admin/DataTable";
import Pagination from "@/components/Pagination";
import { useGetEtablissementsAdmin, useDeleteEtablissement, EtablissementResponse } from "@/service/etablissementService";

const UniversitesManagement: React.FC = () => {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: etablissementsPage, isLoading } = useGetEtablissementsAdmin({ page, size: 10 });
  const deleteMutation = useDeleteEtablissement();
  const navigate = useNavigate();

  const filtered = (etablissementsPage?.content ?? []).filter(
    (e) =>
      e.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.lieu?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.typeEtablissement?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const columns = [
    { key: "nom", label: "Nom" },
    {
      key: "typeEtablissement",
      label: "Type",
      render: (v: string) =>
        v ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            {v}
          </span>
        ) : <span className="text-amame-muted">—</span>,
    },
    { key: "lieu", label: "Lieu" },
    {
      key: "urlDetailEtablissement",
      label: "Lien détail",
      render: (v: string) =>
        v ? (
          <a href={v} target="_blank" rel="noopener noreferrer"
            className="text-amame-green hover:underline text-xs truncate block max-w-[200px]">
            {v}
          </a>
        ) : <span className="text-amame-muted">—</span>,
    },
  ];

  const handleDelete = (etab: EtablissementResponse) => {
    deleteMutation.mutate(etab.id);
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-nunito font-bold text-2xl text-amame-charcoal">Universités & Établissements</h1>
          <p className="mt-1 text-sm text-amame-muted">
            {etablissementsPage?.totalElements ?? 0} établissement{(etablissementsPage?.totalElements ?? 0) > 1 ? "s" : ""} référencés
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/admin/universites/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-amame-green hover:bg-amame-green-dark transition-colors shadow-green"
          >
            <PlusIcon className="h-4 w-4" />
            Nouvel établissement
          </Link>
        </div>
      </div>

      <div className="mb-5">
        <div className="relative max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amame-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par nom, type ou lieu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm border border-amame-border rounded-xl focus:outline-none focus:ring-1 focus:ring-amame-green focus:border-amame-green placeholder-amame-muted/60 bg-white"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        onEdit={(e) => navigate(`/admin/universites/edit/${e.id}`)}
        onDelete={handleDelete}
        deleteConfirmMessage={(row) => `L'établissement "${row.nom}" sera définitivement supprimé.`}
        isLoading={isLoading}
      />

      {etablissementsPage && (
        <Pagination
          totalPages={etablissementsPage.totalPages}
          currentPage={etablissementsPage.currentPage}
          hasNext={etablissementsPage.hasNext}
          hasPrevious={etablissementsPage.hasPrevious}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default UniversitesManagement;
