import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FormWrapper from "@/components/admin/FormWrapper";
import { useCreateFiliere, useUpdateFiliere, useGetFiliereById } from "@/service/orientationService";
import {
  FiliereCreationRequest, FiliereUpdateRequest,
  DomaineFiliereType, DifficulteType, DemandeType, SalaireType,
} from "@/types/orientationType";

const inputCls = "mt-1 block w-full border border-amame-border rounded-xl py-2 px-3 text-sm text-amame-charcoal focus:outline-none focus:ring-1 focus:ring-amame-green focus:border-amame-green transition-colors bg-white";
const labelCls = "block text-sm font-medium text-amame-charcoal";

const FiliereForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const { data: existingFiliere, isLoading: isLoadingFiliere } = useGetFiliereById(
    parseInt(id || "0"), { enabled: isEditing }
  );
  const createMutation = useCreateFiliere();
  const updateMutation = useUpdateFiliere();

  const [formData, setFormData] = useState<FiliereCreationRequest>({
    nom: "", descriptionCourte: "", descriptionLongue: "",
    domaine: DomaineFiliereType.SCIENCES_ET_TECHNOLOGIES,
    difficulte: DifficulteType.MOYENNE, demande: DemandeType.MOYENNE,
    salaire: SalaireType.MOYEN, dureeEtudes: "", tauxEmploi: "",
    salaireDebut: "", salaireExperience: "", perspectives: "",
    debouches: [], competences: [], universites: [], prerequis: [],
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deboucheInput, setDeboucheInput] = useState("");
  const [competenceInput, setCompetenceInput] = useState("");
  const [universiteInput, setUniversiteInput] = useState("");
  const [prerequisInput, setPrerequisInput] = useState("");

  useEffect(() => {
    if (existingFiliere && isEditing) {
      setFormData({
        nom: existingFiliere.nom, descriptionCourte: existingFiliere.descriptionCourte,
        descriptionLongue: existingFiliere.descriptionLongue,
        domaine: existingFiliere.domaine, difficulte: existingFiliere.difficulte,
        demande: existingFiliere.demande, salaire: existingFiliere.salaire,
        dureeEtudes: existingFiliere.dureeEtudes, tauxEmploi: existingFiliere.tauxEmploi,
        salaireDebut: existingFiliere.salaireDebut, salaireExperience: existingFiliere.salaireExperience,
        perspectives: existingFiliere.perspectives, debouches: existingFiliere.debouches,
        competences: existingFiliere.competences, universites: existingFiliere.universites,
        prerequis: existingFiliere.prerequis,
      });
    }
  }, [existingFiliere, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: parseInt(id!),
          request: { ...formData, id: parseInt(id!) } as FiliereUpdateRequest,
          file: selectedFile || undefined,
        });
      } else {
        await createMutation.mutateAsync({ request: formData, file: selectedFile || undefined });
      }
      navigate("/admin/filieres");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const addToList = (list: keyof FiliereCreationRequest, value: string, setInput: (v: string) => void) => {
    if (value.trim() && !(formData[list] as string[]).includes(value.trim())) {
      setFormData((p) => ({ ...p, [list]: [...(p[list] as string[]), value.trim()] }));
      setInput("");
    }
  };

  const removeFromList = (list: keyof FiliereCreationRequest, value: string) => {
    setFormData((p) => ({ ...p, [list]: (p[list] as string[]).filter((i) => i !== value) }));
  };

  const renderListInput = (
    label: string, list: keyof FiliereCreationRequest,
    inputValue: string, setInputValue: (v: string) => void, placeholder: string
  ) => (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="mt-1 flex gap-2">
        <input type="text" value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addToList(list, inputValue, setInputValue))}
          className={inputCls} placeholder={placeholder} />
        <button type="button" onClick={() => addToList(list, inputValue, setInputValue)}
          className="px-4 py-2 border border-transparent rounded-xl text-sm font-semibold text-white bg-amame-green hover:bg-amame-green-dark transition-colors shrink-0">
          Ajouter
        </button>
      </div>
      {(formData[list] as string[]).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(formData[list] as string[]).map((item, i) => (
            <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amame-green-subtle text-amame-green-dark border border-amame-green/15">
              {item}
              <button type="button" onClick={() => removeFromList(list, item)}
                className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amame-green/20 hover:bg-amame-green/30 transition-colors">
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );

  const isLoading = isLoadingFiliere || createMutation.isPending || updateMutation.isPending;

  return (
    <FormWrapper
      title={isEditing ? "Modifier la filière" : "Créer une filière"}
      subtitle={isEditing ? "Modifiez les informations de la filière" : "Remplissez les informations pour créer une nouvelle filière"}
      backUrl="/admin/filieres"
      isLoading={isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Description */}
        <div>
          <h2 className="text-sm font-semibold text-amame-charcoal uppercase tracking-wide mb-4 pb-2 border-b border-amame-border">
            Description
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="nom" className={labelCls}>Nom de la filière *</label>
              <input type="text" id="nom" required value={formData.nom}
                onChange={(e) => setFormData((p) => ({ ...p, nom: e.target.value }))}
                className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="descriptionCourte" className={labelCls}>Description courte *</label>
              <textarea id="descriptionCourte" rows={3} required value={formData.descriptionCourte}
                onChange={(e) => setFormData((p) => ({ ...p, descriptionCourte: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label htmlFor="domaine" className={labelCls}>Domaine *</label>
              <select id="domaine" required value={formData.domaine}
                onChange={(e) => setFormData((p) => ({ ...p, domaine: e.target.value as DomaineFiliereType }))}
                className={inputCls}>
                <option value={DomaineFiliereType.SCIENCES_ET_TECHNOLOGIES}>Sciences & Technologies</option>
                <option value={DomaineFiliereType.SCIENCES_DE_LA_SANTE}>Sciences de la Santé</option>
                <option value={DomaineFiliereType.SCIENCES_ECONOMIQUES_ET_GESTION}>Sciences Éco & Gestion</option>
                <option value={DomaineFiliereType.DROIT_ET_SCIENCES_POLITIQUES}>Droit & Sciences Politiques</option>
                <option value={DomaineFiliereType.LETTRES_ET_SCIENCES_HUMAINES}>Lettres & Sciences Humaines</option>
                <option value={DomaineFiliereType.ARTS_ET_COMMUNICATION}>Arts & Communication</option>
              </select>
            </div>
            <div>
              <label htmlFor="dureeEtudes" className={labelCls}>Durée des études *</label>
              <input type="text" id="dureeEtudes" required value={formData.dureeEtudes}
                onChange={(e) => setFormData((p) => ({ ...p, dureeEtudes: e.target.value }))}
                placeholder="ex: 3 ans, 5 ans..." className={inputCls} />
            </div>
          </div>
        </div>

        {/* Indicateurs */}
        <div>
          <h2 className="text-sm font-semibold text-amame-charcoal uppercase tracking-wide mb-4 pb-2 border-b border-amame-border">
            Indicateurs
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="difficulte" className={labelCls}>Difficulté *</label>
              <select id="difficulte" required value={formData.difficulte}
                onChange={(e) => setFormData((p) => ({ ...p, difficulte: e.target.value as DifficulteType }))}
                className={inputCls}>
                <option value={DifficulteType.TRES_ELEVEE}>Très élevée</option>
                <option value={DifficulteType.ELEVEE}>Élevée</option>
                <option value={DifficulteType.MOYENNE}>Moyenne</option>
                <option value={DifficulteType.VARIABLE}>Variable</option>
              </select>
            </div>
            <div>
              <label htmlFor="demande" className={labelCls}>Demande marché *</label>
              <select id="demande" required value={formData.demande}
                onChange={(e) => setFormData((p) => ({ ...p, demande: e.target.value as DemandeType }))}
                className={inputCls}>
                <option value={DemandeType.TRES_FORTE}>Très forte</option>
                <option value={DemandeType.FORTE}>Forte</option>
                <option value={DemandeType.MOYENNE}>Moyenne</option>
                <option value={DemandeType.CROISSANTE}>Croissante</option>
                <option value={DemandeType.VARIABLE}>Variable</option>
              </select>
            </div>
            <div>
              <label htmlFor="salaire" className={labelCls}>Salaire moyen *</label>
              <select id="salaire" required value={formData.salaire}
                onChange={(e) => setFormData((p) => ({ ...p, salaire: e.target.value as SalaireType }))}
                className={inputCls}>
                <option value={SalaireType.TRES_ELEVE}>Très élevé</option>
                <option value={SalaireType.ELEVE}>Élevé</option>
                <option value={SalaireType.MOYEN_ELEVE}>Moyen-élevé</option>
                <option value={SalaireType.MOYEN}>Moyen</option>
                <option value={SalaireType.VARIABLE}>Variable</option>
              </select>
            </div>
            <div>
              <label htmlFor="tauxEmploi" className={labelCls}>Taux d'emploi</label>
              <input type="text" id="tauxEmploi" value={formData.tauxEmploi}
                onChange={(e) => setFormData((p) => ({ ...p, tauxEmploi: e.target.value }))}
                placeholder="ex: 85%" className={inputCls} />
            </div>
            <div>
              <label htmlFor="salaireDebut" className={labelCls}>Salaire débutant</label>
              <input type="text" id="salaireDebut" value={formData.salaireDebut}
                onChange={(e) => setFormData((p) => ({ ...p, salaireDebut: e.target.value }))}
                placeholder="ex: 150 000 FCFA/mois" className={inputCls} />
            </div>
            <div>
              <label htmlFor="salaireExperience" className={labelCls}>Salaire expérimenté</label>
              <input type="text" id="salaireExperience" value={formData.salaireExperience}
                onChange={(e) => setFormData((p) => ({ ...p, salaireExperience: e.target.value }))}
                placeholder="ex: 400 000 FCFA/mois" className={inputCls} />
            </div>
          </div>
        </div>

        {/* Contenu long */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="file" className={labelCls}>Image illustrative</label>
            <input type="file" id="file" accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-amame-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-amame-green-subtle file:text-amame-green hover:file:bg-amame-green-light transition-colors" />
          </div>
          <div>
            <label htmlFor="perspectives" className={labelCls}>Perspectives d'évolution</label>
            <textarea id="perspectives" rows={3} value={formData.perspectives}
              onChange={(e) => setFormData((p) => ({ ...p, perspectives: e.target.value }))}
              className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="descriptionLongue" className={labelCls}>Description détaillée *</label>
            <textarea id="descriptionLongue" rows={6} required value={formData.descriptionLongue}
              onChange={(e) => setFormData((p) => ({ ...p, descriptionLongue: e.target.value }))}
              className={inputCls} />
          </div>
        </div>

        {/* Listes dynamiques */}
        <div>
          <h2 className="text-sm font-semibold text-amame-charcoal uppercase tracking-wide mb-4 pb-2 border-b border-amame-border">
            Listes
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {renderListInput("Débouchés professionnels", "debouches", deboucheInput, setDeboucheInput, "ex: Data Scientist...")}
            {renderListInput("Compétences requises", "competences", competenceInput, setCompetenceInput, "ex: Programmation...")}
            {renderListInput("Universités recommandées", "universites", universiteInput, setUniversiteInput, "ex: Université de Bamako...")}
            {renderListInput("Prérequis", "prerequis", prerequisInput, setPrerequisInput, "ex: Bac S, Terminale Maths...")}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end items-center gap-3 pt-4 border-t border-amame-border">
          <button type="button" onClick={() => navigate("/admin/filieres")}
            className="py-2 px-4 border border-amame-border rounded-xl text-sm font-semibold text-amame-slate hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amame-green transition-colors">
            Annuler
          </button>
          <button type="submit" disabled={isLoading}
            className="inline-flex justify-center py-2 px-5 border border-transparent rounded-xl text-sm font-semibold text-white bg-amame-green hover:bg-amame-green-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amame-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {isLoading ? "Sauvegarde..." : isEditing ? "Mettre à jour" : "Créer la filière"}
          </button>
        </div>
      </form>
    </FormWrapper>
  );
};

export default FiliereForm;
