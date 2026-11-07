package com.example.siteamame.service.file;

/**
 * Fichier accepté par {@link UploadValidator}.
 *
 * @param content   octets du fichier
 * @param mimeType  type détecté d'après le contenu, jamais celui annoncé par le client
 * @param extension extension qui correspond au type détecté, en minuscules et sans point
 */
public record ValidatedFile(byte[] content, String mimeType, String extension) {}
