import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FormWrapper from "@/components/admin/FormWrapper";
import {
  useGetEtablissementsAdmin,
  useCreateEtablissement,
  useUpdateEtablissement,
  EtablissementRequest,
} from "@/service/etablissementService";
import { toast } from "@/hooks/use-toast";

const TYPES = [
  "Université publique",
  "Université privée",
  "Grande école",
  "Institut",
  "École supérieure",
  "Centre de formation",
  "Autre",
];

const UniversiteForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const { data: etablissements } = useGetEtablissementsAdmin();
  const createMutation = useCreateEtablissement();
  const updateMutation = useUpdateEtablissement();

  const existing = isEditing ? etablissements?.content?.find(e => e.id === Number(id)) : undefined;

  const [formData, setFormData] = useState<EtablissementRequest>({
    nom: "",
    typeEtablissement: "",
    lieu: "",
    urlDetailEtablissement: "",
    urlLogo: "",
    urlImage: "",
    sourceSite: "",
  });

  useEffect(() => {
    if (existing && isEditing) {
      setFormData({
        nom: existing.nom || "",
        typeEtablissement: existing.typeEtablissement || "",
        lieu: existing.lieu || "",
        urlDetailEtablissement: existing.urlDetailEtablissement || "",
        urlLogo: existing.urlLogo || "",
        urlImage: existing.url_image || "",
        sourceSite: "",
      });
    }
  }, [existing, isEditing]);

  const handleChange = (field: keyof EtablissementRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: Number(id), request: formData });
        toast({ title: "Établissement mis à jour avec succès" });
      } else {
        await createMutation.mutateAsync(formData);
        toast({ title: "Établissement créé avec succès" });
      }
      navigate("/admin/universites");
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const Field = ({ label, field, type = "text", placeholder, required = false }: {
    label: string; field: keyof EtablissementRequest; type?: string;
    placeholder?: string; required?: boolean;
  }) => (
    <div>
      <label className="block text-sm font-semibold text-amame-charcoal mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={formData[field] as string || ""}
        onChange={handleChange(field)}
        required={required}
        placeholder={placeholder}
        className="w-full h-11 px-4 rounded-xl border border-amame-border focus:border-amame-green focus:ring-2 focus:ring-amame-green/20 outline-none text-sm transition-colors"
      />
    </div>
  );

  return (
    <FormWrapper
      title={isEditing ? "Modifier l'établissement" : "Nouvel établissement"}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      backPath="/admin/universites"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nom */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-amame-charcoal mb-1.5">
            Nom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.nom}
            onChange={handleChange("nom")}
            required
            placeholder="Université de Bamako"
            className="w-full h-11 px-4 rounded-xl border border-amame-border focus:border-amame-green focus:ring-2 focus:ring-amame-green/20 outline-none text-sm transition-colors"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-semibold text-amame-charcoal mb-1.5">Type d'établissement</label>
          <select
            value={formData.typeEtablissement || ""}
            onChange={handleChange("typeEtablissement")}
            className="w-full h-11 px-4 rounded-xl border border-amame-border focus:border-amame-green focus:ring-2 focus:ring-amame-green/20 outline-none text-sm transition-colors bg-white"
          >
            <option value="">Sélectionner un type</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Lieu */}
        <Field label="Lieu / Ville" field="lieu" placeholder="Bamako, Mali" />

        {/* URL détail */}
        <div className="md:col-span-2">
          <Field label="URL du site officiel" field="urlDetailEtablissement"
            type="url" placeholder="https://www.universite.ml" />
        </div>

        {/* URL Logo */}
        <Field label="URL du logo" field="urlLogo" type="url" placeholder="https://..." />

        {/* URL Image */}
        <Field label="URL de l'image" field="urlImage" type="url" placeholder="https://..." />

        {/* Source */}
        <div className="md:col-span-2">
          <Field label="Source du site" field="sourceSite" placeholder="Ex: campusmali.ml" />
        </div>
      </div>
    </FormWrapper>
  );
};

export default UniversiteForm;
