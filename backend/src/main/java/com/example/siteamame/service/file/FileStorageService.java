package com.example.siteamame.service.file;

import com.example.siteamame.dto.file.FileDto;
import com.example.siteamame.enumeration.FileType;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Stockage des fichiers uploadés. Les services injectent cette interface, jamais une
 * implémentation : celle qui est active dépend de app.storage.provider.
 *
 * Cycle de vie d'un fichier (docs/03, §1.4) : l'objet est écrit avant que sa ligne file_entity soit
 * validée ; il est effacé tout de suite si la transaction est annulée (compensation). Une fois la
 * ligne validée, plus aucun service n'efface l'objet : supprimer la ligne l'inscrit dans
 * storage_purge_queue (déclencheur de la base), et seule la tâche de purge l'efface, après la rétention.
 */
public interface FileStorageService {

    /**
     * Valide le fichier puis le stocke sous une clé neuve uploads/&lt;folderName&gt;/&lt;uuid&gt;.&lt;ext&gt;.
     * FileDto.filePath contient la clé ; le type MIME et l'extension sont ceux du contenu détecté ;
     * FileDto.fileSha256 est l'empreinte du contenu. Appelée dans une transaction, l'écriture est
     * compensée si celle-ci est annulée.
     *
     * @throws InvalidUploadException si le fichier est refusé
     */
    FileDto storeFile(MultipartFile file, String folderName, FileType fileType) throws IOException;

    /**
     * Efface l'objet désigné par sa clé. Idempotent : un objet déjà absent n'est pas une erreur.
     * Réservé à la tâche de purge et à la compensation : les services métier ne l'appellent jamais.
     */
    void delete(String key) throws IOException;

    /** Lit un fichier à partir de sa clé (fichiers privés diffusés par le backend). */
    byte[] load(String filePath) throws IOException;
}
