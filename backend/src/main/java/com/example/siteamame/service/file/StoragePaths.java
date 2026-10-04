package com.example.siteamame.service.file;

import java.util.regex.Pattern;

/**
 * Règles communes aux clés de stockage (uploads/&lt;dossier&gt;/&lt;uuid&gt;.&lt;ext&gt;).
 * La zone d'un fichier se déduit de sa clé : tout ce qui est sous uploads/utilisateur/ est privé.
 */
public final class StoragePaths {
    public static final String PRIVATE_FOLDER = "utilisateur";
    private static final Pattern SAFE_KEY = Pattern.compile("^[a-z0-9][a-z0-9/_.-]*$");

    private StoragePaths() {}

    public static String key(String folder, String fileName) {
        return "uploads/" + folder + "/" + fileName;
    }

    public static boolean isPrivate(String key) {
        return key != null && key.startsWith("uploads/" + PRIVATE_FOLDER + "/");
    }

    /** Les clés sont générées (dossier + UUID + extension) : tout autre format est refusé. */
    public static String requireSafe(String key) {
        if (key == null || !SAFE_KEY.matcher(key).matches() || key.contains("..")) {
            throw new IllegalArgumentException("Clé de stockage invalide : " + key);
        }
        return key;
    }
}
