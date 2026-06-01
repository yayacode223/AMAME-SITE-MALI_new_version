import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FormWrapper from "@/components/admin/FormWrapper";
import { useGetAllMembresAdmin, useCreateMembre, useUpdateMembre } from "@/service/membreService";
import { MembreRequest } from "@/types/membreType";
import { toast } from "@/hooks/use-toast";

const POSTES_SUGGESTIONS = [
  "Président(e)",
  "Vice-Président(e)",
  "Secrétaire Général(e)",
  "Trésorier(e)",
  "Responsable Communication",
  "Responsable Technique",
  "Membre Actif",
  "Conseiller(e)",
];

const MembreForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const { data: membres } = useGetAllMembresAdmin();
  const createMutation = useCreateMembre();
  const updateMutation = useUpdateMembre();

  const existing = isEditing ? membres?.find(m => m.id === Number(id)) : undefined;

  const [formData, setFormData] = useState<MembreRequest>({
    prenom: "",
    nom: "",
    poste: "",
    bio: "",
    email: "",
    ordre: 0,
    isActif: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (existing && isEditing) {
      setFormData({
        prenom: existing.prenom || "",
        nom: existing.nom || "",
        poste: existing.poste || "",
        bio: existing.bio || "",
        email: existing.email || "",
        ordre: existing.ordre ?? 0,
        isActif: existing.isActif ?? true,
      });
    }
  }, [existing, isEditing]);

  const handleChange = (field: keyof MembreRequest) => (
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
        toast({ title: "Membre mis à jour avec succès" });
      } else {
        await createMutation.mutateAsync({ request: formData, file: selectedFile ?? undefined });
        toast({ title: "Membre créé avec succès" });
      }
      navigate("/admin/membres");
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <FormWrapper
      title={isEditing ? "Modifier le membre" : "Nouveau membre"}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      backPath="/admin/membres"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Prénom */}
        <div>
          <label className="block text-sm font-semibold text-amame-charcoal mb-1.5">
            Prénom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.prenom}
            onChange={handleChange("prenom")}
            required
            placeholder="Prénom du membre"
            className="w-full h-11 px-4 rounded-xl border border-amame-border focus:border-amame-green focus:ring-2 focus:ring-amame-green/20 outline-none text-sm transition-colors"
          />
        </div>

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
            placeholder="Nom du membre"
            className="w-full h-11 px-4 rounded-xl border border-amame-border focus:border-amame-green focus:ring-2 focus:ring-amame-green/20 outline-none text-sm transition-colors"
          />
        </div>

        {/* Poste */}
        <div>
          <label className="block text-sm font-semibold text-amame-charcoal mb-1.5">
            Poste <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.poste}
            onChange={handleChange("poste")}
            required
            placeholder="Ex: Président(e), Trésorier(e)..."
            list="postes-suggestions"
            className="w-full h-11 px-4 rounded-xl border border-amame-border focus:border-amame-green focus:ring-2 focus:ring-amame-green/20 outline-none text-sm transition-colors"
          />
          <datalist id="postes-suggestions">
            {POSTES_SUGGESTIONS.map(p => <option key={p} value={p} />)}
          </datalist>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-amame-charcoal mb-1.5">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={handleChange("email")}
            placeholder="email@exemple.com"
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
          <p className="text-xs text-amame-muted mt-1">0 = affiché en premier</p>
        </div>

        {/* Photo */}
        <div>
          <label className="block text-sm font-semibold text-amame-charcoal mb-1.5">Photo de profil</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-amame-muted file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amame-green-subtle file:text-amame-green hover:file:bg-amame-green-light transition-colors cursor-pointer"
          />
        </div>

        {/* Bio */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-amame-charcoal mb-1.5">Biographie</label>
          <textarea
            value={formData.bio}
            onChange={handleChange("bio")}
            rows={4}
            placeholder="Courte biographie du membre..."
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
            <span className="text-sm font-semibold text-amame-charcoal">Membre actif (visible sur le site)</span>
          </label>
        </div>
      </div>
    </FormWrapper>
  );
};

export default MembreForm;
