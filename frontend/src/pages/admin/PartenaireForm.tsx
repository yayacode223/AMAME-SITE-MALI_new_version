import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FormWrapper from "@/components/admin/FormWrapper";
import { useGetAllPartenairesAdmin, useCreatePartenaire, useUpdatePartenaire } from "@/service/partenaireService";
import { PartenaireRequest } from "@/types/partenaireType";
import { toast } from "@/hooks/use-toast";

const TYPES = ["Partenaire", "Collaborateur", "Sponsor", "Soutien institutionnel"];

const PartenaireForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const { data: partenaires } = useGetAllPartenairesAdmin();
  const createMutation = useCreatePartenaire();
  const updateMutation = useUpdatePartenaire();

  const existing = isEditing ? partenaires?.find(p => p.id === Number(id)) : undefined;

  const [formData, setFormData] = useState<PartenaireRequest>({
    nom: "",
    type: "Partenaire",
    description: "",
    siteWeb: "",
    ordre: 0,
    isActif: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (existing && isEditing) {
      setFormData({
        nom: existing.nom || "",
        type: existing.type || "Partenaire",
        description: existing.description || "",
        siteWeb: existing.siteWeb || "",
        ordre: existing.ordre ?? 0,
        isActif: existing.isActif ?? true,
      });
    }
  }, [existing, isEditing]);

  const handleChange = (field: keyof PartenaireRequest) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === "checkbox"
      ? (e.target as HTMLInputElement).checked
      : e.target.type === "number"
      ? Number(e.target.value)
      : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: Number(id), request: formData, file: selectedFile ?? undefined });
        toast({ title: "Partenaire mis à jour avec succès" });
      } else {
        await createMutation.mutateAsync({ request: formData, file: selectedFile ?? undefined });
        toast({ title: "Partenaire créé avec succès" });
      }
      navigate("/admin/partenaires");
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <FormWrapper
      title={isEditing ? "Modifier le partenaire" : "Nouveau partenaire"}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      backPath="/admin/partenaires"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nom */}
        <div>
          <label className="block text-sm font-semibold text-amame-charcoal mb-1.5">
            Nom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.nom}
            onChange={handleChange("nom")}
            required
            placeholder="Nom du partenaire"
            className="w-full h-11 px-4 rounded-xl border border-amame-border focus:border-amame-green focus:ring-2 focus:ring-amame-green/20 outline-none text-sm transition-colors"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-semibold text-amame-charcoal mb-1.5">Type</label>
          <select
            value={formData.type}
            onChange={handleChange("type")}
            className="w-full h-11 px-4 rounded-xl border border-amame-border focus:border-amame-green focus:ring-2 focus:ring-amame-green/20 outline-none text-sm transition-colors bg-white"
          >
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Site web */}
        <div>
          <label className="block text-sm font-semibold text-amame-charcoal mb-1.5">Site web</label>
          <input
            type="url"
            value={formData.siteWeb}
            onChange={handleChange("siteWeb")}
            placeholder="https://example.com"
            className="w-full h-11 px-4 rounded-xl border border-amame-border focus:border-amame-green focus:ring-2 focus:ring-amame-green/20 outline-none text-sm transition-colors"
          />
        </div>

        {/* Ordre */}
        <div>
          <label className="block text-sm font-semibold text-amame-charcoal mb-1.5">Ordre d'affichage</label>
          <input
            type="number"
            value={formData.ordre}
            onChange={handleChange("ordre")}
            min={0}
            className="w-full h-11 px-4 rounded-xl border border-amame-border focus:border-amame-green focus:ring-2 focus:ring-amame-green/20 outline-none text-sm transition-colors"
          />
        </div>

        {/* Logo */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-amame-charcoal mb-1.5">Logo / Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-amame-muted file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amame-green-subtle file:text-amame-green hover:file:bg-amame-green-light transition-colors cursor-pointer"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-amame-charcoal mb-1.5">Description</label>
          <textarea
            value={formData.description}
            onChange={handleChange("description")}
            rows={4}
            placeholder="Description du partenaire ou de la collaboration..."
            className="w-full px-4 py-3 rounded-xl border border-amame-border focus:border-amame-green focus:ring-2 focus:ring-amame-green/20 outline-none text-sm transition-colors resize-none"
          />
        </div>

        {/* Statut */}
        <div className="md:col-span-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActif ?? true}
              onChange={handleChange("isActif")}
              className="h-4 w-4 rounded border-amame-border text-amame-green focus:ring-amame-green"
            />
            <span className="text-sm font-semibold text-amame-charcoal">Partenaire actif (visible sur le site)</span>
          </label>
        </div>
      </div>
    </FormWrapper>
  );
};

export default PartenaireForm;
