import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import DataTable from "@/components/admin/DataTable";
import Pagination from "@/components/Pagination";
import { useGetAllGaleriesAdmin, useDeleteGalerie } from "@/service/galerieService";
import { GalerieSummary } from "@/types/galerieType";

const GaleriesManagement: React.FC = () => {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: galeriesPage, isLoading } = useGetAllGaleriesAdmin({ page, size: 10 });
  const deleteGalerieMutation = useDeleteGalerie();
  const navigate = useNavigate();

  const filtered = (galeriesPage?.content ?? []).filter(
    (g) =>
      g.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.lieu?.toLowerCase() ?? "").includes(searchTerm.toLowerCase()),
  );

  const columns = [
    { key: "titre", label: "Titre" },
    { key: "lieu", label: "Lieu" },
    {
      key: "dateEvenement",
      label: "Date événement",
      render: (value: string) =>
        value ? new Date(value).toLocaleDateString("fr-FR") : <span className="text-amame-muted">—</span>,
    },
    {
      key: "dateCreation",
      label: "Créé le",
      render: (value: string) =>
        value ? new Date(value).toLocaleDateString("fr-FR") : <span className="text-amame-muted">—</span>,
    },
    {
      key: "estPublie",
      label: "Statut",
      render: (value: boolean) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${value ? "bg-amame-green-light text-amame-green-dark" : "bg-amame-gold-subtle text-amame-gold"}`}>
          {value ? "Publié" : "Brouillon"}
        </span>
      ),
    },
  ];

  const handleDelete = (galerie: GalerieSummary) => {
    deleteGalerieMutation.mutate(galerie.id);
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-nunito font-bold text-2xl text-amame-charcoal">Galeries</h1>
          <p className="mt-1 text-sm text-amame-muted">
            {galeriesPage?.totalElements ?? 0} album{(galeriesPage?.totalElements ?? 0) > 1 ? "s" : ""} photos
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/admin/galeries/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-amame-green hover:bg-amame-green-dark transition-colors shadow-green"
          >
            <PlusIcon className="h-4 w-4" />
            Nouvelle galerie
          </Link>
        </div>
      </div>

      <div className="mb-5">
        <div className="relative max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amame-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par titre ou lieu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm border border-amame-border rounded-xl focus:outline-none focus:ring-1 focus:ring-amame-green focus:border-amame-green placeholder-amame-muted/60 bg-white"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        onEdit={(g) => navigate(`/admin/galeries/edit/${g.id}`)}
        onDelete={handleDelete}
        deleteConfirmMessage={(row) => `La galerie "${row.titre}" sera définitivement supprimée.`}
        isLoading={isLoading}
      />

      {galeriesPage && (
        <Pagination
          totalPages={galeriesPage.totalPages}
          currentPage={galeriesPage.currentPage}
          hasNext={galeriesPage.hasNext}
          hasPrevious={galeriesPage.hasPrevious}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default GaleriesManagement;
