import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FormWrapper from '@/components/admin/FormWrapper';
import { useRegisterMutation, useUpdateMutation, useGetUserById } from '@/service/userService';
import { RegisterType, RegisterPayload, RegisterUpdatePayload, Sexe, Role } from '@/types/userType';
import { NiveauType } from '@/types/concoursType';
import { useAuth } from "@/context/AuthContext";

interface UserFormData extends Omit<RegisterType, 'password'> {
  role?: Role;
}

const UserForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { data: existingUser } = useGetUserById(isEditing ? parseInt(id!) : 0, { enabled: isEditing });
  const { user } = useAuth();
  const registerMutation = useRegisterMutation();
  const updateMutation = useUpdateMutation();

  const [formData, setFormData] = useState<UserFormData>({
    nom: '',
    prenom: '',
    email: '',
    birthDate: '',
    ville: '',
    sexe: 'HOMME',
    adresse: '',
    phone: '',
    pays: '',
    codePostal: 0,
    niveauEtude: 'BACHELIER',
    role: 'USER'
  });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedCV, setSelectedCV] = useState<File | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  //Pour l'édition, vous devrez récupérer l'utilisateur existant
  useEffect(() => {
    if (existingUser && isEditing) {
      setFormData({
        nom: existingUser.nom,
        prenom: existingUser.prenom,
        email: existingUser.email,
        birthDate: existingUser.birthDate || '',
        ville: existingUser.ville || '',
        sexe: existingUser.sexe,
        adresse: existingUser.adresse || '',
        phone: existingUser.phone || '',
        pays: existingUser.pays || '',
        codePostal: existingUser.codePostal || 0,
        niveauEtude: existingUser.niveauEtude as NiveauType || 'BACHELIER',
        role: existingUser.role || 'USER'
      });
    }
  }, [existingUser, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEditing && password !== confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    if (!isEditing && !password) {
      alert('Le mot de passe est obligatoire');
      return;
    }

    try {
      if (isEditing) {
        const updatePayload: RegisterUpdatePayload = {
          id: parseInt(id!),
          user: {
            ...formData,
            password: password // Pour l'édition, le mot de passe peut être optionnel
          },
          cv: selectedCV || undefined,
          image: selectedImage || undefined
        };
        await updateMutation.mutateAsync(updatePayload);
      } else {
        const registerPayload: RegisterPayload = {
          user: {
            ...formData,
            password: password
          },
          cv: selectedCV || undefined,
          image: selectedImage || undefined
        };
        await registerMutation.mutateAsync(registerPayload);
      }
      
      navigate('/admin/users');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const isLoading = registerMutation.isPending || updateMutation.isPending;

  return (
    <FormWrapper
      title={isEditing ? 'Modifier l\'utilisateur' : 'Créer un nouvel utilisateur'}
      subtitle={isEditing ? 'Modifiez les informations de l\'utilisateur' : 'Remplissez les informations pour créer un nouvel utilisateur'}
      backUrl="/admin/users"
      isLoading={isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Prénom et Nom */}
          <div>
            <label htmlFor="prenom" className="block text-sm font-medium text-gray-700">
              Prénom *
            </label>
            <input
              type="text"
              id="prenom"
              required
              value={formData.prenom}
              onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
              Nom *
            </label>
            <input
              type="text"
              id="nom"
              required
              value={formData.nom}
              onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Email et Téléphone */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              type="email"
              id="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Téléphone
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Sexe et Date de naissance */}
          <div>
            <label htmlFor="sexe" className="block text-sm font-medium text-gray-700">
              Sexe *
            </label>
            <select
              id="sexe"
              required
              value={formData.sexe}
              onChange={(e) => setFormData(prev => ({ ...prev, sexe: e.target.value as Sexe }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="MASCULIN">Masculin</option>
              <option value="FEMININ">Féminin</option>
            </select>
          </div>

          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
              Date de naissance
            </label>
            <input
              type="date"
              id="birthDate"
              value={formData.birthDate}
              onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Mot de passe (seulement pour la création) */}
          {!isEditing && (
            <>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mot de passe *
                </label>
                <input
                  type="password"
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmer le mot de passe *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </>
          )}

          {/* Adresse */}
          <div className="sm:col-span-2">
            <label htmlFor="adresse" className="block text-sm font-medium text-gray-700">
              Adresse
            </label>
            <input
              type="text"
              id="adresse"
              value={formData.adresse}
              onChange={(e) => setFormData(prev => ({ ...prev, adresse: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Ville et Code postal */}
          <div>
            <label htmlFor="ville" className="block text-sm font-medium text-gray-700">
              Ville
            </label>
            <input
              type="text"
              id="ville"
              value={formData.ville}
              onChange={(e) => setFormData(prev => ({ ...prev, ville: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="codePostal" className="block text-sm font-medium text-gray-700">
              Code postal
            </label>
            <input
              type="number"
              id="codePostal"
              value={formData.codePostal}
              onChange={(e) => setFormData(prev => ({ ...prev, codePostal: parseInt(e.target.value) || 0 }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Pays et Niveau d'étude */}
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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="niveauEtude" className="block text-sm font-medium text-gray-700">
              Niveau d'étude *
            </label>
            <select
              id="niveauEtude"
              required
              value={formData.niveauEtude}
              onChange={(e) => setFormData(prev => ({ ...prev, niveauEtude: e.target.value as NiveauType }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {/* <option value="">Sélectionnez un niveau</option> */}
              <option value="PRIMAIRE">Primaire</option>
              <option value="SECONDAIRE">Secondaire</option>
              <option value="LYCEE">Lyceé</option>
              <option value="BACHELIER">Baccalauréat</option>
              <option value="BAC_2">Bac+2 (BTS, DUT)</option>
              <option value="LICENCE">Licence (Bac+3)</option>
              <option value="MASTER">Master (Bac+5)</option>
              <option value="DOCTORAT">Doctorat (Bac+8)</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>

          {/* Rôle (seulement pour les admins) */}
          {user?.role === 'ADMIN' && (
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Rôle *
            </label>
            <select
              id="role"
              required
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as Role }))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="USER">Utilisateur</option>
              <option value="ADMIN">Administrateur</option>
            </select>
          </div>)}

          {/* Fichiers */}
          <div className="sm:col-span-2">
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">
              Photo de profil
            </label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="cv" className="block text-sm font-medium text-gray-700">
              CV (PDF)
            </label>
            <input
              type="file"
              id="cv"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setSelectedCV(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Sauvegarde...' : (isEditing ? 'Mettre à jour' : 'Créer l\'utilisateur')}
          </button>
        </div>
      </form>
    </FormWrapper>
  );
};

export default UserForm;