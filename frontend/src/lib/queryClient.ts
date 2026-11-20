import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

/**
 * Un chargement refusé (4xx : élément introuvable, droits, session) ne change pas en réessayant :
 * l'erreur s'affiche tout de suite, au lieu d'un squelette pendant ~7 s (3 essais par défaut).
 * Coupure réseau, délai dépassé, serveur en panne (5xx), trop de requêtes (429) : 2 nouveaux essais.
 */
const shouldRetry = (failureCount: number, error: unknown) => {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  if (status !== undefined && status >= 400 && status < 500 && status !== 408 && status !== 429) return false;
  return failureCount < 2;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: shouldRetry },
  },
});
