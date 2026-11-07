package com.example.siteamame.service.file;

import com.example.siteamame.config.StorageProperties;
import com.example.siteamame.model.File;
import org.springframework.stereotype.Component;

/**
 * Seul endroit où une clé de stockage devient une URL. La base ne contient que des clés :
 * changer de domaine ou de CDN revient à changer MEDIA_BASE_URL, sans toucher aux données.
 */
@Component
public class MediaUrlResolver {

    /** Les fichiers privés ne se lisent que par cet endpoint authentifié. */
    private static final String PRIVATE_FILE_ENDPOINT = "/api/user/files/";

    private final String publicBaseUrl;

    public MediaUrlResolver(StorageProperties props) {
        String base = props.publicBaseUrl();
        this.publicBaseUrl = (base == null) ? "" : base.trim().replaceAll("/+$", "");
    }

    /** URL publique d'un fichier public, endpoint authentifié pour un fichier privé. */
    public String urlOf(File file) {
        if (file == null || file.getFilePath() == null) return null;
        if (StoragePaths.isPrivate(file.getFilePath())) return PRIVATE_FILE_ENDPOINT + file.getId();
        return publicUrl(file.getFilePath());
    }

    /**
     * URL publique d'une clé. Base vide (développement, stockage local) : « /uploads/… »,
     * servi par Nginx ou par Spring. Une clé privée n'a pas d'URL publique.
     */
    public String publicUrl(String filePath) {
        if (filePath == null || filePath.isBlank() || StoragePaths.isPrivate(filePath)) return null;
        return publicBaseUrl + "/" + filePath;
    }
}
