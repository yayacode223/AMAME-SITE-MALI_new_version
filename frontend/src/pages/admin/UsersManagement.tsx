import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';
import DataTable from '@/components/admin/DataTable';
import { useGetAllUsers, useDeleteUserMutation } from '@/service/userService';
import { RegisterResponse, Sexe, Role } from '@/types/userType';


const url = import.meta.env.VITE_API_BASE_URL

const UsersManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: users, isLoading } = useGetAllUsers({ enabled: true });
  const deleteUserMutation = useDeleteUserMutation();

  const filteredUsers = users?.filter(user =>
    user.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getSexeLabel = (sexe: Sexe) => {
    return sexe === 'HOMME' ? 'Homme' : 'Femme';
  };

  const columns = [
    { 
      key: 'nom', 
      label: 'Utilisateur',
      render: (value: string, row: RegisterResponse) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            {row.imagePath ? (
              <img
                className="h-10 w-10 rounded-full"
                src={`${url}/${row.imagePath}`}
                alt={`${row.prenom} ${row.nom}`}
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-gray-600" />
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {row.prenom} {row.nom}
            </div>
            <div className="text-sm text-gray-500">{row.email}</div>
          </div>
        </div>
      )
    },
    { 
      key: 'sexe', 
      label: 'Sexe',
      render: (value: Sexe) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {getSexeLabel(value)}
        </span>
      )
    },
    { 
      key: 'role', 
      label: 'Rôle',
      render: (value: Role) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    },
    { 
      key: 'ville', 
      label: 'Localisation',
      render: (value: string, row: RegisterResponse) => (
        <div>
          <div className="text-sm text-gray-900">{value || 'Non renseigné'}</div>
          {row.pays && (
            <div className="text-sm text-gray-500">{row.pays}</div>
          )}
        </div>
      )
    },
    { 
      key: 'niveauEtude', 
      label: 'Niveau d\'étude',
      render: (value: string) => (
        <span className="text-sm text-gray-900">{value || 'Non renseigné'}</span>
      )
    },
    { 
      key: 'phone', 
      label: 'Téléphone',
      render: (value: string) => (
        <span className="text-sm text-gray-900">{value || 'Non renseigné'}</span>
      )
    },
  ];

  const handleDelete = (user: RegisterResponse) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.prenom} ${user.nom}" ?`)) {
      deleteUserMutation.mutate(user.id!);
    }
  };

  const handleEdit = (user: RegisterResponse) => {
    window.location.href = `/admin/users/edit/${user.id}`;
  };

  const handleView = (user: RegisterResponse) => {
    window.location.href = `/admin/users/${user.id}`;
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gestion des utilisateurs</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gérez les comptes utilisateurs de la plateforme
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/admin/users/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nouvel utilisateur
          </Link>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Filtres */}
           {/* <div className="flex gap-2">
            <select
              title="Filtrer par rôle"
              aria-label="Filtrer par rôle"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              onChange={(e) => {
                // Implémentez le filtrage par rôle si nécessaire
              }}
            >
              <option value="">Tous les rôles</option>
              <option value="ADMIN">Administrateur</option>
              <option value="USER">Utilisateur</option>
            </select>
            
            <select
              title="Filtrer par sexe"
              aria-label="Filtrer par sexe"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              onChange={(e) => {
                // Implémentez le filtrage par sexe si nécessaire
              }}
            >
              <option value="">Tous les sexes</option>
              <option value="MASCULIN">Masculin</option>
              <option value="FEMININ">Féminin</option>
            </select>
          </div>  */}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredUsers}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        isLoading={isLoading}
      />
    </div>
  );
};

export default UsersManagement;