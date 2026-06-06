import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FormWrapper from "@/components/admin/FormWrapper";
import { useCreateConcours, useUpdateConcours, useConcoursDetail } from "@/service/concoursService";
import { ConcoursCreationRequest, ConcoursUpdateRequest, NiveauType, StatusType } from "@/types/concoursType";

const inputCls = "mt-1 block w-full border border-amame-border rounded-xl py-2 px-3 text-sm text-amame-charcoal focus:outline-none focus:ring-1 focus:ring-amame-green focus:border-amame-green transition-colors bg-white";
const labelCls = "block text-sm font-medium text-amame-charcoal";

const ConcoursForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const { data: existingConcours, isLoading: isLoadingConcours } = useConcoursDetail(
    parseInt(id || "0"), { enabled: isEditing }
  );
  const createMutation = useCreateConcours();
  const updateMutation = useUpdateConcours();

  const [formData, setFormData] = useState<ConcoursCreationRequest>({
    nom: "", description: "", pays: "",
    niveau: "LICENCE" as NiveauType, status: "NATIONAL" as StatusType,
    dateOuverture: "", dateLimite: "", lienOfficiel: "",
  });
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (existingConcours && isEditing) {
      setFormData({
        nom: existingConcours.nom, description: existingConcours.description,
        pays: existingConcours.pays, niveau: existingConcours.niveau,
        status: existingConcours.status,
        dateOuverture: existingConcours.dateOuverture?.slice(0, 10) ?? "",
        dateLimite: existingConcours.dateLimite?.slice(0, 10) ?? "",
        lienOfficiel: existingConcours.lienOfficiel,
      });
      setIsAvailable(existingConcours.isAvailable);
    }
  }, [existingConcours, isEditing]);

  const toDateTime = (date: string) => date ? `${date}T00:00:00` : date;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      dateOuverture: toDateTime(formData.dateOuverture),
      dateLimite: toDateTime(formData.dateLimite),
    };
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: parseInt(id!),
          request: { ...payload, id: parseInt(id!), isAvailable } as ConcoursUpdateRequest,
          file: selectedFile || undefined,
        });
      } else {
        await createMutation.mutateAsync({ request: payload, file: selectedFile || undefined });
      }
      navigate("/admin/concours");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const isLoading = isLoadingConcours || createMutation.isPending || updateMutation.isPending;

  return (
    <FormWrapper
      title={isEditing ? "Modifier le concours" : "Créer un concours"}
      subtitle={isEditing ? "Modifiez les informations du concours" : "Remplissez les informations pour créer un nouveau concours"}
      backUrl="/admin/concours"
      isLoading={isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations */}
        <div>
          <h2 className="text-sm font-semibold text-amame-charcoal uppercase tracking-wide mb-4 pb-2 border-b border-amame-border">
            Informations
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="nom" className={labelCls}>Nom du concours *</label>
              <input type="text" id="nom" required value={formData.nom}
                onChange={(e) => setFormData((p) => ({ ...p, nom: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label htmlFor="pays" className={labelCls}>Pays *</label>
              <input type="text" id="pays" required value={formData.pays}
                onChange={(e) => setFormData((p) => ({ ...p, pays: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label htmlFor="niveau" className={labelCls}>Niveau *</label>
              <select id="niveau" required value={formData.niveau}
                onChange={(e) => setFormData((p) => ({ ...p, niveau: e.target.value as NiveauType }))}
                className={inputCls}>
                <option value="BACHELIER">Bachelier</option>
                <option value="LICENCE">Licence</option>
                <option value="MASTER">Master</option>
                <option value="DOCTORAT">Doctorat</option>
              </select>
            </div>
            <div>
              <label htmlFor="status" className={labelCls}>Statut *</label>
              <select id="status" required value={formData.status}
                onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as StatusType }))}
                className={inputCls}>
                <option value="NATIONAL">National</option>
                <option value="INTERNATIONAL">International</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dates & Liens */}
        <div>
          <h2 className="text-sm font-semibold text-amame-charcoal uppercase tracking-wide mb-4 pb-2 border-b border-amame-border">
            Dates & Liens
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="dateOuverture" className={labelCls}>Date d'ouverture *</label>
              <input type="date" id="dateOuverture" required value={formData.dateOuverture}
                onChange={(e) => setFormData((p) => ({ ...p, dateOuverture: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label htmlFor="dateLimite" className={labelCls}>Date limite *</label>
              <input type="date" id="dateLimite" required value={formData.dateLimite}
                onChange={(e) => setFormData((p) => ({ ...p, dateLimite: e.target.value }))}
                className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="lienOfficiel" className={labelCls}>Lien officiel *</label>
              <input type="url" id="lienOfficiel" required value={formData.lienOfficiel}
                onChange={(e) => setFormData((p) => ({ ...p, lienOfficiel: e.target.value }))}
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

        {/* Description */}
        <div>
          <label htmlFor="description" className={labelCls}>Description *</label>
          <textarea id="description" rows={6} required value={formData.description}
            onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
            className={inputCls} />
        </div>

        {/* Disponibilité */}
        {isEditing && (
          <div className="flex items-center gap-3 p-4 bg-amame-green-subtle/50 border border-amame-green/20 rounded-xl">
            <input type="checkbox" id="isAvailable" checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="h-4 w-4 text-amame-green focus:ring-amame-green border-amame-border rounded transition-colors" />
            <label htmlFor="isAvailable" className="text-sm text-amame-charcoal cursor-pointer">
              <span className="font-semibold">Concours actif</span> — visible par les visiteurs du site
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end items-center gap-3 pt-4 border-t border-amame-border">
          <button type="button" onClick={() => navigate("/admin/concours")}
            className="py-2 px-4 border border-amame-border rounded-xl text-sm font-semibold text-amame-slate hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amame-green transition-colors">
            Annuler
          </button>
          <button type="submit" disabled={isLoading}
            className="inline-flex justify-center py-2 px-5 border border-transparent rounded-xl text-sm font-semibold text-white bg-amame-green hover:bg-amame-green-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amame-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {isLoading ? "Sauvegarde..." : isEditing ? "Mettre à jour" : "Créer le concours"}
          </button>
        </div>
      </form>
    </FormWrapper>
  );
};

export default ConcoursForm;
