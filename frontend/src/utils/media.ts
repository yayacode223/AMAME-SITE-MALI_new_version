import { runtimeConfig } from "@/utils/runtimeConfig";

/**
 * Point d'entrée unique des URL de médias uploadés (images, documents). Aucun composant ne
 * construit une URL à la main ni ne connaît de nom de domaine : changer d'hôte ou de CDN
 * revient à changer la variable MEDIA_BASE_URL de la stack.
 */
const MEDIA_BASE = runtimeConfig.mediaBaseUrl;

/** Largeurs que Bunny Optimizer sait servir (classes d'images w320 à w1920). */
export const IMAGE_WIDTHS = [320, 640, 1280, 1920] as const;
export type ImageWidth = (typeof IMAGE_WIDTHS)[number];

/**
 * URL d'un média à partir de ce que renvoie l'API.
 * - Une URL (fileUrl, coverImageUrl, imageUrl… : absolue, ou commençant par « / ») est rendue telle quelle :
 *   c'est le backend qui la calcule.
 * - Une clé de stockage (filePath : « uploads/… »), reçue d'un backend qui n'envoie pas encore
 *   les champs *Url, est préfixée par la base des médias.
 * Usage : mediaUrl(dto.fileUrl ?? dto.filePath)
 */
export function mediaUrl(pathOrUrl?: string | null): string | undefined {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl) || pathOrUrl.startsWith("/")) return pathOrUrl;
  return `${MEDIA_BASE}/${pathOrUrl}`;
}

/**
 * Les paramètres de redimensionnement ne s'ajoutent qu'aux URL du CDN, et seulement quand
 * Optimizer est activé (MEDIA_OPTIMIZER_ENABLED). Sans Optimizer ils ne serviraient à rien
 * et fragmenteraient le cache du CDN.
 */
const isOptimizable = (url: string) =>
  runtimeConfig.mediaOptimizerEnabled && MEDIA_BASE !== "" && url.startsWith(`${MEDIA_BASE}/`);

/** URL de l'image à la largeur demandée ; inchangée tant qu'Optimizer n'est pas activé. */
export function sizedUrl(url: string, width: ImageWidth): string {
  if (!isOptimizable(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}class=w${width}`;
}

/** Attribut srcset ; absent tant qu'Optimizer n'est pas activé (une seule taille existe). */
export function srcSet(url: string, widths: readonly ImageWidth[] = IMAGE_WIDTHS): string | undefined {
  return isOptimizable(url) ? widths.map((w) => `${sizedUrl(url, w)} ${w}w`).join(", ") : undefined;
}
