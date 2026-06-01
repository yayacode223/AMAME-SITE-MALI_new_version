import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FormWrapper from "@/components/admin/FormWrapper";
import { useCreateBourse, useUpdateBourse, useGetBourseDetail } from "@/service/bourseService";
import { BourseCreationRequest, BourseUpdateRequest } from "@/types/bourseType";

const inputCls = "mt-1 block w-full border border-amame-border rounded-xl py-2 px-3 text-sm text-amame-charcoal focus:outline-none focus:ring-1 focus:ring-amame-green focus:border-amame-green transition-colors bg-white";
const labelCls = "block text-sm font-medium text-amame-charcoal";

const BourseForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const { data: existingBourse, isLoading: isLoadingBourse } = useGetBourseDetail(
    parseInt(id || "0"), { enabled: isEditing }
  );
  const createMutation = useCreateBourse();
  const updateMutation = useUpdateBourse();

  const [formData, setFormData] = useState<BourseCreationRequest>({
    titre: "", descriptionCourte: "", descriptionLongue: "", bailleur: "",
    paysHote: "", niveau: "", categorie: "", financementStatut: "", organisation: "",
    dateLimite: "", financement: "", paysEligible: "", regionEligible: "",
    lienSiteOfficiel: "", urlSource: "",
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
        await updateMutation.mutateAsync({
          id: parseInt(id!),
          request: { ...formData, id: parseInt(id!) } as BourseUpdateRequest,
          file: selectedFile || undefined,
        });
      } else {
        await createMutation.mutateAsync({ request: formData, file: selectedFile || undefined });
      }
      navigate("/admin/bourses");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const isLoading = isLoadingBourse || createMutation.isPending || updateMutation.isPending;

  return (
    <FormWrapper
      title={isEditing ? "Modifier la bourse" : "Créer une bourse"}
      subtitle={isEditing ? "Modifiez les informations de la bourse" : "Remplissez les informations pour créer une nouvelle bourse"}
      backUrl="/admin/bourses"
      isLoading={isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations principales */}
        <div>
          <h2 className="text-sm font-semibold text-amame-charcoal uppercase tracking-wide mb-4 pb-2 border-b border-amame-border">
            Informations principales
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="titre" className={labelCls}>Titre de la bourse *</label>
              <input type="text" id="titre" required value={formData.titre}
                onChange={(e) => setFormData((p) => ({ ...p, titre: e.target.value }))}
                className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="descriptionCourte" className={labelCls}>Description courte *</label>
              <textarea id="descriptionCourte" rows={3} required value={formData.descriptionCourte}
                onChange={(e) => setFormData((p) => ({ ...p, descriptionCourte: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label htmlFor="bailleur" className={labelCls}>Bailleur</label>
              <input type="text" id="bailleur" value={formData.bailleur}
                onChange={(e) => setFormData((p) => ({ ...p, bailleur: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label htmlFor="organisation" className={labelCls}>Organisation</label>
              <input type="text" id="organisation" value={formData.organisation}
                onChange={(e) => setFormData((p) => ({ ...p, organisation: e.target.value }))}
                className={inputCls} />
            </div>
          </div>
        </div>

        {/* Critères */}
        <div>
          <h2 className="text-sm font-semibold text-amame-charcoal uppercase tracking-wide mb-4 pb-2 border-b border-amame-border">
            Critères
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="paysHote" className={labelCls}>Pays hôte</label>
              <input type="text" id="paysHote" value={formData.paysHote}
                onChange={(e) => setFormData((p) => ({ ...p, paysHote: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label htmlFor="paysEligible" className={labelCls}>Pays éligibles</label>
              <input type="text" id="paysEligible" value={formData.paysEligible}
                onChange={(e) => setFormData((p) => ({ ...p, paysEligible: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label htmlFor="niveau" className={labelCls}>Niveau d'études</label>
              <select id="niveau" value={formData.niveau}
                onChange={(e) => setFormData((p) => ({ ...p, niveau: e.target.value }))}
                className={inputCls}>
                <option value="">Sélectionnez un niveau</option>
                <option value="LICENCE">Licence</option>
                <option value="MASTER">Master</option>
                <option value="DOCTORAT">Doctorat</option>
                <option value="POST_DOCTORAT">Post-Doctorat</option>
              </select>
            </div>
            <div>
              <label htmlFor="categorie" className={labelCls}>Catégorie</label>
              <select id="categorie" value={formData.categorie}
                onChange={(e) => setFormData((p) => ({ ...p, categorie: e.target.value }))}
                className={inputCls}>
                <option value="">Sélectionnez une catégorie</option>
                <option value="EXCELLENCE">Bourse d'excellence</option>
                <option value="MERITE">Bourse au mérite</option>
                <option value="SOCIALE">Bourse sociale</option>
                <option value="MOBILITE">Bourse de mobilité</option>
                <option value="RECHERCHE">Bourse de recherche</option>
              </select>
            </div>
            <div>
              <label htmlFor="dateLimite" className={labelCls}>Date limite *</label>
              <input type="date" id="dateLimite" required value={formData.dateLimite}
                onChange={(e) => setFormData((p) => ({ ...p, dateLimite: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label htmlFor="financementStatut" className={labelCls}>Type de financement</label>
              <select id="financementStatut" value={formData.financementStatut}
                onChange={(e) => setFormData((p) => ({ ...p, financementStatut: e.target.value }))}
                className={inputCls}>
                <option value="">Sélectionnez le financement</option>
                <option value="COMPLET">Financement complet</option>
                <option value="PARTIEL">Financement partiel</option>
                <option value="EXEMPTION_FRAIS">Exemption des frais</option>
                <option value="ALLOCATION">Allocation mensuelle</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liens & Document */}
        <div>
          <h2 className="text-sm font-semibold text-amame-charcoal uppercase tracking-wide mb-4 pb-2 border-b border-amame-border">
            Liens & Document
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="lienSiteOfficiel" className={labelCls}>Lien site officiel</label>
              <input type="url" id="lienSiteOfficiel" value={formData.lienSiteOfficiel}
                onChange={(e) => setFormData((p) => ({ ...p, lienSiteOfficiel: e.target.value }))}
                placeholder="https://..." className={inputCls} />
            </div>
            <div>
              <label htmlFor="urlSource" className={labelCls}>URL source</label>
              <input type="url" id="urlSource" value={formData.urlSource}
                onChange={(e) => setFormData((p) => ({ ...p, urlSource: e.target.value }))}
                placeholder="https://..." className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="file" className={labelCls}>Document (PDF, Image)</label>
              <input type="file" id="file" accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full text-sm text-amame-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-amame-green-subtle file:text-amame-green hover:file:bg-amame-green-light transition-colors" />
            </div>
          </div>
        </div>

        {/* Description longue */}
        <div>
          <label htmlFor="descriptionLongue" className={labelCls}>Description détaillée</label>
          <textarea id="descriptionLongue" rows={8} value={formData.descriptionLongue}
            onChange={(e) => setFormData((p) => ({ ...p, descriptionLongue: e.target.value }))}
            className={inputCls} />
        </div>

        {/* Actions */}
        <div className="flex justify-end items-center gap-3 pt-4 border-t border-amame-border">
          <button type="button" onClick={() => navigate("/admin/bourses")}
            className="py-2 px-4 border border-amame-border rounded-xl text-sm font-semibold text-amame-slate hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amame-green transition-colors">
            Annuler
          </button>
          <button type="submit" disabled={isLoading}
            className="inline-flex justify-center py-2 px-5 border border-transparent rounded-xl text-sm font-semibold text-white bg-amame-green hover:bg-amame-green-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amame-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {isLoading ? "Sauvegarde..." : isEditing ? "Mettre à jour" : "Créer la bourse"}
          </button>
        </div>
      </form>
    </FormWrapper>
  );
};

export default BourseForm;
