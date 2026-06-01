import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Api } from "@/utils/axiosInstance";
import { Permission, Role } from "@/types/userType";
import { toast } from "@/hooks/use-toast";

// ── Types de réponse ──────────────────────────────────────────────────────────

export interface UserPermissionsResponse {
  userId: number;
  role: Role;
  defaultPermissions: Permission[];
  grantedPermissions: Permission[];
  revokedPermissions: Permission[];
  effectivePermissions: Permission[];
}

export interface PermissionInfo {
  name: Permission;
  label: string;
}

// ── Query keys ────────────────────────────────────────────────────────────────

export const permissionKeys = {
  all:        ["permissions"] as const,
  list:       () => [...permissionKeys.all, "list"] as const,
  roleDefaults:(role: Role) => [...permissionKeys.all, "role", role] as const,
  user:       (userId: number) => [...permissionKeys.all, "user", userId] as const,
};

// ── API functions ─────────────────────────────────────────────────────────────

const getAllPermissions = async (): Promise<PermissionInfo[]> => {
  const res = await Api.get<PermissionInfo[]>("/admin/permissions");
  return res.data;
};

const getRolePermissions = async (role: Role): Promise<Permission[]> => {
  const res = await Api.get<Permission[]>(`/admin/permissions/role/${role}`);
  return res.data;
};

const getUserPermissions = async (userId: number): Promise<UserPermissionsResponse> => {
  const res = await Api.get<UserPermissionsResponse>(`/admin/users/${userId}/permissions`);
  return res.data;
};

const grantPermission = async ({ userId, permission }: { userId: number; permission: Permission }) => {
  await Api.post(`/admin/users/${userId}/permissions/grant`, { permission });
};

const revokePermission = async ({ userId, permission }: { userId: number; permission: Permission }) => {
  await Api.post(`/admin/users/${userId}/permissions/revoke`, { permission });
};

const removeOverride = async ({ userId, permission }: { userId: number; permission: Permission }) => {
  await Api.delete(`/admin/users/${userId}/permissions/${permission}`);
};

const changeRole = async ({ userId, role }: { userId: number; role: Role }) => {
  await Api.put(`/admin/users/${userId}/role`, { role });
};

// ── React Query hooks ─────────────────────────────────────────────────────────

export const useGetAllPermissions = () =>
  useQuery({
    queryKey: permissionKeys.list(),
    queryFn:  getAllPermissions,
    staleTime: Infinity,
  });

export const useGetRolePermissions = (role: Role | undefined) =>
  useQuery({
    queryKey: permissionKeys.roleDefaults(role!),
    queryFn:  () => getRolePermissions(role!),
    enabled:  !!role,
    staleTime: Infinity,
  });

export const useGetUserPermissions = (userId: number | undefined) =>
  useQuery({
    queryKey: permissionKeys.user(userId!),
    queryFn:  () => getUserPermissions(userId!),
    enabled:  !!userId,
    staleTime: 30 * 1000, // 30s — les permissions peuvent changer fréquemment
  });

export const useGrantPermissionMutation = (userId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (permission: Permission) => grantPermission({ userId, permission }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: permissionKeys.user(userId) });
      toast({ title: "Permission accordée" });
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });
};

export const useRevokePermissionMutation = (userId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (permission: Permission) => revokePermission({ userId, permission }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: permissionKeys.user(userId) });
      toast({ title: "Permission révoquée" });
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });
};

export const useRemoveOverrideMutation = (userId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (permission: Permission) => removeOverride({ userId, permission }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: permissionKeys.user(userId) });
      toast({ title: "Override supprimé — retour aux défauts du rôle" });
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });
};

export const useChangeRoleMutation = (userId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (role: Role) => changeRole({ userId, role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: permissionKeys.user(userId) });
      qc.invalidateQueries({ queryKey: ["auth"] });
      toast({ title: "Rôle mis à jour" });
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });
};
