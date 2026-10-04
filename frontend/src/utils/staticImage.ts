import { STATIC_IMAGES, type StaticImageName } from "@/generated/staticImages";

/**
 * Images statiques du site (heroes, illustrations), produites en plusieurs largeurs par
 * scripts/optimize_images.py. Toute URL d'image statique passe par ce fichier : le jour où
 * ces images seront servies par le CDN, seule STATIC_BASE changera.
 */
const STATIC_BASE = "/static";

interface StaticImageInfo {
  width: number;
  height: number;
  widths: readonly number[];
}

export const staticImageInfo = (name: StaticImageName): StaticImageInfo => STATIC_IMAGES[name];

const fileUrl = (name: StaticImageName, width: number) => `${STATIC_BASE}/${name}-${width}.webp`;

/** URL d'une image statique : la plus petite largeur disponible qui couvre `minWidth`. */
export const staticImageUrl = (name: StaticImageName, minWidth = 1280): string => {
  const { widths } = staticImageInfo(name);
  return fileUrl(name, widths.find((w) => w >= minWidth) ?? widths[widths.length - 1]);
};

/** Toutes les largeurs disponibles, pour l'attribut srcset. */
export const staticImageSrcSet = (name: StaticImageName): string =>
  staticImageInfo(name)
    .widths.map((w) => `${fileUrl(name, w)} ${w}w`)
    .join(", ");
