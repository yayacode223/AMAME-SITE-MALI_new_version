import React, { useState } from "react";
import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import {
  useGetUserPermissions,
  useGrantPermissionMutation,
  useRevokePermissionMutation,
  useRemoveOverrideMutation,
  useChangeRoleMutation,
} from "@/service/permissionService";
import { useAuth } from "@/context/AuthContext";
import {
  Permission,
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  Role,
  ROLE_LABELS,
  UserRole,
} from "@/types/userType";

interface Props {
  targetUserId: number;
  targetRole: Role;
}

/* ── Badge état d'une permission ─────────────────────────────────────────── */
type PermState = "default" | "granted" | "revoked";

const StateBadge: React.FC<{ state: PermState; effective: boolean }> = ({ state, effective }) => {
  const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium";
  if (state === "granted")
    return <span className={`${base} bg-green-100 text-green-700`}><CheckIcon className="w-3 h-3" />Accordé</span>;
  if (state === "revoked")
    return <span className={`${base} bg-red-100 text-red-700`}><XMarkIcon className="w-3 h-3" />Révoqué</span>;
  return <span className={`${base} bg-gray-100 text-gray-500`}>Par défaut</span>;
};

/* ── Groupe de permissions ───────────────────────────────────────────────── */
const PermissionGroup: React.FC<{
  label: string;
  permissions: Permission[];
  grantedSet: Set<Permission>;
  revokedSet: Set<Permission>;
  effectiveSet: Set<Permission>;
  canGrant: boolean;
  onGrant: (p: Permission) => void;
  onRevoke: (p: Permission) => void;
  onReset: (p: Permission) => void;
  isPending: boolean;
}> = ({ label, permissions, grantedSet, revokedSet, effectiveSet, canGrant, onGrant, onRevoke, onReset, isPending }) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
      >
        <span>{label}</span>
        {open ? <ChevronUpIcon className="w-4 h-4 text-gray-400" /> : <ChevronDownIcon className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="divide-y divide-gray-100">
          {permissions.map((perm) => {
            const state: PermState = grantedSet.has(perm) ? "granted" : revokedSet.has(perm) ? "revoked" : "default";
            const effective = effectiveSet.has(perm);
            const hasOverride = state !== "default";

            return (
              <div key={perm} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  {effective
                    ? <ShieldCheckIcon className="w-4 h-4 text-green-500 shrink-0" />
                    : <ShieldExclamationIcon className="w-4 h-4 text-gray-300 shrink-0" />
                  }
                  <span className="text-sm text-gray-700 truncate">{PERMISSION_LABELS[perm]}</span>
                  <StateBadge state={state} effective={effective} />
                </div>

                {canGrant && (
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <button
                      type="button"
                      disabled={isPending || state === "granted"}
                      onClick={() => onGrant(perm)}
                      className="px-2 py-1 text-xs rounded border border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Accorder"
                    >
                      Accorder
                    </button>
                    <button
                      type="button"
                      disabled={isPending || state === "revoked"}
                      onClick={() => onRevoke(perm)}
                      className="px-2 py-1 text-xs rounded border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Révoquer"
                    >
                      Révoquer
                    </button>
                    {hasOverride && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => onReset(perm)}
                        className="px-2 py-1 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Réinitialiser (retour aux défauts du rôle)"
                      >
                        <ArrowPathIcon className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ── Panneau principal ───────────────────────────────────────────────────── */
const UserPermissionsPanel: React.FC<Props> = ({ targetUserId, targetRole }) => {
  const { hasPermission } = useAuth();
  const canManageRoles  = hasPermission("USER_MANAGE_ROLES");
  const canGrantPerms   = hasPermission("USER_GRANT_PERMISSIONS");

  const { data: permsData, isLoading } = useGetUserPermissions(targetUserId);

  const grantMut   = useGrantPermissionMutation(targetUserId);
  const revokeMut  = useRevokePermissionMutation(targetUserId);
  const resetMut   = useRemoveOverrideMutation(targetUserId);
  const roleMut    = useChangeRoleMutation(targetUserId);

  const isPending = grantMut.isPending || revokeMut.isPending || resetMut.isPending;

  const [selectedRole, setSelectedRole] = useState<Role>(targetRole);
  const [roleChanged, setRoleChanged] = useState(false);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(e.target.value as Role);
    setRoleChanged(true);
  };

  const handleRoleSave = () => {
    roleMut.mutate(selectedRole, {
      onSuccess: () => setRoleChanged(false),
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-200 rounded" />)}
      </div>
    );
  }

  const grantedSet   = new Set<Permission>(permsData?.grantedPermissions  ?? []);
  const revokedSet   = new Set<Permission>(permsData?.revokedPermissions  ?? []);
  const effectiveSet = new Set<Permission>(permsData?.effectivePermissions ?? []);

  return (
    <div className="space-y-6">

      {/* ── Rôle ── */}
      {canManageRoles && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Rôle</h3>
          <div className="flex items-center gap-3">
            <select
              value={selectedRole}
              onChange={handleRoleChange}
              className="block w-48 rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-amame-green focus:ring-1 focus:ring-amame-green"
            >
              {(Object.keys(UserRole) as Role[]).map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
            {roleChanged && (
              <button
                type="button"
                disabled={roleMut.isPending}
                onClick={handleRoleSave}
                className="px-3 py-1.5 text-sm rounded-md bg-amame-green text-white hover:bg-amame-green-dark disabled:opacity-50 transition-colors"
              >
                {roleMut.isPending ? "Enregistrement…" : "Enregistrer"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Résumé permissions effectives ── */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Permissions effectives
          <span className="ml-2 text-xs font-normal text-gray-400">
            ({effectiveSet.size} sur {Object.keys(PERMISSION_LABELS).length})
          </span>
        </h3>
        <div className="text-xs text-gray-500 mb-3">
          {grantedSet.size > 0 && (
            <span className="inline-flex items-center gap-1 mr-3">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
              {grantedSet.size} accordée(s) individuellement
            </span>
          )}
          {revokedSet.size > 0 && (
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
              {revokedSet.size} révoquée(s) individuellement
            </span>
          )}
        </div>
      </div>

      {/* ── Groupes de permissions ── */}
      {!canGrantPerms && (
        <p className="text-xs text-gray-400 italic">
          Vous pouvez consulter les permissions mais pas les modifier (nécessite USER_GRANT_PERMISSIONS).
        </p>
      )}

      <div className="space-y-2">
        {PERMISSION_GROUPS.map((group) => (
          <PermissionGroup
            key={group.label}
            label={group.label}
            permissions={group.permissions}
            grantedSet={grantedSet}
            revokedSet={revokedSet}
            effectiveSet={effectiveSet}
            canGrant={canGrantPerms}
            onGrant={(p) => grantMut.mutate(p)}
            onRevoke={(p) => revokeMut.mutate(p)}
            onReset={(p) => resetMut.mutate(p)}
            isPending={isPending}
          />
        ))}
      </div>
    </div>
  );
};

export default UserPermissionsPanel;
