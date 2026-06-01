import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FormWrapper from "@/components/admin/FormWrapper";
import {
  useGetLiensUtilesAdmin,
  useCreateLienUtile,
  useUpdateLienUtile,
} from "@/service/lienUtileService";
import { LienUtileRequest } from "@/types/lienUtileType";
import { toast } from "@/hooks/use-toast";

const CATEGORIES = ["Bourses", "Concours", "Orientation", "Emploi", "Formation", "Gouvernement", "Autre"];

const LienUtileForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const { data: liens } = useGetLiensUtilesAdmin();
  const createMutation = useCreateLienUtile();
  const updateMutation = useUpdateLienUtile();

  const existing = isEditing ? liens?.find(l => l.id === Number(id)) : undefined;

  const [formData, setFormData] = useState<LienUtileRequest>({
    titre: "",
    description: "",
    url: "",
    categorie: "",
    ordre: 0,
    isActif: true,
  });

  useEffect(() => {
    if (existing && isEditing) {
      setFormData({
        titre: existing.titre || "",
        description: existing.description || "",
        url: existing.url || "",
        categorie: existing.categorie || "",
        ordre: existing.ordre ?? 0,
        isActif: existing.isActif ?? true,
      });
    }
  }, [existing, isEditing]);

  const handleChange = (field: keyof LienUtileRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.type === "number" ? Number(e.target.value)
        : e.target.value;
      setFormData(prev => ({ ...prev, [field]: value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: Number(id), request: formData });
        toast({ title: "Lien mis à jour avec succès" });
      } else {
        await createMutation.mutateAsync(formData);
        toast({ title: "Lien créé avec succès" });
      }
      navigate("/admin/liens-utiles");
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <FormWrapper
      title={isEditing ? "Modifier le lien" : "Nouveau lien utile"}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      backPath="/admin/liens-utiles"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Titre */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-amame-charcoal mb-1.5">
            Titre <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.titre}
            onChange={handleChange("titre")}
            required
            placeholder="Ex: Campus France Mali"
            className="w-full h-11 px-4 rounded-xl border border-amame-border focus:border-amame-green focus:ring-2 focus:ring-amame-green/20 outline-none text-sm transition-colors"
          />
        </div>

        {/* URL */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-amame-charcoal mb-1.5">
            URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={formData.url}
            onChange={handleChange("url")}
            required
            placeholder="https://www.exemple.com"
            className="w-full h-11 px-4 rounded-xl border border-amame-border focus:border-amame-green focus:ring-2 focus:ring-amame-green/20 outline-none text-sm transition-colors"
          />
        </div>

        {/* Catégorie */}
        <div>
          <label className="block text-sm font-semibold text-amame-charcoal mb-1.5">Catégorie</label>
          <select
            value={formData.categorie || ""}
            onChange={handleChange("categorie")}
            className="w-full h-11 px-4 rounded-xl border border-amame-border focus:border-amame-green focus:ring-2 focus:ring-amame-green/20 outline-none text-sm transition-colors bg-white"
          >
            <option value="">Sélectionner une catégorie</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Ordre */}
        <div>
          <label className="block text-sm font-semibold text-amame-charcoal mb-1.5">Ordre</label>
          <input
            type="number"
            value={formData.ordre}
            onChange={handleChange("ordre")}
            min={0}
            className="w-full h-11 px-4 rounded-xl border border-amame-border focus:border-amame-green focus:ring-2 focus:ring-amame-green/20 outline-none text-sm transition-colors"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-amame-charcoal mb-1.5">Description</label>
          <textarea
            value={formData.description}
            onChange={handleChange("description")}
            rows={3}
            placeholder="Brève description de ce lien..."
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
            <span className="text-sm font-semibold text-amame-charcoal">Lien actif (visible sur le site)</span>
          </label>
        </div>
      </div>
    </FormWrapper>
  );
};

export default LienUtileForm;
