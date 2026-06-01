import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FormWrapper from "@/components/admin/FormWrapper";
import { useCreateArticle, useUpdateArticle, useGetArticleById } from "@/service/articleService";
import { ArticleCreationRequest, ArticleUpdateRequest } from "@/types/articleType";

const inputCls = "mt-1 block w-full border border-amame-border rounded-xl py-2 px-3 text-sm text-amame-charcoal focus:outline-none focus:ring-1 focus:ring-amame-green focus:border-amame-green transition-colors bg-white";
const labelCls = "block text-sm font-medium text-amame-charcoal";

const PosteForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const { data: existingPoste, isLoading: isLoadingPoste } = useGetArticleById(
    parseInt(id || "0"), { enabled: isEditing }
  );
  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle();

  const [formData, setFormData] = useState<ArticleCreationRequest>({
    titre: "", contenu: "", auteur: "", categorie: "POSTES",
    tempsLecture: 3, tags: [], metaDescription: "", metaKeywords: "",
  });
  const [estPublie, setEstPublie] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (existingPoste && isEditing) {
      setFormData({
        titre: existingPoste.titre, contenu: existingPoste.contenu,
        auteur: existingPoste.auteur, categorie: "POSTES",
        tempsLecture: existingPoste.tempsLecture, tags: existingPoste.tags,
        metaDescription: existingPoste.metaDescription,
        metaKeywords: existingPoste.metaKeywords,
      });
      setEstPublie(existingPoste.estPublie);
    }
  }, [existingPoste, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: parseInt(id!),
          request: { ...formData, estPublie } as ArticleUpdateRequest,
          file: selectedFile || undefined,
        });
      } else {
        await createMutation.mutateAsync({ request: formData, file: selectedFile || undefined });
      }
      navigate("/admin/postes");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((p) => ({ ...p, tags: [...p.tags, tagInput.trim()] }));
      setTagInput("");
    }
  };

  const isLoading = isLoadingPoste || createMutation.isPending || updateMutation.isPending;

  return (
    <FormWrapper
      title={isEditing ? "Modifier le poste" : "Créer un poste"}
      subtitle={isEditing ? "Modifiez les informations du poste" : "Remplissez les informations pour créer un nouveau poste"}
      backUrl="/admin/postes"
      isLoading={isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="titre" className={labelCls}>Titre *</label>
            <input type="text" id="titre" required value={formData.titre}
              onChange={(e) => setFormData((p) => ({ ...p, titre: e.target.value }))}
              className={inputCls} />
          </div>
          <div>
            <label htmlFor="auteur" className={labelCls}>Auteur *</label>
            <input type="text" id="auteur" required value={formData.auteur}
              onChange={(e) => setFormData((p) => ({ ...p, auteur: e.target.value }))}
              className={inputCls} />
          </div>
          <div>
            <label htmlFor="tempsLecture" className={labelCls}>Temps de lecture (min) *</label>
            <input type="number" id="tempsLecture" min="1" required value={formData.tempsLecture}
              onChange={(e) => setFormData((p) => ({ ...p, tempsLecture: parseInt(e.target.value) }))}
              className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="image" className={labelCls}>Image de couverture</label>
            <input type="file" id="image" accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-amame-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-amame-green-subtle file:text-amame-green hover:file:bg-amame-green-light transition-colors" />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className={labelCls}>Tags</label>
          <div className="mt-1 flex gap-2">
            <input type="text" value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
              className={inputCls} placeholder="Ajouter un tag puis Entrée" />
            <button type="button" onClick={handleAddTag}
              className="px-4 py-2 border border-transparent rounded-xl text-sm font-semibold text-white bg-amame-green hover:bg-amame-green-dark transition-colors shrink-0">
              Ajouter
            </button>
          </div>
          {formData.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {formData.tags.map((tag, i) => (
                <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amame-green-subtle text-amame-green-dark border border-amame-green/15">
                  {tag}
                  <button type="button"
                    onClick={() => setFormData((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }))}
                    className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amame-green/20 hover:bg-amame-green/30 transition-colors">
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Contenu */}
        <div>
          <label htmlFor="contenu" className={labelCls}>Contenu *</label>
          <textarea id="contenu" rows={12} required value={formData.contenu}
            onChange={(e) => setFormData((p) => ({ ...p, contenu: e.target.value }))}
            className={inputCls} />
        </div>

        {/* SEO */}
        <div>
          <h2 className="text-sm font-semibold text-amame-charcoal uppercase tracking-wide mb-4 pb-2 border-b border-amame-border">
            SEO (optionnel)
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="metaDescription" className={labelCls}>Meta Description</label>
              <textarea id="metaDescription" rows={2} value={formData.metaDescription}
                onChange={(e) => setFormData((p) => ({ ...p, metaDescription: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label htmlFor="metaKeywords" className={labelCls}>Meta Keywords</label>
              <input type="text" id="metaKeywords" value={formData.metaKeywords}
                onChange={(e) => setFormData((p) => ({ ...p, metaKeywords: e.target.value }))}
                placeholder="mot-clé1, mot-clé2" className={inputCls} />
            </div>
          </div>
        </div>

        {/* Statut */}
        {isEditing ? (
          <div className="flex items-center gap-3 p-4 bg-amame-green-subtle/50 border border-amame-green/20 rounded-xl">
            <input type="checkbox" id="estPublie" checked={estPublie}
              onChange={(e) => setEstPublie(e.target.checked)}
              className="h-4 w-4 text-amame-green focus:ring-amame-green border-amame-border rounded transition-colors" />
            <label htmlFor="estPublie" className="text-sm text-amame-charcoal cursor-pointer">
              <span className="font-semibold">Poste publié</span> — visible par les visiteurs du site
            </label>
          </div>
        ) : (
          <p className="text-sm text-amame-muted italic p-3 bg-amame-gold-subtle/50 border border-amame-gold/20 rounded-xl">
            ℹ️ Le poste sera créé en <strong>brouillon</strong>. Vous pourrez le publier depuis la page d'édition.
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end items-center gap-3 pt-4 border-t border-amame-border">
          <button type="button" onClick={() => navigate("/admin/postes")}
            className="py-2 px-4 border border-amame-border rounded-xl text-sm font-semibold text-amame-slate hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amame-green transition-colors">
            Annuler
          </button>
          <button type="submit" disabled={isLoading}
            className="inline-flex justify-center py-2 px-5 border border-transparent rounded-xl text-sm font-semibold text-white bg-amame-green hover:bg-amame-green-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amame-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {isLoading ? "Sauvegarde..." : isEditing ? "Mettre à jour" : "Créer le poste"}
          </button>
        </div>
      </form>
    </FormWrapper>
  );
};

export default PosteForm;
