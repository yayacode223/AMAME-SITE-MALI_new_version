package com.example.siteamame.service.file;

import com.example.siteamame.dto.file.FileDto;
import com.example.siteamame.enumeration.FileType;
import com.example.siteamame.repository.FileRepository;

import lombok.Getter;
import lombok.Setter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Service
public class FileStorageServiceImpl implements FileStorageService {

    private final FileRepository fileRepository;
    private final Logger log = LoggerFactory.getLogger(FileStorageServiceImpl.class);

    // Déclaration des types MIME autorisés
    private final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpg",
            "image/jpeg",
            "image/png",
            "image/gif",
            "application/pdf", // PDF
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
            "application/msword",
            "application/vnd.ms-excel", // XLS
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" // XLSX
    );

    private final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "gif", "pdf", "docx", "doc", "xls", "xlsx"
    );

    @Value("uploads/")
    private  String uploads;
    public FileStorageServiceImpl(@Value("${file.storage.upload-dir}") String uploadDir, FileRepository fileRepository) {
        this.fileRepository = fileRepository;
    }

    public void createFolder(Path fileStorage) throws IOException {
        try {
            Files.createDirectories(fileStorage);
            log.info("dossier de stockage initialisé : {}", fileStorage);
        } catch (Exception e) {
            throw new RuntimeException("Impossible de creer le dossier uploads", e);
        }
    }

    public void deleteFile(String fileName,  String folderName) throws IOException{
        Path fileStorage = Paths.get(uploads, folderName).toAbsolutePath().normalize();

        Path filePath = fileStorage.resolve(fileName).normalize();
        try{
            Files.deleteIfExists(filePath);
        } catch(IOException e) {
            throw new RuntimeException("Impossible de supprimer ce fichier " + fileName, e);
        }
    }

    public FileDto storeFile(MultipartFile file, String folderName, FileType fileType)throws IOException {
        Path fileStorage = Paths.get(uploads, folderName).toAbsolutePath().normalize();

        //creation du dossier
        createFolder(fileStorage);

        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename() != null ?
                file.getOriginalFilename()
                : ""
        );

        // Validation du nom du fichier
        if (originalFileName.contains("..")) {
            throw new RuntimeException("Nom du fichier invalide " + originalFileName);
        }

        // Validation du type MIME
        String detectedType = file.getContentType();
        if (!ALLOWED_MIME_TYPES.contains(detectedType)) {
            throw new RuntimeException("Type du fichier invalide " + detectedType);
        }

        // Validation de l'extension du fichier
        String fileExtension = getFileExtension(originalFileName);
        if (!ALLOWED_EXTENSIONS.contains(fileExtension)) {
            throw new RuntimeException("Extension de fichier invalide " + fileExtension);
        }

        String fileName = UUID.randomUUID() + "." + fileExtension;

        // la recuperation du dossier de stokage
        Path targetLocation = Paths.get(fileStorage.toString(), fileName);

        try {
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

                return new FileDto(
                    fileName,
                    fileType,
                    Paths.get(uploads, folderName, fileName).toString().replace("\\", "/"),
                    detectedType,
                    file.getSize()
            );

        } catch (IOException e) {
            log.error("Erreur de stockage pour le fichier {}", originalFileName, e);
            throw new RuntimeException("Erreur de stockage pour le fichier " + originalFileName, e);
        }
    }

    private String getFileExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf(".");
        if (dotIndex < 0) return "bin"; // Retourner "bin" si aucune extension n'est trouvée
        return fileName.substring(dotIndex + 1).toLowerCase(); // Convertir en minuscule pour la cohérence
    }
}

