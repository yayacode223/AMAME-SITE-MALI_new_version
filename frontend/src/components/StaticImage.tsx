import type { ImgHTMLAttributes } from "react";
import type { StaticImageName } from "@/generated/staticImages";
import { staticImageInfo, staticImageSrcSet, staticImageUrl } from "@/utils/staticImage";
import { fetchPriorityAttr } from "@/utils/fetchPriority";

interface StaticImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "width" | "height" | "loading"> {
  name: StaticImageName;
  /** Largeur occupée à l'écran : le navigateur s'en sert pour choisir le fichier à télécharger. */
  sizes: string;
  /** Image principale de la page : chargée tout de suite et en priorité. Les autres sont différées. */
  priority?: boolean;
}

/**
 * Image statique du site : WebP en plusieurs largeurs, dimensions connues à l'avance
 * (pas de décalage de mise en page), chargement différé sauf pour l'image principale.
 */
const StaticImage = ({ name, sizes, priority = false, alt = "", ...rest }: StaticImageProps) => {
  const { width, height } = staticImageInfo(name);
  return (
    <img
      src={staticImageUrl(name)}
      srcSet={staticImageSrcSet(name)}
      sizes={sizes}
      width={width}
      height={height}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      {...fetchPriorityAttr(priority)}
      {...rest}
    />
  );
};

export default StaticImage;
