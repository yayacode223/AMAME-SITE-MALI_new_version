// pages/admin/FilieresManagement.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import DataTable from '@/components/admin/DataTable';
import { useGetAllFilieres, useDeleteFiliere} from '@/service/orientationService';
import {FiliereSummaryResponse, DomaineFiliereType} from '@/types/orientationType'; 

const FilieresManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomaine, setSelectedDomaine] = useState<DomaineFiliereType | ''>('');
  
  const { data: filieres, isLoading } = useGetAllFilieres();
  const deleteFiliereMutation = useDeleteFiliere();

  const filteredFilieres = filieres?.filter(filiere =>
    (filiere.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
     filiere.descriptionCourte.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedDomaine === '' || filiere.domaine === selectedDomaine)
  ) || [];

  const getDomaineLabel = (domaine: DomaineFiliereType) => {
    const domaines: Record<DomaineFiliereType, string> = {
      ALL: "Tous domaines",
      SCIENCES_ET_TECHNOLOGIES: "Sciences & Technologies",
      SCIENCES_DE_LA_SANTE: "Sciences de la Santé",
      SCIENCES_ECONOMIQUES_ET_GESTION: "Sciences Économiques & Gestion",
      DROIT_ET_SCIENCES_POLITIQUES: "Droit & Sciences Politiques",
      LETTRES_ET_SCIENCES_HUMAINES: "Lettres & Sciences Humaines",
      ARTS_ET_COMMUNICATION: "Arts & Communication"
    };
    return domaines[domaine];
  };

  const getDifficulteLabel = (difficulte: string) => {
    const difficultes: Record<string, string> = {
      TRES_ELEVEE: "Très élevée",
      ELEVEE: "Élevée",
      MOYENNE: "Moyenne",
      VARIABLE: "Variable"
    };
    return difficultes[difficulte] || difficulte;
  };

  const columns = [
    { key: 'nom', label: 'Nom de la filière' },
    { 
      key: 'domaine', 
      label: 'Domaine',
      render: (value: DomaineFiliereType) => getDomaineLabel(value)
    },
    { 
      key: 'difficulte', 
      label: 'Difficulté',
      render: (value: string) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value === 'TRES_ELEVEE' ? 'bg-red-100 text-red-800' :
          value === 'ELEVEE' ? 'bg-orange-100 text-orange-800' :
          value === 'MOYENNE' ? 'bg-yellow-100 text-yellow-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {getDifficulteLabel(value)}
        </span>
      )
    },
    { key: 'dureeEtudes', label: 'Durée' },
    { 
      key: 'debouches', 
      label: 'Débouchés',
      render: (value: string[]) => value.slice(0, 2).join(', ') + (value.length > 2 ? '...' : '')
    },
  ];

  const handleDelete = (filiere: FiliereSummaryResponse) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la filière "${filiere.nom}" ?`)) {
      deleteFiliereMutation.mutate(filiere.id);
    }
  };

  const handleEdit = (filiere: FiliereSummaryResponse) => {
    window.location.href = `/admin/filieres/edit/${filiere.id}`;
  };

  const handleView = (filiere: FiliereSummaryResponse) => {
    window.open(`/orientation/${filiere.id}`, '_blank');
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gestion des filières</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gérez les filières d'orientation pour les étudiants
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/admin/filieres/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nouvelle filière
          </Link>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              placeholder="Rechercher une filière..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="domaine-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Domaine
            </label>
            <select
              id="domaine-filter"
              className="block w-full max-w-xs pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
              value={selectedDomaine}
              onChange={(e) => setSelectedDomaine(e.target.value as DomaineFiliereType | '')}
            >
            <option value="">Tous les domaines</option>
            <option value="SCIENCES_ET_TECHNOLOGIES">Sciences & Technologies</option>
            <option value="SCIENCES_DE_LA_SANTE">Sciences de la Santé</option>
            <option value="SCIENCES_ECONOMIQUES_ET_GESTION">Sciences Éco & Gestion</option>
            <option value="DROIT_ET_SCIENCES_POLITIQUES">Droit & Sciences Politiques</option>
            <option value="LETTRES_ET_SCIENCES_HUMAINES">Lettres & Sciences Humaines</option>
            <option value="ARTS_ET_COMMUNICATION">Arts & Communication</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredFilieres}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        isLoading={isLoading}
      />
      </div>
    </div>
  );
};

export default FilieresManagement;