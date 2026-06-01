import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FormWrapper from "@/components/admin/FormWrapper";
import { useCreateGalerie, useUpdateGalerie, useGetGalerieById } from "@/service/galerieService";
import { GalerieCreationRequest, GalerieUpdateRequest } from "@/types/galerieType";

const inputCls = "mt-1 block w-full border border-amame-border rounded-xl py-2 px-3 text-sm text-amame-charcoal focus:outline-none focus:ring-1 focus:ring-amame-green focus:border-amame-green transition-colors bg-white";
const labelCls = "block text-sm font-medium text-amame-charcoal";

const GalerieForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const { data: existingGalerie, isLoading: isLoadingGalerie } = useGetGalerieById(
    parseInt(id || "0"), { enabled: isEditing }
  );
  const createMutation = useCreateGalerie();
  const updateMutation = useUpdateGalerie();

  const [formData, setFormData] = useState<GalerieCreationRequest>({
    titre: "", description: "", lieu: "", dateEvenement: "",
  });
  const [estPublie, setEstPublie] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (existingGalerie && isEditing) {
      setFormData({
        titre: existingGalerie.titre,
        description: existingGalerie.description ?? "",
        lieu: existingGalerie.lieu ?? "",
        dateEvenement: existingGalerie.dateEvenement ?? "",
      });
      setEstPublie(existingGalerie.estPublie);
    }
  }, [existingGalerie, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: parseInt(id!),
          request: { id: parseInt(id!), ...formData, estPublie } as GalerieUpdateRequest,
          file: selectedFile || undefined,
        });
      } else {
        await createMutation.mutateAsync({ request: formData, file: selectedFile || undefined });
      }
      navigate("/admin/galeries");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const isLoading = isLoadingGalerie || createMutation.isPending || updateMutation.isPending;

  return (
    <FormWrapper
      title={isEditing ? "Modifier la galerie" : "Créer une galerie"}
      subtitle={isEditing ? "Modifiez les informations de la galerie" : "Remplissez les informations pour créer une nouvelle galerie"}
      backUrl="/admin/galeries"
      isLoading={isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Titre */}
          <div className="sm:col-span-2">
            <label htmlFor="titre" className={labelCls}>Titre *</label>
            <input type="text" id="titre" required value={formData.titre}
              onChange={(e) => setFormData((p) => ({ ...p, titre: e.target.value }))}
              placeholder="Ex : Cérémonie de remise des prix 2025"
              className={inputCls} />
          </div>

          {/* Lieu */}
          <div>
            <label htmlFor="lieu" className={labelCls}>Lieu</label>
            <input type="text" id="lieu" value={formData.lieu}
              onChange={(e) => setFormData((p) => ({ ...p, lieu: e.target.value }))}
              placeholder="Ex : Bamako, Mali" className={inputCls} />
          </div>

          {/* Date événement */}
          <div>
            <label htmlFor="dateEvenement" className={labelCls}>Date de l'événement</label>
            <input type="date" id="dateEvenement" value={formData.dateEvenement}
              onChange={(e) => setFormData((p) => ({ ...p, dateEvenement: e.target.value }))}
              className={inputCls} />
          </div>

          {/* Image de couverture */}
          <div className="sm:col-span-2">
            <label htmlFor="image" className={labelCls}>Image de couverture</label>
            <input type="file" id="image" accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-amame-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-amame-green-subtle file:text-amame-green hover:file:bg-amame-green-light transition-colors" />
            {isEditing && existingGalerie?.coverImagePath && !selectedFile && (
              <p className="mt-1 text-xs text-amame-muted">
                Une image de couverture existe déjà. Sélectionnez un nouveau fichier pour la remplacer.
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className={labelCls}>Description</label>
          <textarea id="description" rows={5} value={formData.description}
            onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
            placeholder="Décrivez l'événement photographié..."
            className={inputCls} />
        </div>

        {/* Statut */}
        <div className="flex items-center gap-3 p-4 bg-amame-green-subtle/50 border border-amame-green/20 rounded-xl">
          <input type="checkbox" id="estPublie" checked={estPublie}
            onChange={(e) => setEstPublie(e.target.checked)}
            className="h-4 w-4 text-amame-green focus:ring-amame-green border-amame-border rounded transition-colors" />
          <label htmlFor="estPublie" className="text-sm text-amame-charcoal cursor-pointer">
            <span className="font-semibold">Galerie publiée</span> — visible par les visiteurs du site
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end items-center gap-3 pt-4 border-t border-amame-border">
          <button type="button" onClick={() => navigate("/admin/galeries")}
            className="py-2 px-4 border border-amame-border rounded-xl text-sm font-semibold text-amame-slate hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amame-green transition-colors">
            Annuler
          </button>
          <button type="submit" disabled={isLoading}
            className="inline-flex justify-center py-2 px-5 border border-transparent rounded-xl text-sm font-semibold text-white bg-amame-green hover:bg-amame-green-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amame-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {isLoading ? "Sauvegarde..." : isEditing ? "Mettre à jour" : "Créer la galerie"}
          </button>
        </div>
      </form>
    </FormWrapper>
  );
};

export default GalerieForm;
