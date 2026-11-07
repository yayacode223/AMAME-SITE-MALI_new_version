/**
 * Formats proposés par les champs de fichier. À garder alignés sur ce que le backend accepte
 * (UploadValidator.java) : un format absent d'ici mais accepté là-bas reste utilisable,
 * l'inverse fait échouer l'envoi après coup.
 */

/** Images : JPEG, PNG, GIF, WebP. Ni SVG, ni HEIC, ni AVIF. */
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/gif,image/webp";
