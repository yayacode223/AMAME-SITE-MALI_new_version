/**
 * Nouvelle version du site après un déploiement (rapport 05, décision D9, itération P3a).
 *
 * Le service worker (vite-plugin-pwa, registerType 'autoUpdate') installe la nouvelle version en
 * arrière-plan et prend aussitôt le contrôle (skipWaiting, clientsClaim), mais la page ouverte exécute
 * encore l'ancienne : sans rechargement, le visiteur garde l'ancienne version. On recharge donc :
 * - tout de suite si rien n'a été saisi dans la page ;
 * - sinon au prochain changement de page, pour ne jamais perdre un formulaire en cours.
 * Un onglet resté ouvert cherche aussi une nouvelle version quand on y revient (lecture de /sw.js,
 * fichier statique : aucun appel à l'API ni à la base).
 */

let updateReady = false;
let userHasTyped = false;

export function watchForAppUpdate(): void {
  if (!("serviceWorker" in navigator)) return;

  document.addEventListener("input", () => { userHasTyped = true; }, { capture: true });

  // Première installation : il n'y avait pas de contrôleur, ce n'est pas une mise à jour.
  let controller = navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    const isUpdate = controller !== null;
    controller = navigator.serviceWorker.controller;
    if (!isUpdate || updateReady) return;
    updateReady = true;
    if (!userHasTyped) window.location.reload();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    navigator.serviceWorker.getRegistration()
      .then((registration) => registration?.update())
      .catch(() => { /* hors ligne : on réessaiera au prochain retour sur l'onglet */ });
  });

  // Un morceau de l'ancienne version (page chargée à la demande) n'existe plus après le déploiement :
  // recharger une fois, au lieu d'une page blanche. Pas plus d'une fois en 10 s, contre les boucles.
  window.addEventListener("vite:preloadError", (event) => {
    const key = "amame-preload-reload";
    let last = 0;
    try {
      last = Number(sessionStorage.getItem(key) ?? 0);
      sessionStorage.setItem(key, String(Date.now()));
    } catch {
      return; // stockage indisponible : on ne prend pas le risque d'une boucle de rechargements
    }
    if (Date.now() - last < 10_000) return;
    event.preventDefault();
    window.location.reload();
  });
}

/** À chaque changement de page : charge la nouvelle version si elle attendait une saisie en cours. */
export function reloadIfUpdateReady(): void {
  if (updateReady) window.location.reload();
}
