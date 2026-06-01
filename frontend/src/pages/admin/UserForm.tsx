import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FormWrapper from "@/components/admin/FormWrapper";
import { useRegisterMutation, useUpdateMutation, useGetUserById } from "@/service/userService";
import { RegisterType, RegisterPayload, RegisterUpdatePayload, Sexe, Role } from "@/types/userType";
import { NiveauType } from "@/types/concoursType";
import { useAuth } from "@/context/AuthContext";

interface UserFormData extends Omit<RegisterType, "password"> {
  role?: Role;
}

// Classes communes réutilisées dans ce formulaire
const inputCls = "mt-1 block w-full border border-amame-border rounded-xl py-2 px-3 text-sm text-amame-charcoal focus:outline-none focus:ring-1 focus:ring-amame-green focus:border-amame-green transition-colors bg-white";
const labelCls = "block text-sm font-medium text-amame-charcoal";

const UserForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { data: existingUser } = useGetUserById(isEditing ? parseInt(id!) : 0, { enabled: isEditing });
  const { user } = useAuth();
  const registerMutation = useRegisterMutation();
  const updateMutation = useUpdateMutation();

  const [formData, setFormData] = useState<UserFormData>({
    nom: "", prenom: "", email: "", birthDate: "", ville: "",
    sexe: "HOMME", adresse: "", phone: "", pays: "", codePostal: 0,
    niveauEtude: "BACHELIER", role: "USER",
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedCV, setSelectedCV] = useState<File | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  useEffect(() => {
    if (existingUser && isEditing) {
      setFormData({
        nom: existingUser.nom, prenom: existingUser.prenom, email: existingUser.email,
        birthDate: existingUser.birthDate || "", ville: existingUser.ville || "",
        sexe: existingUser.sexe, adresse: existingUser.adresse || "",
        phone: existingUser.phone || "", pays: existingUser.pays || "",
        codePostal: existingUser.codePostal || 0,
        niveauEtude: (existingUser.niveauEtude as NiveauType) || "BACHELIER",
        role: existingUser.role || "USER",
      });
    }
  }, [existingUser, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing && !password) { alert("Le mot de passe est obligatoire"); return; }
    if (password && password !== confirmPassword) { alert("Les mots de passe ne correspondent pas"); return; }
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: parseInt(id!),
          user: { ...formData, password: password || undefined },
          cv: selectedCV || undefined,
          image: selectedImage || undefined,
        } as RegisterUpdatePayload);
      } else {
        await registerMutation.mutateAsync({
          user: { ...formData, password },
          cv: selectedCV || undefined,
          image: selectedImage || undefined,
        } as RegisterPayload);
      }
      navigate("/admin/users");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const isLoading = registerMutation.isPending || updateMutation.isPending;

  return (
    <FormWrapper
      title={isEditing ? "Modifier l'utilisateur" : "Créer un utilisateur"}
      subtitle={isEditing ? "Modifiez les informations de l'utilisateur" : "Remplissez les informations pour créer un utilisateur"}
      backUrl="/admin/users"
      isLoading={isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identité */}
        <div>
          <h2 className="text-sm font-semibold text-amame-charcoal uppercase tracking-wide mb-4 pb-2 border-b border-amame-border">
            Identité
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="prenom" className={labelCls}>Prénom *</label>
              <input type="text" id="prenom" required value={formData.prenom}
                onChange={(e) => setFormData((p) => ({ ...p, prenom: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label htmlFor="nom" className={labelCls}>Nom *</label>
              <input type="text" id="nom" required value={formData.nom}
                onChange={(e) => setFormData((p) => ({ ...p, nom: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label htmlFor="sexe" className={labelCls}>Sexe *</label>
              <select id="sexe" required value={formData.sexe}
                onChange={(e) => setFormData((p) => ({ ...p, sexe: e.target.value as Sexe }))}
                className={inputCls}>
                <option value="HOMME">Masculin</option>
                <option value="FEMME">Féminin</option>
              </select>
            </div>
            <div>
              <label htmlFor="birthDate" className={labelCls}>Date de naissance</label>
              <input type="date" id="birthDate" value={formData.birthDate}
                onChange={(e) => setFormData((p) => ({ ...p, birthDate: e.target.value }))}
                className={inputCls} />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h2 className="text-sm font-semibold text-amame-charcoal uppercase tracking-wide mb-4 pb-2 border-b border-amame-border">
            Contact
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className={labelCls}>Email *</label>
              <input type="email" id="email" required value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label htmlFor="phone" className={labelCls}>Téléphone</label>
              <input type="tel" id="phone" value={formData.phone}
                onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="adresse" className={labelCls}>Adresse</label>
              <input type="text" id="adresse" value={formData.adresse}
                onChange={(e) => setFormData((p) => ({ ...p, adresse: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label htmlFor="ville" className={labelCls}>Ville</label>
              <input type="text" id="ville" value={formData.ville}
                onChange={(e) => setFormData((p) => ({ ...p, ville: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label htmlFor="codePostal" className={labelCls}>Code postal</label>
              <input type="number" id="codePostal" value={formData.codePostal}
                onChange={(e) => setFormData((p) => ({ ...p, codePostal: parseInt(e.target.value) || 0 }))}
                className={inputCls} />
            </div>
            <div>
              <label htmlFor="pays" className={labelCls}>Pays *</label>
              <input type="text" id="pays" required value={formData.pays}
                onChange={(e) => setFormData((p) => ({ ...p, pays: e.target.value }))}
                className={inputCls} />
            </div>
          </div>
        </div>

        {/* Académique & Rôle */}
        <div>
          <h2 className="text-sm font-semibold text-amame-charcoal uppercase tracking-wide mb-4 pb-2 border-b border-amame-border">
            Académique
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="niveauEtude" className={labelCls}>Niveau d'étude *</label>
              <select id="niveauEtude" required value={formData.niveauEtude}
                onChange={(e) => setFormData((p) => ({ ...p, niveauEtude: e.target.value as NiveauType }))}
                className={inputCls}>
                <option value="PRIMAIRE">Primaire</option>
                <option value="SECONDAIRE">Secondaire</option>
                <option value="LYCEE">Lycée</option>
                <option value="BACHELIER">Baccalauréat</option>
                <option value="BAC_2">Bac+2 (BTS, DUT)</option>
                <option value="LICENCE">Licence (Bac+3)</option>
                <option value="MASTER">Master (Bac+5)</option>
                <option value="DOCTORAT">Doctorat (Bac+8)</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
            {(user?.role === "ADMIN" || user?.role === "SUPERADMIN") && (
              <div>
                <label htmlFor="role" className={labelCls}>Rôle *</label>
                <select id="role" required value={formData.role}
                  onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value as Role }))}
                  className={inputCls}>
                  <option value="USER">Utilisateur</option>
                  <option value="EDITOR">Éditeur</option>
                  <option value="ADMIN">Administrateur</option>
                  {user?.role === "SUPERADMIN" && <option value="SUPERADMIN">Super administrateur</option>}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Mot de passe */}
        <div>
          <h2 className="text-sm font-semibold text-amame-charcoal uppercase tracking-wide mb-4 pb-2 border-b border-amame-border">
            {isEditing ? "Modifier le mot de passe" : "Mot de passe"}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="password" className={labelCls}>
                Mot de passe {!isEditing && "*"}
                {isEditing && <span className="ml-1 font-normal text-amame-muted">(laisser vide pour ne pas modifier)</span>}
              </label>
              <input type="password" id="password" required={!isEditing} value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls} />
            </div>
            <div>
              <label htmlFor="confirmPassword" className={labelCls}>
                Confirmer {!isEditing && "*"}
              </label>
              <input type="password" id="confirmPassword" required={!isEditing} value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputCls} />
            </div>
          </div>
        </div>

        {/* Fichiers */}
        <div>
          <h2 className="text-sm font-semibold text-amame-charcoal uppercase tracking-wide mb-4 pb-2 border-b border-amame-border">
            Fichiers
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="image" className={labelCls}>Photo de profil</label>
              <input type="file" id="image" accept="image/*"
                onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                className="mt-1 block w-full text-sm text-amame-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-amame-green-subtle file:text-amame-green hover:file:bg-amame-green-light transition-colors" />
            </div>
            <div>
              <label htmlFor="cv" className={labelCls}>CV (PDF)</label>
              <input type="file" id="cv" accept=".pdf,.doc,.docx"
                onChange={(e) => setSelectedCV(e.target.files?.[0] || null)}
                className="mt-1 block w-full text-sm text-amame-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-amame-green-subtle file:text-amame-green hover:file:bg-amame-green-light transition-colors" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end items-center gap-3 pt-4 border-t border-amame-border">
          <button type="button" onClick={() => navigate("/admin/users")}
            className="py-2 px-4 border border-amame-border rounded-xl text-sm font-semibold text-amame-slate hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amame-green transition-colors">
            Annuler
          </button>
          <button type="submit" disabled={isLoading}
            className="inline-flex justify-center py-2 px-5 border border-transparent rounded-xl text-sm font-semibold text-white bg-amame-green hover:bg-amame-green-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amame-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {isLoading ? "Sauvegarde..." : isEditing ? "Mettre à jour" : "Créer l'utilisateur"}
          </button>
        </div>
      </form>
    </FormWrapper>
  );
};

export default UserForm;
