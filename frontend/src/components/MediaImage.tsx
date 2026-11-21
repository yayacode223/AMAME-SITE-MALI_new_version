import type { ImgHTMLAttributes } from "react";
import { mediaUrl, sizedUrl, srcSet, type ImageWidth } from "@/utils/media";
import { fetchPriorityAttr } from "@/utils/fetchPriority";

interface MediaImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "loading"> {
  /** URL renvoyée par l'API (fileUrl, coverImageUrl…) ou, à défaut, clé de stockage (filePath). */
  src?: string | null;
  /** Largeur de l'image par défaut, une fois Optimizer activé. Sans effet d'ici là. */
  maxWidth?: ImageWidth;
  /** Image principale de la page : chargée tout de suite et en priorité. Les autres sont différées. */
  priority?: boolean;
}

/**
 * Image uploadée (article, galerie, membre…). Son URL passe toujours par utils/media.ts ;
 * le chargement est différé sauf pour l'image principale. N'affiche rien sans source.
 */
const MediaImage = ({ src, maxWidth = 1280, priority = false, sizes, alt = "", ...rest }: MediaImageProps) => {
  const url = mediaUrl(src);
  if (!url) return null;
  const responsive = srcSet(url);
  return (
    <img
      src={sizedUrl(url, maxWidth)}
      srcSet={responsive}
      sizes={responsive ? sizes ?? "100vw" : undefined}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      {...fetchPriorityAttr(priority)}
      {...rest}
    />
  );
};

export default MediaImage;
