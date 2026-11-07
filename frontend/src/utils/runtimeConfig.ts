/**
 * Configuration d'exécution : valeurs lues au démarrage du conteneur, et non figées à la
 * construction de l'image. Elles viennent de /config.js (public/config.js en développement,
 * réécrit par docker/40-runtime-config.sh dans l'image), chargé par index.html avant l'application.
 *
 * Si /config.js n'a pas pu être chargé (hors ligne, par exemple), les valeurs par défaut
 * s'appliquent : URL relatives, aucun paramètre de redimensionnement.
 */
interface RuntimeConfig {
  /** Base des URL des médias, sans « / » final. Vide : URL relatives, servies par le site lui-même. */
  mediaBaseUrl: string;
  /** Vrai seulement quand Bunny Optimizer est activé : autorise les paramètres de redimensionnement. */
  mediaOptimizerEnabled: boolean;
}

declare global {
  interface Window {
    __AMAME_CONFIG__?: Partial<RuntimeConfig>;
  }
}

const raw = (typeof window !== "undefined" && window.__AMAME_CONFIG__) || {};

export const runtimeConfig: RuntimeConfig = {
  mediaBaseUrl: typeof raw.mediaBaseUrl === "string" ? raw.mediaBaseUrl.replace(/\/+$/, "") : "",
  mediaOptimizerEnabled: raw.mediaOptimizerEnabled === true,
};
