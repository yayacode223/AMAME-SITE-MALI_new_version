// pages/admin/BoursesManagement.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import DataTable from '@/components/admin/DataTable';
import { useGetBourses, useDeleteBourse} from '@/service/bourseService';
import {BourseSummary} from '@/types/bourseType'; 

const BoursesManagement: React.FC = () => {
  const [searchParams] = useState({ page: 0, size: 50 });
  const { data: boursesData, isLoading } = useGetBourses(searchParams);
  const deleteBourseMutation = useDeleteBourse();

  const bourses = boursesData?.bourseSummaryDtos || [];

  const columns = [
    { key: 'titre', label: 'Titre' },
    { key: 'bailleur', label: 'Bailleur' },
    { key: 'paysHote', label: 'Pays' },
    { key: 'niveau', label: 'Niveau' },
    { 
      key: 'dateLimite', 
      label: 'Date limite',
      render: (value: string) => value ? new Date(value).toLocaleDateString('fr-FR') : 'N/A'
    },
  ];

  const handleDelete = (bourse: BourseSummary) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la bourse "${bourse.titre}" ?`)) {
      deleteBourseMutation.mutate(bourse.id);
    }
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gestion des bourses</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gérez les opportunités de bourses d'études
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/admin/bourses/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nouvelle bourse
          </Link>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={bourses}
        onEdit={(bourse) => window.location.href = `/admin/bourses/edit/${bourse.id}`}
        onDelete={handleDelete}
        onView={(bourse) => window.open(`/bourses/${bourse.id}`, '_blank')}
        isLoading={isLoading}
      />
    </div>
  );
};

export default BoursesManagement;