/**
 * Clés React Query de l'authentification. Module à part : l'intercepteur Axios s'en sert, et
 * userService (qui importe Axios) ne peut pas être importé par lui sans dépendance circulaire.
 */
export const authKeys = {
  all: ["auth"] as const,
  currentUser: () => [...authKeys.all, "currentUser"] as const,
  users: () => [...authKeys.all, "users"] as const,
  detail: (id: number) => [...authKeys.all, "detail", id] as const,
};
