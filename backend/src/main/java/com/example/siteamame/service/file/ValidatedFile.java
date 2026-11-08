package com.example.siteamame.service.file;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Fichier accepté par {@link UploadValidator}.
 *
 * @param content   octets du fichier
 * @param mimeType  type détecté d'après le contenu, jamais celui annoncé par le client
 * @param extension extension qui correspond au type détecté, en minuscules et sans point
 */
public record ValidatedFile(byte[] content, String mimeType, String extension) {

    /**
     * Empreinte SHA-256 du contenu, en hexadécimal minuscule (64 caractères), calculée sur les octets
     * déjà en mémoire : ni relecture du disque ni réseau. Enregistrée en base avec la ligne du fichier,
     * elle prouve plus tard que l'objet stocké est bien celui que la base décrit.
     */
    public String sha256() {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(content));
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 fait partie des algorithmes que toute JVM doit fournir.
            throw new IllegalStateException(e);
        }
    }
}
