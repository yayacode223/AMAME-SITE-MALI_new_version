import React, { useState } from "react";
import { Link } from "react-router-dom";
import { PlusIcon, MagnifyingGlassIcon, UserIcon } from "@heroicons/react/24/outline";
import DataTable from "@/components/admin/DataTable";
import Pagination from "@/components/Pagination";
import { useGetAllUsers, useDeleteUserMutation } from "@/service/userService";
import { RegisterResponse, Sexe, Role, ROLE_LABELS } from "@/types/userType";

const url = "https://amame.ml";

const ROLE_COLORS: Record<string, string> = {
  SUPERADMIN: "bg-red-100 text-red-800",
  ADMIN: "bg-purple-100 text-purple-800",
  EDITOR: "bg-blue-100 text-blue-800",
  MEMBER: "bg-teal-100 text-teal-800",
  USER: "bg-gray-100 text-gray-700",
  VISITOR: "bg-yellow-50 text-yellow-700",
};

const UsersManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const { data: usersPage, isLoading } = useGetAllUsers({ page, size: 10 });
  const deleteUserMutation = useDeleteUserMutation();

  const filteredUsers = (usersPage?.content ?? []).filter(
    (u) =>
      u.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const columns = [
    {
      key: "nom",
      label: "Utilisateur",
      render: (_: string, row: RegisterResponse) => (
        <div className="flex items-center gap-3">
          {row.imagePath ? (
            <img
              className="h-9 w-9 rounded-full object-cover shrink-0"
              src={`${url}/${row.imagePath}`}
              alt={`${row.prenom} ${row.nom}`}
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-amame-green-subtle flex items-center justify-center shrink-0">
              <UserIcon className="h-5 w-5 text-amame-green" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-amame-charcoal">{row.prenom} {row.nom}</p>
            <p className="text-xs text-amame-muted">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Rôle",
      render: (value: Role) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[value] ?? "bg-gray-100 text-gray-700"}`}>
          {ROLE_LABELS[value] ?? value}
        </span>
      ),
    },
    {
      key: "sexe",
      label: "Sexe",
      render: (value: Sexe) => (
        <span className="text-sm text-amame-muted">
          {value === "HOMME" ? "Homme" : value === "FEMME" ? "Femme" : "—"}
        </span>
      ),
    },
    {
      key: "ville",
      label: "Localisation",
      render: (value: string, row: RegisterResponse) => (
        <span className="text-sm text-amame-muted">
          {[value, row.pays].filter(Boolean).join(", ") || "—"}
        </span>
      ),
    },
    { key: "niveauEtude", label: "Niveau d'étude" },
    { key: "phone", label: "Téléphone" },
  ];

  const handleDelete = (user: RegisterResponse) => {
    deleteUserMutation.mutate(user.id!);
  };

  return (
    <div>
      {/* En-tête */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-nunito font-bold text-2xl text-amame-charcoal">Utilisateurs</h1>
          <p className="mt-1 text-sm text-amame-muted">
            {usersPage?.totalElements ?? 0} membre{(usersPage?.totalElements ?? 0) > 1 ? "s" : ""} inscrits
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/admin/users/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-amame-green hover:bg-amame-green-dark transition-colors shadow-green"
          >
            <PlusIcon className="h-4 w-4" />
            Nouvel utilisateur
          </Link>
        </div>
      </div>

      {/* Recherche */}
      <div className="mb-5">
        <div className="relative max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amame-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm border border-amame-border rounded-xl focus:outline-none focus:ring-1 focus:ring-amame-green focus:border-amame-green placeholder-amame-muted/60 bg-white"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredUsers}
        onEdit={(u) => (window.location.href = `/admin/users/edit/${u.id}`)}
        onDelete={handleDelete}
        deleteConfirmMessage={(row) => `L'utilisateur "${row.prenom} ${row.nom}" sera définitivement supprimé(e).`}
        onView={(u) => (window.location.href = `/admin/users/${u.id}`)}
        isLoading={isLoading}
        protectSelf
      />

      {usersPage && (
        <Pagination
          totalPages={usersPage.totalPages}
          currentPage={usersPage.currentPage}
          hasNext={usersPage.hasNext}
          hasPrevious={usersPage.hasPrevious}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default UsersManagement;
