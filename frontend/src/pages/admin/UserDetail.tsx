import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeftIcon,
  UserIcon,
  DocumentIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useGetUserById, useDeleteUserMutation } from "@/service/userService";
import { Sexe, ROLE_LABELS } from "@/types/userType";
import { useAuth } from "@/context/AuthContext";
import UserPermissionsPanel from "@/components/admin/UserPermissionsPanel";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

const url = "https://amame.ml";

const ROLE_COLORS: Record<string, string> = {
  SUPERADMIN: "bg-red-100 text-red-800",
  ADMIN:      "bg-purple-100 text-purple-800",
  EDITOR:     "bg-blue-100 text-blue-800",
  MEMBER:     "bg-teal-100 text-teal-800",
  USER:       "bg-gray-100 text-gray-700",
  VISITOR:    "bg-yellow-50 text-yellow-700",
};

const getSexeLabel = (sexe: Sexe) => (sexe === "HOMME" ? "Homme" : "Femme");

const getNiveauLabel = (niveau: string) => {
  const map: Record<string, string> = {
    BAC:      "Baccalauréat",
    "BAC+2":  "Bac+2 (BTS, DUT)",
    LICENCE:  "Licence (Bac+3)",
    MASTER:   "Master (Bac+5)",
    DOCTORAT: "Doctorat (Bac+8)",
    AUTRE:    "Autre",
  };
  return map[niveau] ?? niveau;
};

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const userId = parseInt(id ?? "0");

  const { data: user, isLoading } = useGetUserById(userId);
  const { user: authUser, hasPermission } = useAuth();
  const deleteUserMutation = useDeleteUserMutation();

  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const canSeePermissions = hasPermission("USER_READ_ALL");
  const canDelete = hasPermission("USER_DELETE");

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-2xl font-semibold text-gray-900">Utilisateur non trouvé</h1>
        <Link to="/admin/users" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mt-4">
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Retour à la liste
        </Link>
      </div>
    );
  }

  const roleColor = ROLE_COLORS[user.role ?? ""] ?? "bg-gray-100 text-gray-700";
  const roleLabel = ROLE_LABELS[user.role!] ?? user.role ?? "—";
  const isSelf = authUser?.id === user.id;

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Retour */}
      <Link to="/admin/users" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
        <ArrowLeftIcon className="h-4 w-4 mr-1" /> Retour à la liste
      </Link>

      {/* ── Carte profil ── */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-amame-green px-6 py-8">
          <div className="flex items-center gap-5">
            <div className="shrink-0">
              {user.imagePath ? (
                <img className="h-20 w-20 rounded-full object-cover ring-2 ring-white"
                  src={`${url}/${user.imagePath}`} alt={`${user.prenom} ${user.nom}`} />
              ) : (
                <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center">
                  <UserIcon className="h-10 w-10 text-white" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{user.prenom} {user.nom}</h1>
              <p className="text-white/80 text-sm">{user.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${roleColor}`}>
                  {roleLabel}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white">
                  {getSexeLabel(user.sexe)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Infos personnelles */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Informations personnelles</h2>
            <dl className="space-y-3">
              <div className="flex items-start gap-3">
                <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <dt className="text-xs text-gray-500 font-medium">Email</dt>
                  <dd className="text-sm text-gray-900">{user.email}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <dt className="text-xs text-gray-500 font-medium">Téléphone</dt>
                  <dd className="text-sm text-gray-900">{user.phone ?? "Non renseigné"}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <dt className="text-xs text-gray-500 font-medium">Adresse</dt>
                  <dd className="text-sm text-gray-900">
                    {user.adresse
                      ? <>{user.adresse}<br />{user.codePostal} {user.ville}{user.pays && `, ${user.pays}`}</>
                      : "Non renseignée"}
                  </dd>
                </div>
              </div>
              {user.birthDate && (
                <div>
                  <dt className="text-xs text-gray-500 font-medium">Date de naissance</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(user.birthDate).toLocaleDateString("fr-FR")}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Infos académiques + documents */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Informations académiques</h2>
            <dl className="space-y-3">
              <div className="flex items-start gap-3">
                <AcademicCapIcon className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <dt className="text-xs text-gray-500 font-medium">Niveau d'étude</dt>
                  <dd className="text-sm text-gray-900">
                    {user.niveauEtude ? getNiveauLabel(user.niveauEtude) : "Non renseigné"}
                  </dd>
                </div>
              </div>
            </dl>

            {/* Documents */}
            <div className="mt-5">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Documents</h3>
              {user.cvPath ? (
                <a href={`${url}/${user.cvPath}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <DocumentIcon className="h-5 w-5 text-gray-400 shrink-0" />
                  <span className="text-sm font-medium text-gray-900">
                    {isSelf ? "Mon CV" : "CV de l'utilisateur"}
                  </span>
                </a>
              ) : (
                <p className="text-sm text-gray-400">Aucun document</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {(isSelf || canDelete) && (
          <div className="px-6 pb-6 pt-0 border-t border-gray-100 flex justify-end gap-3 mt-2">
            <Link
              to={`/admin/users/edit/${user.id}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Modifier
            </Link>
            {canDelete && !isSelf && (
              <>
                <button
                  type="button"
                  onClick={() => setDeleteOpen(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 border border-transparent rounded-xl hover:bg-red-600 transition-colors"
                >
                  Supprimer
                </button>
                <ConfirmDialog
                  open={deleteOpen}
                  title="Supprimer l'utilisateur"
                  description={`L'utilisateur "${user.prenom} ${user.nom}" sera définitivement supprimé(e). Cette action est irréversible.`}
                  onConfirm={() => { deleteUserMutation.mutate(user.id!); setDeleteOpen(false); }}
                  onClose={() => setDeleteOpen(false)}
                  isLoading={deleteUserMutation.isPending}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Panneau rôles & permissions ── */}
      {canSeePermissions && !isSelf && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setPermissionsOpen(!permissionsOpen)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5 text-amame-green" />
              <span className="text-base font-medium text-gray-900">Rôle & Permissions</span>
            </div>
            <span className="text-xs text-gray-400">{permissionsOpen ? "Replier" : "Afficher"}</span>
          </button>

          {permissionsOpen && (
            <div className="px-6 pb-6 pt-2 border-t border-gray-100">
              <UserPermissionsPanel
                targetUserId={user.id!}
                targetRole={user.role!}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserDetail;
