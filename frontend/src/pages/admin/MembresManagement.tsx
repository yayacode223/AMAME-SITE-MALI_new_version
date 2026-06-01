import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import DataTable from "@/components/admin/DataTable";
import Pagination from "@/components/Pagination";
import { useGetAllMembresAdmin, useDeleteMembre } from "@/service/membreService";
import { Membre } from "@/types/membreType";

const MembresManagement: React.FC = () => {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: membresPage, isLoading } = useGetAllMembresAdmin({ page, size: 10 });
  const deleteMutation = useDeleteMembre();
  const navigate = useNavigate();

  const filtered = (membresPage?.content ?? []).filter(
    (m) =>
      `${m.prenom} ${m.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.poste?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const columns = [
    {
      key: "nom",
      label: "Nom complet",
      render: (_: string, row: Membre) => (
        <span className="font-medium text-amame-charcoal">{row.prenom} {row.nom}</span>
      ),
    },
    { key: "poste", label: "Poste" },
    { key: "email", label: "Email" },
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

  const handleDelete = (membre: Membre) => {
    deleteMutation.mutate(membre.id);
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-nunito font-bold text-2xl text-amame-charcoal">Membres</h1>
          <p className="mt-1 text-sm text-amame-muted">
            {membresPage?.totalElements ?? 0} membre{(membresPage?.totalElements ?? 0) > 1 ? "s" : ""} de l'association
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/admin/membres/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-amame-green hover:bg-amame-green-dark transition-colors shadow-green"
          >
            <PlusIcon className="h-4 w-4" />
            Nouveau membre
          </Link>
        </div>
      </div>

      <div className="mb-5">
        <div className="relative max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amame-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou poste..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm border border-amame-border rounded-xl focus:outline-none focus:ring-1 focus:ring-amame-green focus:border-amame-green placeholder-amame-muted/60 bg-white"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        onEdit={(m) => navigate(`/admin/membres/edit/${m.id}`)}
        onDelete={handleDelete}
        deleteConfirmMessage={(row) => `Le membre "${row.prenom} ${row.nom}" sera définitivement supprimé(e).`}
        isLoading={isLoading}
      />

      {membresPage && (
        <Pagination
          totalPages={membresPage.totalPages}
          currentPage={membresPage.currentPage}
          hasNext={membresPage.hasNext}
          hasPrevious={membresPage.hasPrevious}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default MembresManagement;
