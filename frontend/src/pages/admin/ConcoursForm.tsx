// pages/admin/ConcoursForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FormWrapper from '@/components/admin/FormWrapper';
import { useCreateConcours, useUpdateConcours, useConcoursDetail } from '@/service/concoursService';
import { ConcoursCreationRequest, ConcoursUpdateRequest, NiveauType, StatusType } from '@/service/concoursService';

const ConcoursForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const { data: existingConcours, isLoading: isLoadingConcours } = useConcoursDetail(
    parseInt(id || '0'), 
    { enabled: isEditing }
  );
  
  const createMutation = useCreateConcours();
  const updateMutation = useUpdateConcours();

  const [formData, setFormData] = useState<ConcoursCreationRequest>({
    nom: '',
    description: '',
    pays: '',
    niveau: 'LICENCE' as NiveauType,
    status: 'NATIONAL' as StatusType,
    dateOuverture: '',
    dateLimite: '',
    lienOfficiel: ''
  });

  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (existingConcours && isEditing) {
      setFormData({
        nom: existingConcours.nom,
        description: existingConcours.description,
        pays: existingConcours.pays,
        niveau: existingConcours.niveau,
        status: existingConcours.status,
        dateOuverture: existingConcours.dateOuverture,
        dateLimite: existingConcours.dateLimite,
        lienOfficiel: existingConcours.lienOfficiel
      });
      setIsAvailable(existingConcours.isAvailable);
    }
  }, [existingConcours, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing) {
        const updateRequest: ConcoursUpdateRequest = {
          ...formData,
          id: parseInt(id!),
          isAvailable
        };
        await updateMutation.mutateAsync({
          id: parseInt(id!),
          request: updateRequest,
          file: selectedFile || undefined
        });
      } else {
        await createMutation.mutateAsync({
          request: formData,
          file: selectedFile || undefined
        });
      }
      
      navigate('/admin/concours');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const isLoading = isLoadingConcours || createMutation.isPending || updateMutation.isPending;

  return (
    <FormWrapper
      title={isEditing ? 'Modifier le concours' : 'Créer un nouveau concours'}
      subtitle={isEditing ? 'Modifiez les informations du concours' : 'Remplissez les informations pour créer un nouveau concours'}
      backUrl="/admin/concours"
      isLoading={isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Nom du concours */}
          <div className="sm:col-span-2">
            <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
              Nom du concours *
            </label>
            <input
              type="text"
              id="nom"
              required
              value={formData.nom}
              onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            />
          </div>

          {/* Pays */}
          <div>
            <label htmlFor="pays" className="block text-sm font-medium text-gray-700">
              Pays *
            </label>
            <input
              type="text"
              id="pays"
              required
              value={formData.pays}
              onChange={(e) => setFormData(prev => ({ ...prev, pays: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            />
          </div>

          {/* Niveau */}
          <div>
            <label htmlFor="niveau" className="block text-sm font-medium text-gray-700">
              Niveau *
            </label>
            <select
              id="niveau"
              required
              value={formData.niveau}
              onChange={(e) => setFormData(prev => ({ ...prev, niveau: e.target.value as NiveauType }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            >
              <option value="BACHELIER">Bachelier</option>
              <option value="LICENCE">Licence</option>
              <option value="MASTER">Master</option>
              <option value="DOCTORAT">Doctorat</option>
            </select>
          </div>

          {/* Statut */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Statut *
            </label>
            <select
              id="status"
              required
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as StatusType }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            >
              <option value="NATIONAL">National</option>
              <option value="INTERNATIONAL">International</option>
            </select>
          </div>

          {/* Dates */}
          <div>
            <label htmlFor="dateOuverture" className="block text-sm font-medium text-gray-700">
              Date d'ouverture *
            </label>
            <input
              type="date"
              id="dateOuverture"
              required
              value={formData.dateOuverture}
              onChange={(e) => setFormData(prev => ({ ...prev, dateOuverture: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="dateLimite" className="block text-sm font-medium text-gray-700">
              Date limite *
            </label>
            <input
              type="date"
              id="dateLimite"
              required
              value={formData.dateLimite}
              onChange={(e) => setFormData(prev => ({ ...prev, dateLimite: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            />
          </div>

          {/* Lien officiel */}
          <div className="sm:col-span-2">
            <label htmlFor="lienOfficiel" className="block text-sm font-medium text-gray-700">
              Lien officiel *
            </label>
            <input
              type="url"
              id="lienOfficiel"
              required
              value={formData.lienOfficiel}
              onChange={(e) => setFormData(prev => ({ ...prev, lienOfficiel: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="https://..."
            />
          </div>

          {/* Fichier */}
          <div className="sm:col-span-2">
            <label htmlFor="file" className="block text-sm font-medium text-gray-700">
              Document (PDF, Image)
            </label>
            <input
              type="file"
              id="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              id="description"
              rows={6}
              required
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Disponibilité */}
        {isEditing && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isAvailable"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-900">
              Concours actif et visible
            </label>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/admin/concours')}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            {isLoading ? 'Sauvegarde...' : (isEditing ? 'Mettre à jour' : 'Créer le concours')}
          </button>
        </div>
      </form>
    </FormWrapper>
  );
};

export default ConcoursForm;