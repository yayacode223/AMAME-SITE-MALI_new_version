// pages/admin/ConcoursManagement.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import DataTable from '@/components/admin/DataTable';
import { useConcoursLists, useDeleteConcours} from '@/service/concoursService';
import {ConcoursResponse} from '@/types/concoursType'; 

const ConcoursManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useState({
    page: 0,
    size: 50,
    sortBy: 'dateLimite',
    sortDirection: 'ASC'
  });
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: concoursData, isLoading } = useConcoursLists(searchParams);
  const deleteConcoursMutation = useDeleteConcours();

  const concours = concoursData?.concours || [];

  const filteredConcours = concours.filter(item =>
    item.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.pays.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: 'nom', label: 'Nom du concours' },
    { key: 'pays', label: 'Pays' },
    { key: 'niveau', label: 'Niveau' },
    { key: 'status', label: 'Statut' },
    { 
      key: 'dateLimite', 
      label: 'Date limite',
      render: (value: string) => new Date(value).toLocaleDateString('fr-FR')
    },
    { 
      key: 'isAvailable', 
      label: 'Disponible',
      render: (value: boolean) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Oui' : 'Non'}
        </span>
      )
    },
  ];

  const handleDelete = (concours: ConcoursResponse) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le concours "${concours.nom}" ?`)) {
      deleteConcoursMutation.mutate(concours.id);
    }
  };

  const handleEdit = (concours: ConcoursResponse) => {
    window.location.href = `/admin/concours/edit/${concours.id}`;
  };

  const handleView = (concours: ConcoursResponse) => {
    window.open(`/concours/${concours.id}`, '_blank');
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gestion des concours</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gérez les concours et examens nationaux/internationaux
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/admin/concours/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nouveau concours
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
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="Rechercher un concours..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Filtres */}
          <div className="flex gap-2">
            <select
              aria-label="Filtrer par niveau"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
              onChange={(e) => setSearchParams(prev => ({ ...prev, niveau: e.target.value as any }))}
            >
              <option value="">Tous les niveaux</option>
              <option value="BACHELIER">Bachelier</option>
              <option value="LICENCE">Licence</option>
              <option value="MASTER">Master</option>
              <option value="DOCTORAT">Doctorat</option>
            </select>
            
            <select
              aria-label="Filtrer par statut"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
              onChange={(e) => setSearchParams(prev => ({ ...prev, status: e.target.value as any }))}
            >
              <option value="">Tous les statuts</option>
              <option value="NATIONAL">National</option>
              <option value="INTERNATIONAL">International</option>
            </select>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredConcours}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ConcoursManagement;