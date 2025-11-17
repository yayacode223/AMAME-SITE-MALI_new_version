// pages/admin/FiliereForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FormWrapper from '@/components/admin/FormWrapper';
import { useCreateFiliere, useUpdateFiliere, useGetFiliereById } from '@/service/orientationService';
import { 
  FiliereCreationRequest, 
  FiliereUpdateRequest, 
  DomaineFiliereType, 
  DifficulteType, 
  DemandeType, 
  SalaireType 
} from '@/types/orientationType';

const FiliereForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const { data: existingFiliere, isLoading: isLoadingFiliere } = useGetFiliereById(
    parseInt(id || '0'), 
    { enabled: isEditing }
  );
  
  const createMutation = useCreateFiliere();
  const updateMutation = useUpdateFiliere();

  const [formData, setFormData] = useState<FiliereCreationRequest>({
    nom: '',
    descriptionCourte: '',
    descriptionLongue: '',
    domaine: DomaineFiliereType.SCIENCES_ET_TECHNOLOGIES,
    difficulte: DifficulteType.MOYENNE,
    demande: DemandeType.MOYENNE,
    salaire: SalaireType.MOYEN,
    dureeEtudes: '',
    tauxEmploi: '',
    salaireDebut: '',
    salaireExperience: '',
    perspectives: '',
    debouches: [],
    competences: [],
    universites: [],
    prerequis: []
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deboucheInput, setDeboucheInput] = useState('');
  const [competenceInput, setCompetenceInput] = useState('');
  const [universiteInput, setUniversiteInput] = useState('');
  const [prerequisInput, setPrerequisInput] = useState('');

  useEffect(() => {
    if (existingFiliere && isEditing) {
      setFormData({
        nom: existingFiliere.nom,
        descriptionCourte: existingFiliere.descriptionCourte,
        descriptionLongue: existingFiliere.descriptionLongue,
        domaine: existingFiliere.domaine,
        difficulte: existingFiliere.difficulte,
        demande: existingFiliere.demande,
        salaire: existingFiliere.salaire,
        dureeEtudes: existingFiliere.dureeEtudes,
        tauxEmploi: existingFiliere.tauxEmploi,
        salaireDebut: existingFiliere.salaireDebut,
        salaireExperience: existingFiliere.salaireExperience,
        perspectives: existingFiliere.perspectives,
        debouches: existingFiliere.debouches,
        competences: existingFiliere.competences,
        universites: existingFiliere.universites,
        prerequis: existingFiliere.prerequis
      });
    }
  }, [existingFiliere, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing) {
        const updateRequest: FiliereUpdateRequest = {
          ...formData,
          id: parseInt(id!)
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
      
      navigate('/admin/filieres');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const addToList = (list: keyof FiliereCreationRequest, value: string, setInput: React.Dispatch<React.SetStateAction<string>>) => {
    if (value.trim() && !formData[list].includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [list]: [...prev[list], value.trim()]
      }));
      setInput('');
    }
  };

  const removeFromList = (list: keyof FiliereCreationRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [list]: (prev[list] as string[]).filter(item => item !== value)
    }));
  };

  const renderListInput = (
    label: string,
    list: keyof FiliereCreationRequest,
    inputValue: string,
    setInputValue: React.Dispatch<React.SetStateAction<string>>,
    placeholder: string
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1 flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToList(list, inputValue, setInputValue))}
          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => addToList(list, inputValue, setInputValue)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          Ajouter
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {(formData[list] as string[]).map((item, index) => (
          <span
            key={index}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
          >
            {item}
            <button
              type="button"
              onClick={() => removeFromList(list, item)}
              className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-orange-200 hover:bg-orange-300"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );

  const isLoading = isLoadingFiliere || createMutation.isPending || updateMutation.isPending;

  return (
    <FormWrapper
      title={isEditing ? 'Modifier la filière' : 'Créer une nouvelle filière'}
      subtitle={isEditing ? 'Modifiez les informations de la filière' : 'Remplissez les informations pour créer une nouvelle filière'}
      backUrl="/admin/filieres"
      isLoading={isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Nom et Description courte */}
          <div className="sm:col-span-2">
            <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
              Nom de la filière *
            </label>
            <input
              type="text"
              id="nom"
              required
              value={formData.nom}
              onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="descriptionCourte" className="block text-sm font-medium text-gray-700">
              Description courte *
            </label>
            <textarea
              id="descriptionCourte"
              rows={3}
              required
              value={formData.descriptionCourte}
              onChange={(e) => setFormData(prev => ({ ...prev, descriptionCourte: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            />
          </div>

          {/* Domaine et Durée */}
          <div>
            <label htmlFor="domaine" className="block text-sm font-medium text-gray-700">
              Domaine *
            </label>
            <select
              id="domaine"
              required
              value={formData.domaine}
              onChange={(e) => setFormData(prev => ({ ...prev, domaine: e.target.value as DomaineFiliereType }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            >
              <option value={DomaineFiliereType.SCIENCES_ET_TECHNOLOGIES}>Sciences & Technologies</option>
              <option value={DomaineFiliereType.SCIENCES_DE_LA_SANTE}>Sciences de la Santé</option>
              <option value={DomaineFiliereType.SCIENCES_ECONOMIQUES_ET_GESTION}>Sciences Éco & Gestion</option>
              <option value={DomaineFiliereType.DROIT_ET_SCIENCES_POLITIQUES}>Droit & Sciences Politiques</option>
              <option value={DomaineFiliereType.LETTRES_ET_SCIENCES_HUMAINES}>Lettres & Sciences Humaines</option>
              <option value={DomaineFiliereType.ARTS_ET_COMMUNICATION}>Arts & Communication</option>
            </select>
          </div>

          <div>
            <label htmlFor="dureeEtudes" className="block text-sm font-medium text-gray-700">
              Durée des études *
            </label>
            <input
              type="text"
              id="dureeEtudes"
              required
              value={formData.dureeEtudes}
              onChange={(e) => setFormData(prev => ({ ...prev, dureeEtudes: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              placeholder="ex: 3 ans, 5 ans..."
            />
          </div>

          {/* Difficulté, Demande, Salaire */}
          <div>
            <label htmlFor="difficulte" className="block text-sm font-medium text-gray-700">
              Difficulté *
            </label>
            <select
              id="difficulte"
              required
              value={formData.difficulte}
              onChange={(e) => setFormData(prev => ({ ...prev, difficulte: e.target.value as DifficulteType }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            >
              <option value={DifficulteType.TRES_ELEVEE}>Très élevée</option>
              <option value={DifficulteType.ELEVEE}>Élevée</option>
              <option value={DifficulteType.MOYENNE}>Moyenne</option>
              <option value={DifficulteType.VARIABLE}>Variable</option>
            </select>
          </div>

          <div>
            <label htmlFor="demande" className="block text-sm font-medium text-gray-700">
              Demande sur le marché *
            </label>
            <select
              id="demande"
              required
              value={formData.demande}
              onChange={(e) => setFormData(prev => ({ ...prev, demande: e.target.value as DemandeType }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            >
              <option value={DemandeType.TRES_FORTE}>Très forte</option>
              <option value={DemandeType.FORTE}>Forte</option>
              <option value={DemandeType.MOYENNE}>Moyenne</option>
              <option value={DemandeType.CROISSANTE}>Croissante</option>
              <option value={DemandeType.VARIABLE}>Variable</option>
            </select>
          </div>

          <div>
            <label htmlFor="salaire" className="block text-sm font-medium text-gray-700">
              Salaire moyen *
            </label>
            <select
              id="salaire"
              required
              value={formData.salaire}
              onChange={(e) => setFormData(prev => ({ ...prev, salaire: e.target.value as SalaireType }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            >
              <option value={SalaireType.TRES_ELEVE}>Très élevé</option>
              <option value={SalaireType.ELEVE}>Élevé</option>
              <option value={SalaireType.MOYEN_ELEVE}>Moyen-élevé</option>
              <option value={SalaireType.MOYEN}>Moyen</option>
              <option value={SalaireType.VARIABLE}>Variable</option>
            </select>
          </div>

          {/* Statistiques */}
          <div>
            <label htmlFor="tauxEmploi" className="block text-sm font-medium text-gray-700">
              Taux d'emploi
            </label>
            <input
              type="text"
              id="tauxEmploi"
              value={formData.tauxEmploi}
              onChange={(e) => setFormData(prev => ({ ...prev, tauxEmploi: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              placeholder="ex: 85%"
            />
          </div>

          <div>
            <label htmlFor="salaireDebut" className="block text-sm font-medium text-gray-700">
              Salaire débutant
            </label>
            <input
              type="text"
              id="salaireDebut"
              value={formData.salaireDebut}
              onChange={(e) => setFormData(prev => ({ ...prev, salaireDebut: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              placeholder="ex: 30,000€/an"
            />
          </div>

          <div>
            <label htmlFor="salaireExperience" className="block text-sm font-medium text-gray-700">
              Salaire avec expérience
            </label>
            <input
              type="text"
              id="salaireExperience"
              value={formData.salaireExperience}
              onChange={(e) => setFormData(prev => ({ ...prev, salaireExperience: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              placeholder="ex: 60,000€/an"
            />
          </div>

          {/* Fichier */}
          <div className="sm:col-span-2">
            <label htmlFor="file" className="block text-sm font-medium text-gray-700">
              Image illustrative
            </label>
            <input
              type="file"
              id="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
            />
          </div>

          {/* Perspectives */}
          <div className="sm:col-span-2">
            <label htmlFor="perspectives" className="block text-sm font-medium text-gray-700">
              Perspectives d'évolution
            </label>
            <textarea
              id="perspectives"
              rows={3}
              value={formData.perspectives}
              onChange={(e) => setFormData(prev => ({ ...prev, perspectives: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            />
          </div>

          {/* Description longue */}
          <div className="sm:col-span-2">
            <label htmlFor="descriptionLongue" className="block text-sm font-medium text-gray-700">
              Description détaillée *
            </label>
            <textarea
              id="descriptionLongue"
              rows={6}
              required
              value={formData.descriptionLongue}
              onChange={(e) => setFormData(prev => ({ ...prev, descriptionLongue: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Listes */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {renderListInput(
            "Débouchés professionnels",
            "debouches",
            deboucheInput,
            setDeboucheInput,
            "ex: Data Scientist, Analyste..."
          )}

          {renderListInput(
            "Compétences requises",
            "competences",
            competenceInput,
            setCompetenceInput,
            "ex: Programmation, Analyse..."
          )}

          {renderListInput(
            "Universités recommandées",
            "universites",
            universiteInput,
            setUniversiteInput,
            "ex: Université Paris-Saclay..."
          )}

          {renderListInput(
            "Prérequis",
            "prerequis",
            prerequisInput,
            setPrerequisInput,
            "ex: Bac S, Licence Informatique..."
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/admin/filieres')}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
          >
            {isLoading ? 'Sauvegarde...' : (isEditing ? 'Mettre à jour' : 'Créer la filière')}
          </button>
        </div>
      </form>
    </FormWrapper>
  );
};

export default FiliereForm;