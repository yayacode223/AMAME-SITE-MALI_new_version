package com.example.siteamame.service.file;

import com.example.siteamame.dto.file.FileDto;
import com.example.siteamame.enumeration.FileType;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Stockage des fichiers uploadés. Les services injectent cette interface, jamais une
 * implémentation : celle qui est active dépend de app.storage.provider.
 */
public interface FileStorageService {

    /**
     * Valide le fichier puis le stocke sous une clé neuve uploads/&lt;folderName&gt;/&lt;uuid&gt;.&lt;ext&gt;.
     * FileDto.filePath contient la clé ; le type MIME et l'extension sont ceux du contenu détecté.
     *
     * @throws InvalidUploadException si le fichier est refusé
     */
    FileDto storeFile(MultipartFile file, String folderName, FileType fileType) throws IOException;

    void deleteFile(String fileName, String folderName) throws IOException;

    /** Lit un fichier à partir de sa clé (fichiers privés diffusés par le backend). */
    byte[] load(String filePath) throws IOException;
}
