package com.example.siteamame.service.file;

import com.example.siteamame.dto.file.FileDto;
import com.example.siteamame.enumeration.FileType;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;


public interface FileStorageService {
    FileDto storeFile(MultipartFile file, String folderName, FileType fileType) throws IOException;
    void deleteFile(String fileName, String folderName) throws IOException;

    /** Lit un fichier à partir de sa clé (fichiers privés diffusés par le backend). */
    byte[] load(String filePath) throws IOException;
}

