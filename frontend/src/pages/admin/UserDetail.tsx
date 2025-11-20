// pages/admin/UserDetail.tsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, UserIcon, DocumentIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { useGetUserById } from '@/service/userService';
import {Sexe} from '@/types/userType';

const url = import.meta.env.VITE_API_BASE_URL; 

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: user, isLoading } = useGetUserById(parseInt(id || '0'));

  const getSexeLabel = (sexe: Sexe) => {
    return sexe === 'HOMME' ? 'Homme' : 'Femme';
  };

  const getNiveauEtudeLabel = (niveau: string) => {
    const niveaux: Record<string, string> = {
      'BAC': 'Baccalauréat',
      'BAC+2': 'Bac+2 (BTS, DUT)',
      'LICENCE': 'Licence (Bac+3)',
      'MASTER': 'Master (Bac+5)',
      'DOCTORAT': 'Doctorat (Bac+8)',
      'AUTRE': 'Autre'
    };
    return niveaux[niveau] || niveau;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Utilisateur non trouvé</h1>
          <Link
            to="/admin/users"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mt-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          to="/admin/users"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Retour à la liste
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* En-tête */}
        <div className="bg-indigo-700 px-6 py-8">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {user.imagePath ? (
                <img
                  className="h-20 w-20 rounded-full"
                  src={`${url}/${user.imagePath}`}
                  alt={`${user.prenom} ${user.nom}`}
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-indigo-600 flex items-center justify-center">
                  <UserIcon className="h-10 w-10 text-white" />
                </div>
              )}
            </div>
            <div className="ml-6">
              <h1 className="text-2xl font-bold text-white">
                {user.prenom} {user.nom}
              </h1>
              <p className="text-indigo-200">{user.email}</p>
              <div className="mt-2 flex items-center space-x-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.role}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {getSexeLabel(user.sexe)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Informations détaillées */}
        <div className="px-6 py-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {/* Informations personnelles */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Informations personnelles</h2>
              <dl className="space-y-4">
                <>
                  <dt className="flex items-start">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <span className="text-sm font-medium text-gray-500">Email</span>
                  </dt>
                  <dd className="text-sm text-gray-900 ml-8">{user.email}</dd>
                </>
                <>
                  <dt className="flex items-start">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <span className="text-sm font-medium text-gray-500">Téléphone</span>
                  </dt>
                  <dd className="text-sm text-gray-900 ml-8">{user.phone || 'Non renseigné'}</dd>
                </>
                <>
                  <dt className="flex items-start">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <span className="text-sm font-medium text-gray-500">Adresse</span>
                  </dt>
                  <dd className="text-sm text-gray-900 ml-8">
                    {user.adresse ? (
                      <>
                        {user.adresse}
                        <br />
                        {user.codePostal && `${user.codePostal} `}{user.ville}
                        {user.pays && <>, {user.pays}</>}
                      </>
                    ) : (
                      'Non renseignée'
                    )}
                  </dd>
                </>
                <>
                  <dt className="text-sm font-medium text-gray-500">Date de naissance</dt>
                  <dd className="text-sm text-gray-900">
                    {user.birthDate ? new Date(user.birthDate).toLocaleDateString('fr-FR') : 'Non renseignée'}
                  </dd>
                </>
              </dl>
            </div>

            {/* Informations académiques */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Informations académiques</h2>
              <dl className="space-y-4">
                <>
                  <dt className="flex items-start">
                    <AcademicCapIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <span className="text-sm font-medium text-gray-500">Niveau d'étude</span>
                  </dt>
                  <dd className="text-sm text-gray-900 ml-8">
                    {user.niveauEtude ? getNiveauEtudeLabel(user.niveauEtude) : 'Non renseigné'}
                  </dd>
                </>
                
                <>
                  <dt className="text-sm font-medium text-gray-500">Rôle</dt>
                  <dd className="text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </dd>
                </>
              </dl>

              {/* Documents */}
              <div className="mt-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">Documents</h3>
                <div className="space-y-2">
                  {user.cvPath ? (
                    <a
                      href={`${url}/${user.cvPath}`}    
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <DocumentIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-sm font-medium text-gray-900">CV de l'utilisateur</span>
                    </a>
                  ) : (
                    <p className="text-sm text-gray-500">Aucun document disponible</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <Link
                to={`/admin/users/edit/${user.id}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Modifier
              </Link>
              <button
                onClick={() => {
                  if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.prenom} ${user.nom}" ?`)) {
                    // Implémentez la suppression
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;