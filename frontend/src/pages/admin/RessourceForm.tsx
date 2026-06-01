import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FormWrapper from "@/components/admin/FormWrapper";
import {
  useGetRessourcesAdmin,
  useCreateRessource,
  useUpdateRessource,
} from "@/service/ressourceAcademiqueService";
import { RessourceAcademiqueRequest } from "@/types/ressourceAcademiqueType";
import { toast } from "@/hooks/use-toast";

const TYPES = [
  "Cours", "Guide", "Formulaire", "Annales", "Syllabus",
  "Règlement", "Brochure", "Autre",
];

const NIVEAUX = [
  "Lycée", "Terminale", "Licence", "Master", "Doctorat",
  "BTS / DUT", "Tous niveaux",
];

const RessourceForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const { data: ressources } = useGetRessourcesAdmin();
  const createMutation = useCreateRessource();
  const updateMutation = useUpdateRessource();

  const existing = isEditing ? ressources?.content?.find(r => r.id === Number(id)) : undefined;

  const [formData, setFormData] = useState<RessourceAcademiqueRequest>({
    titre: "",
    description: "",
    type: "",
    niveau: "",
    ordre: 0,
    isActif: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (existing && isEditing) {
      setFormData({
        titre: existing.titre || "",
        description: existing.description || "",
        type: existing.type || "",
        niveau: existing.niveau || "",
        ordre: existing.ordre ?? 0,
        isActif: existing.isActif ?? true,
      });
    }
  }, [existing, isEditing]);

  const handleChange = (field: keyof RessourceAcademiqueRequest) =>
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
        await updateMutation.mutateAsync({ id: Number(id), request: formData, file: selectedFile ?? undefined });
        toast({ title: "Ressource mise à jour avec succès" });
      } else {
        await createMutation.mutateAsync({ request: formData, file: selectedFile ?? undefined });
        toast({ title: "Ressource créée avec succès" });
      }
      navigate("/admin/ressources");
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <FormWrapper
      title={isEditing ? "Modifier la ressource" : "Nouvelle ressource académique"}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      backPath="/admin/ressources"
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
            placeholder="Ex: Guide d'orientation 2024"
            className="w-full h-11 px-4 rounded-xl border border-amame-border focus:border-amame-green focus:ring-2 focus:ring-amame-green/20 outline-none text-sm transition-colors"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-semibold text-amame-charcoal mb-1.5">Type de ressource</label>
          <select
            value={formData.type || ""}
            onChange={handleChange("type")}
            className="w-full h-11 px-4 rounded-xl border border-amame-border focus:border-amame-green focus:ring-2 focus:ring-amame-green/20 outline-none text-sm transition-colors bg-white"
          >
            <option value="">Sélectionner un type</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Niveau */}
        <div>
          <label className="block text-sm font-semibold text-amame-charcoal mb-1.5">Niveau ciblé</label>
          <select
            value={formData.niveau || ""}
            onChange={handleChange("niveau")}
            className="w-full h-11 px-4 rounded-xl border border-amame-border focus:border-amame-green focus:ring-2 focus:ring-amame-green/20 outline-none text-sm transition-colors bg-white"
          >
            <option value="">Tous les niveaux</option>
            {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {/* Fichier PDF */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-amame-charcoal mb-1.5">
            Document (PDF, DOC...)
            {isEditing && existing?.filePath && (
              <span className="ml-2 text-xs font-normal text-amame-green">
                — Un fichier existe déjà (laisser vide pour ne pas le remplacer)
              </span>
            )}
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx"
            onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-amame-muted file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amame-green-subtle file:text-amame-green hover:file:bg-amame-green-light transition-colors cursor-pointer"
          />
          <p className="text-xs text-amame-muted mt-1">Formats acceptés : PDF, DOC, DOCX, PPT, PPTX (max 5MB)</p>
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

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-amame-charcoal mb-1.5">Description</label>
          <textarea
            value={formData.description}
            onChange={handleChange("description")}
            rows={3}
            placeholder="Brève description de cette ressource..."
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
            <span className="text-sm font-semibold text-amame-charcoal">
              Ressource active (visible sur le site)
            </span>
          </label>
        </div>
      </div>
    </FormWrapper>
  );
};

export default RessourceForm;
