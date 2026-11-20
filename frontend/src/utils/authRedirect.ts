/**
 * Retour à la page demandée après la connexion (rapport 05, itération P2).
 *
 * La page de connexion reçoit sa destination dans `?redirect=` : un paramètre d'URL survit à un
 * rechargement de /login, contrairement à l'état du routeur. Comme il vient de l'adresse, il n'est
 * jamais cru tel quel : seul un chemin du site lui-même est accepté (pas de redirection ouverte).
 */

export const REDIRECT_PARAM = "redirect";
export const REASON_PARAM = "raison";

/** Pourquoi on arrive sur /login : page réservée, ou session terminée en cours de navigation. */
export type LoginReason = "acces" | "session";

/** Pages d'où l'on ne revient jamais après la connexion. */
const AUTH_PAGES = ["/login", "/forgot-password", "/reset-password"];

const isAuthPage = (pathname: string) =>
  AUTH_PAGES.some((page) => pathname === page || pathname.startsWith(page + "/"));

/** Chemin interne sûr (chemin, paramètres, ancre), sinon null. */
export function safeRedirectPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(value, window.location.origin);
  } catch {
    return null;
  }
  // Le navigateur normalise « \ », tabulations et retours à la ligne : seule l'origine fait foi.
  if (url.origin !== window.location.origin || isAuthPage(url.pathname)) {
    return null;
  }
  return url.pathname + url.search + url.hash;
}

interface PageLocation {
  pathname: string;
  search?: string;
  hash?: string;
}

/** Adresse de la page de connexion, qui ramènera ensuite à `from` (l'accueil n'a pas besoin du paramètre). */
export function loginPath(from?: PageLocation, reason?: LoginReason): string {
  const params = new URLSearchParams();
  const target = from ? safeRedirectPath(from.pathname + (from.search ?? "") + (from.hash ?? "")) : null;
  if (target && target !== "/") params.set(REDIRECT_PARAM, target);
  if (reason) params.set(REASON_PARAM, reason);
  const query = params.toString();
  return query ? `/login?${query}` : "/login";
}

// ── Session terminée en cours de navigation ──────────────────────────────────
// Posé par l'intercepteur Axios quand le renouvellement de session est refusé alors qu'un
// utilisateur était affiché ; lu par la garde pour expliquer la redirection ; effacé par /login.

let sessionEnded = false;

export const markSessionEnded = () => {
  sessionEnded = true;
};

export const hasSessionEnded = () => sessionEnded;

export const clearSessionEnded = () => {
  sessionEnded = false;
};
