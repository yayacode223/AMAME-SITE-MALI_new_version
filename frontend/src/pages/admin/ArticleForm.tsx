import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FormWrapper from '@/components/admin/FormWrapper';
import { useCreateArticle, useUpdateArticle, useGetArticleById } from '@/service/articleService';
import { ArticleCreationRequest, ArticleUpdateRequest} from "@/types/articleType"; 
const ArticleForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const { data: existingArticle, isLoading: isLoadingArticle } = useGetArticleById(
    parseInt(id|| '0'), 
    { enabled: isEditing }
  );
  
  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle();

  const [formData, setFormData] = useState<ArticleCreationRequest>({
    titre: '',
    contenu: '',
    auteur: '',
    categorie: '',
    tempsLecture: 5,
    tags: [],
    metaDescription: '',
    metaKeywords: ''
  });

  const [estPublie, setEstPublie] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (existingArticle && isEditing) {
      setFormData({
        titre: existingArticle.titre,
        contenu: existingArticle.contenu,
        auteur: existingArticle.auteur,
        categorie: existingArticle.categorie,
        tempsLecture: existingArticle.tempsLecture,
        tags: existingArticle.tags,
        metaDescription: existingArticle.metaDescription,
        metaKeywords: existingArticle.metaKeywords
      });
      setEstPublie(existingArticle.estPublie);
    }
  }, [existingArticle, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing) {
        const updateRequest: ArticleUpdateRequest = {
          ...formData,
          estPublie
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
      
      navigate('/admin/articles');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const isLoading = isLoadingArticle || createMutation.isPending || updateMutation.isPending;

  return (
    <FormWrapper
      title={isEditing ? 'Modifier l\'article' : 'Créer un nouvel article'}
      subtitle={isEditing ? 'Modifiez les informations de l\'article' : 'Remplissez les informations pour créer un nouvel article'}
      backUrl="/admin/articles"
      isLoading={isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Titre */}
          <div className="sm:col-span-2">
            <label htmlFor="titre" className="block text-sm font-medium text-gray-700">
              Titre *
            </label>
            <input
              type="text"
              id="titre"
              required
              value={formData.titre}
              onChange={(e) => setFormData(prev => ({ ...prev, titre: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Auteur et Catégorie */}
          <div>
            <label htmlFor="auteur" className="block text-sm font-medium text-gray-700">
              Auteur *
            </label>
            <input
              type="text"
              id="auteur"
              required
              value={formData.auteur}
              onChange={(e) => setFormData(prev => ({ ...prev, auteur: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="categorie" className="block text-sm font-medium text-gray-700">
              Catégorie *
            </label>
            <input
              type="text"
              id="categorie"
              required
              value={formData.categorie}
              onChange={(e) => setFormData(prev => ({ ...prev, categorie: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Temps de lecture */}
          <div>
            <label htmlFor="tempsLecture" className="block text-sm font-medium text-gray-700">
              Temps de lecture (minutes) *
            </label>
            <input
              type="number"
              id="tempsLecture"
              min="1"
              required
              value={formData.tempsLecture}
              onChange={(e) => setFormData(prev => ({ ...prev, tempsLecture: parseInt(e.target.value) }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Fichier image */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">
              Image de couverture
            </label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
            Tags
          </label>
          <div className="mt-1 flex gap-2">
            <input
              type="text"
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Ajouter un tag"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Ajouter
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-200 hover:bg-blue-300"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Contenu */}
        <div>
          <label htmlFor="contenu" className="block text-sm font-medium text-gray-700">
            Contenu *
          </label>
          <textarea
            id="contenu"
            rows={12}
            required
            value={formData.contenu}
            onChange={(e) => setFormData(prev => ({ ...prev, contenu: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {/* SEO */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700">
              Meta Description
            </label>
            <textarea
              id="metaDescription"
              rows={3}
              value={formData.metaDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="metaKeywords" className="block text-sm font-medium text-gray-700">
              Meta Keywords
            </label>
            <input
              type="text"
              id="metaKeywords"
              value={formData.metaKeywords}
              onChange={(e) => setFormData(prev => ({ ...prev, metaKeywords: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="mot-clé1, mot-clé2, mot-clé3"
            />
          </div>
        </div>

        {/* Statut de publication */}
        {isEditing && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="estPublie"
              checked={estPublie}
              onChange={(e) => setEstPublie(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="estPublie" className="ml-2 block text-sm text-gray-900">
              Article publié
            </label>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/admin/articles')}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Sauvegarde...' : (isEditing ? 'Mettre à jour' : 'Créer l\'article')}
          </button>
        </div>
      </form>
    </FormWrapper>
  );
};

export default ArticleForm;