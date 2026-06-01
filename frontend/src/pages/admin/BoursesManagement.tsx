import React, { useState } from "react";
import { Link } from "react-router-dom";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import DataTable from "@/components/admin/DataTable";
import Pagination from "@/components/Pagination";
import { useGetBourses, useDeleteBourse } from "@/service/bourseService";
import { BourseSummary } from "@/types/bourseType";

const BoursesManagement: React.FC = () => {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: boursesData, isLoading } = useGetBourses({
    page,
    size: 10,
    sortBy: "dateLimite",
    sortDirection: "ASC",
  });
  const deleteBourseMutation = useDeleteBourse();

  const bourses = (boursesData?.bourseSummaryDtos || []).filter(
    (b) =>
      b.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.bailleur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.paysHote?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const columns = [
    { key: "titre", label: "Titre" },
    { key: "bailleur", label: "Bailleur" },
    { key: "paysHote", label: "Pays hôte" },
    { key: "niveau", label: "Niveau" },
    {
      key: "categorie",
      label: "Catégorie",
      render: (value: string) =>
        value ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amame-green-subtle text-amame-green-dark">
            {value}
          </span>
        ) : <span className="text-amame-muted">—</span>,
    },
    {
      key: "dateLimite",
      label: "Date limite",
      render: (value: string) => {
        if (!value) return <span className="text-amame-muted">—</span>;
        const date = new Date(value);
        const isExpired = date < new Date();
        return (
          <span className={`text-sm ${isExpired ? "text-red-500" : "text-amame-charcoal"}`}>
            {date.toLocaleDateString("fr-FR")}
          </span>
        );
      },
    },
  ];

  const handleDelete = (bourse: BourseSummary) => {
    deleteBourseMutation.mutate(bourse.id);
  };

  return (
    <div>
      {/* En-tête */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-nunito font-bold text-2xl text-amame-charcoal">Bourses</h1>
          <p className="mt-1 text-sm text-amame-muted">
            {boursesData?.totalElements ?? 0} bourse{(boursesData?.totalElements ?? 0) > 1 ? "s" : ""} disponibles
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/admin/bourses/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-amame-green hover:bg-amame-green-dark transition-colors shadow-green"
          >
            <PlusIcon className="h-4 w-4" />
            Nouvelle bourse
          </Link>
        </div>
      </div>

      {/* Recherche */}
      <div className="mb-5">
        <div className="relative max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amame-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par titre, bailleur ou pays..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm border border-amame-border rounded-xl focus:outline-none focus:ring-1 focus:ring-amame-green focus:border-amame-green placeholder-amame-muted/60 bg-white"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={bourses}
        onEdit={(b) => (window.location.href = `/admin/bourses/edit/${b.id}`)}
        onDelete={handleDelete}
        deleteConfirmMessage={(row) => `La bourse "${row.titre}" sera définitivement supprimée.`}
        onView={(b) => window.open(`/bourses/${b.id}`, "_blank")}
        isLoading={isLoading}
      />

      {boursesData && (
        <Pagination
          totalPages={boursesData.totalPages}
          currentPage={boursesData.currentPage}
          hasNext={boursesData.hasNext}
          hasPrevious={boursesData.hasPrevious}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default BoursesManagement;
