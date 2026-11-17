/**
 * Caches du service worker qui ont pu garder des réponses privées de l'API.
 *
 * Jusqu'à frontend-v1.1, « api-cache » gardait 24 heures toutes les réponses GET /api/*
 * authentifiées (profil connecté, listes de l'administration). Ce cache survit à la
 * déconnexion et ne distingue pas les comptes (écart E44 du suivi de migration). Le service
 * worker actuel ne garde plus que les réponses publiques, dans « api-public » ; l'ancien cache
 * est supprimé au démarrage de l'application et à chaque déconnexion.
 */
const PRIVATE_CACHES = ["api-cache"];

export async function purgePrivateCaches(): Promise<void> {
  if (typeof window === "undefined" || !("caches" in window)) return;
  try {
    await Promise.all(PRIVATE_CACHES.map((name) => window.caches.delete(name)));
  } catch {
    // Cache Storage refusé (certaines navigations privées) : il n'y a alors rien à purger.
  }
}
