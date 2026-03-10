import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FormWrapper from "@/components/admin/FormWrapper";
import {
  useCreateBourse,
  useUpdateBourse,
  useGetBourseDetail,
} from "@/service/bourseService";
import { BourseCreationRequest, BourseUpdateRequest } from "@/types/bourseType";

const BourseForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const { data: existingBourse, isLoading: isLoadingBourse } =
    useGetBourseDetail(parseInt(id || "0"), { enabled: isEditing });

  const createMutation = useCreateBourse();
  const updateMutation = useUpdateBourse();

  const [formData, setFormData] = useState<BourseCreationRequest>({
    titre: "",
    descriptionCourte: "",
    descriptionLongue: "",
    bailleur: "",
    paysHote: "",
    niveau: "",
    categorie: "",
    financementStatut: "",
    organisation: "",
    dateLimite: "",
    financement: "",
    paysEligible: "",
    regionEligible: "",
    lienSiteOfficiel: "",
    urlSource: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (existingBourse && isEditing) {
      setFormData({
        titre: existingBourse.titre,
        descriptionCourte: existingBourse.descriptionCourte,
        descriptionLongue: existingBourse.descriptionLongue || "",
        bailleur: existingBourse.bailleur || "",
        paysHote: existingBourse.paysHote || "",
        niveau: existingBourse.niveau || "",
        categorie: existingBourse.categorie || "",
        financementStatut: existingBourse.financementStatut || "",
        organisation: existingBourse.organisation || "",
        dateLimite: existingBourse.dateLimite || "",
        financement: existingBourse.financement || "",
        paysEligible: existingBourse.paysEligible || "",
        regionEligible: existingBourse.regionEligible || "",
        lienSiteOfficiel: existingBourse.lienSiteOfficiel || "",
        urlSource: existingBourse.urlSource || "",
      });
    }
  }, [existingBourse, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing) {
        const updateRequest: BourseUpdateRequest = {
          ...formData,
          id: parseInt(id!),
        };
        await updateMutation.mutateAsync({
          id: parseInt(id!),
          request: updateRequest,
          file: selectedFile || undefined,
        });
      } else {
        await createMutation.mutateAsync({
          request: formData,
          file: selectedFile || undefined,
        });
      }

      navigate("/admin/bourses");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const isLoading =
    isLoadingBourse || createMutation.isPending || updateMutation.isPending;

  return (
    <FormWrapper
      title={isEditing ? "Modifier la bourse" : "Créer une nouvelle bourse"}
      subtitle={
        isEditing
          ? "Modifiez les informations de la bourse"
          : "Remplissez les informations pour créer une nouvelle bourse"
      }
      backUrl="/admin/bourses"
      isLoading={isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Titre */}
          <div className="sm:col-span-2">
            <label
              htmlFor="titre"
              className="block text-sm font-medium text-gray-700"
            >
              Titre de la bourse *
            </label>
            <input
              type="text"
              id="titre"
              required
              value={formData.titre}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, titre: e.target.value }))
              }
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>

          {/* Description courte */}
          <div className="sm:col-span-2">
            <label
              htmlFor="descriptionCourte"
              className="block text-sm font-medium text-gray-700"
            >
              Description courte *
            </label>
            <textarea
              id="descriptionCourte"
              rows={3}
              required
              value={formData.descriptionCourte}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  descriptionCourte: e.target.value,
                }))
              }
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>

          {/* Bailleur et Organisation */}
          <div>
            <label
              htmlFor="bailleur"
              className="block text-sm font-medium text-gray-700"
            >
              Bailleur
            </label>
            <input
              type="text"
              id="bailleur"
              value={formData.bailleur}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bailleur: e.target.value }))
              }
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="organisation"
              className="block text-sm font-medium text-gray-700"
            >
              Organisation
            </label>
            <input
              type="text"
              id="organisation"
              value={formData.organisation}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  organisation: e.target.value,
                }))
              }
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>

          {/* Pays et Région */}
          <div>
            <label
              htmlFor="paysHote"
              className="block text-sm font-medium text-gray-700"
            >
              Pays hôte
            </label>
            <input
              type="text"
              id="paysHote"
              value={formData.paysHote}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, paysHote: e.target.value }))
              }
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="paysEligible"
              className="block text-sm font-medium text-gray-700"
            >
              Pays éligibles
            </label>
            <input
              type="text"
              id="paysEligible"
              value={formData.paysEligible}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  paysEligible: e.target.value,
                }))
              }
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>

          {/* Niveau et Catégorie */}
          <div>
            <label
              htmlFor="niveau"
              className="block text-sm font-medium text-gray-700"
            >
              Niveau d'études
            </label>
            <select
              id="niveau"
              value={formData.niveau}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, niveau: e.target.value }))
              }
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            >
              <option value="">Sélectionnez un niveau</option>
              <option value="LICENCE">Licence</option>
              <option value="MASTER">Master</option>
              <option value="DOCTORAT">Doctorat</option>
              <option value="POST_DOCTORAT">Post-Doctorat</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="categorie"
              className="block text-sm font-medium text-gray-700"
            >
              Catégorie
            </label>
            <select
              id="categorie"
              value={formData.categorie}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, categorie: e.target.value }))
              }
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            >
              <option value="">Sélectionnez une catégorie</option>
              <option value="EXCELLENCE">Bourse d'excellence</option>
              <option value="MERITE">Bourse au mérite</option>
              <option value="SOCIALE">Bourse sociale</option>
              <option value="MOBILITE">Bourse de mobilité</option>
              <option value="RECHERCHE">Bourse de recherche</option>
            </select>
          </div>

          {/* Date limite */}
          <div>
            <label
              htmlFor="dateLimite"
              className="block text-sm font-medium text-gray-700"
            >
              Date limite *
            </label>
            <input
              type="date"
              id="dateLimite"
              required
              value={formData.dateLimite}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dateLimite: e.target.value }))
              }
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>

          {/* Financement */}
          <div>
            <label
              htmlFor="financement"
              className="block text-sm font-medium text-gray-700"
            >
              Type de financement
            </label>
            <select
              id="financement"
              value={formData.financementStatut}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  financementStatut: e.target.value,
                }))
              }
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            >
              <option value="">Sélectionnez le financement</option>
              <option value="COMPLET">Financement complet</option>
              <option value="PARTIEL">Financement partiel</option>
              <option value="EXEMPTION_FRAIS">Exemption des frais</option>
              <option value="ALLOCATION">Allocation mensuelle</option>
            </select>
          </div>

          {/* Fichier */}
          <div className="sm:col-span-2">
            <label
              htmlFor="file"
              className="block text-sm font-medium text-gray-700"
            >
              Document (PDF, Image)
            </label>
            <input
              type="file"
              id="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
          </div>

          {/* Liens */}
          <div className="sm:col-span-2">
            <label
              htmlFor="lienSiteOfficiel"
              className="block text-sm font-medium text-gray-700"
            >
              Lien du site officiel
            </label>
            <input
              type="url"
              id="lienSiteOfficiel"
              value={formData.lienSiteOfficiel}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  lienSiteOfficiel: e.target.value,
                }))
              }
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="urlSource"
              className="block text-sm font-medium text-gray-700"
            >
              URL source
            </label>
            <input
              type="url"
              id="urlSource"
              value={formData.urlSource}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, urlSource: e.target.value }))
              }
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>

          {/* Description longue */}
          <div className="sm:col-span-2">
            <label
              htmlFor="descriptionLongue"
              className="block text-sm font-medium text-gray-700"
            >
              Description détaillée
            </label>
            <textarea
              id="descriptionLongue"
              rows={8}
              value={formData.descriptionLongue}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  descriptionLongue: e.target.value,
                }))
              }
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate("/admin/bourses")}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {isLoading
              ? "Sauvegarde..."
              : isEditing
                ? "Mettre à jour"
                : "Créer la bourse"}
          </button>
        </div>
      </form>
    </FormWrapper>
  );
};

export default BourseForm;
