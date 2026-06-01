import React, { useState } from "react";
import { Link } from "react-router-dom";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import DataTable from "@/components/admin/DataTable";
import Pagination from "@/components/Pagination";
import { useConcoursLists, useDeleteConcours } from "@/service/concoursService";
import { ConcoursResponse } from "@/types/concoursType";

const ConcoursManagement: React.FC = () => {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNiveau, setFilterNiveau] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const { data: concoursData, isLoading } = useConcoursLists({
    page,
    size: 10,
    sortBy: "dateLimite",
    sortDirection: "ASC",
  });
  const deleteConcoursMutation = useDeleteConcours();

  const filteredConcours = (concoursData?.concours || []).filter((item) => {
    const matchText =
      item.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.pays.toLowerCase().includes(searchTerm.toLowerCase());
    const matchNiveau = filterNiveau ? item.niveau === filterNiveau : true;
    const matchStatus = filterStatus ? item.status === filterStatus : true;
    return matchText && matchNiveau && matchStatus;
  });

  const columns = [
    { key: "nom", label: "Nom du concours" },
    { key: "pays", label: "Pays" },
    {
      key: "niveau",
      label: "Niveau",
      render: (value: string) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          {value}
        </span>
      ),
    },
    {
      key: "status",
      label: "Statut",
      render: (value: string) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${value === "INTERNATIONAL" ? "bg-amame-gold-subtle text-amame-gold border border-amame-gold/20" : "bg-gray-100 text-gray-600"}`}>
          {value}
        </span>
      ),
    },
    {
      key: "dateLimite",
      label: "Date limite",
      render: (value: string) => {
        const date = new Date(value);
        const isExpired = date < new Date();
        return (
          <span className={`text-sm ${isExpired ? "text-red-500" : "text-amame-charcoal"}`}>
            {date.toLocaleDateString("fr-FR")}
          </span>
        );
      },
    },
    {
      key: "isAvailable",
      label: "Disponible",
      render: (value: boolean) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${value ? "bg-amame-green-light text-amame-green-dark" : "bg-red-50 text-red-700"}`}>
          {value ? "Oui" : "Non"}
        </span>
      ),
    },
  ];

  const handleDelete = (concours: ConcoursResponse) => {
    deleteConcoursMutation.mutate(concours.id);
  };

  return (
    <div>
      {/* En-tête */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-nunito font-bold text-2xl text-amame-charcoal">Concours</h1>
          <p className="mt-1 text-sm text-amame-muted">
            {concoursData?.totalElements ?? 0} concours enregistrés
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/admin/concours/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-amame-green hover:bg-amame-green-dark transition-colors shadow-green"
          >
            <PlusIcon className="h-4 w-4" />
            Nouveau concours
          </Link>
        </div>
      </div>

      {/* Recherche + filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amame-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par nom ou pays..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm border border-amame-border rounded-xl focus:outline-none focus:ring-1 focus:ring-amame-green focus:border-amame-green placeholder-amame-muted/60 bg-white"
          />
        </div>
        <select
          value={filterNiveau}
          onChange={(e) => setFilterNiveau(e.target.value)}
          className="py-2 pl-3 pr-8 text-sm border border-amame-border rounded-xl focus:outline-none focus:ring-1 focus:ring-amame-green focus:border-amame-green bg-white text-amame-charcoal"
        >
          <option value="">Tous les niveaux</option>
          <option value="BACHELIER">Bachelier</option>
          <option value="LICENCE">Licence</option>
          <option value="MASTER">Master</option>
          <option value="DOCTORAT">Doctorat</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="py-2 pl-3 pr-8 text-sm border border-amame-border rounded-xl focus:outline-none focus:ring-1 focus:ring-amame-green focus:border-amame-green bg-white text-amame-charcoal"
        >
          <option value="">Tous les statuts</option>
          <option value="NATIONAL">National</option>
          <option value="INTERNATIONAL">International</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filteredConcours}
        onEdit={(c) => (window.location.href = `/admin/concours/edit/${c.id}`)}
        onDelete={handleDelete}
        deleteConfirmMessage={(row) => `Le concours "${row.nom}" sera définitivement supprimé.`}
        onView={(c) => window.open(`/concours/${c.id}`, "_blank")}
        isLoading={isLoading}
      />

      {concoursData && (
        <Pagination
          totalPages={concoursData.totalPages}
          currentPage={concoursData.currentPage}
          hasNext={concoursData.hasNext}
          hasPrevious={concoursData.hasPrevious}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default ConcoursManagement;
