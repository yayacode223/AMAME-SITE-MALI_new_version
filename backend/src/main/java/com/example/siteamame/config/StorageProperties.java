package com.example.siteamame.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Configuration du stockage des fichiers (app.storage.*), alimentée par les variables
 * STORAGE_PROVIDER, MEDIA_BASE_URL et UPLOAD_DIR.
 *
 * @param provider      implémentation active de FileStorageService
 * @param publicBaseUrl base des URL publiques, sans « / » final ; vide : URL relatives (/uploads/…)
 * @param local         réglages du stockage sur disque
 */
@ConfigurationProperties(prefix = "app.storage")
public record StorageProperties(
        @DefaultValue("local") String provider,
        @DefaultValue("") String publicBaseUrl,
        @DefaultValue Local local) {

    /** @param uploadDir dossier qui contient un sous-dossier par type de contenu */
    public record Local(@DefaultValue("uploads") String uploadDir) {}
}
