package com.example.siteamame.service.file;

import com.example.siteamame.config.StorageProperties;
import com.example.siteamame.dto.file.FileDto;
import com.example.siteamame.enumeration.FileType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.UUID;

/**
 * Stockage sur disque : développement, production tant que STORAGE_PROVIDER=local, retour arrière.
 * La clé uploads/&lt;dossier&gt;/&lt;fichier&gt; désigne le fichier &lt;upload-dir&gt;/&lt;dossier&gt;/&lt;fichier&gt;.
 */
@Service
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "local", matchIfMissing = true)
public class LocalFileStorageService implements FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalFileStorageService.class);

    private final Path root;
    private final UploadValidator validator;

    public LocalFileStorageService(StorageProperties props, UploadValidator validator) {
        this.root = Paths.get(props.local().uploadDir()).toAbsolutePath().normalize();
        this.validator = validator;
        log.info("Stockage local des fichiers : {}", root);
    }

    @Override
    public FileDto storeFile(MultipartFile file, String folderName, FileType fileType) throws IOException {
        ValidatedFile valid = validator.validate(file, fileType);
        String fileName = UUID.randomUUID() + "." + valid.extension();
        String key = StoragePaths.key(folderName, fileName);

        Path target = resolve(key);
        Files.createDirectories(target.getParent());
        // Une clé n'est jamais réécrite : CREATE_NEW échoue si le fichier existe déjà.
        Files.write(target, valid.content(), StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE);

        return new FileDto(fileName, fileType, key, valid.mimeType(), valid.content().length);
    }

    @Override
    public void deleteFile(String fileName, String folderName) throws IOException {
        Files.deleteIfExists(resolve(StoragePaths.key(folderName, fileName)));
    }

    @Override
    public byte[] load(String filePath) throws IOException {
        Path path = resolve(filePath);
        if (!Files.isRegularFile(path)) {
            throw new NoSuchFileException(path.toString());
        }
        try (InputStream in = new FileInputStream(path.toFile())) {
            return StorageIo.readExactly(in, Files.size(path));
        }
    }

    /** Chemin sur disque d'une clé ; refuse toute clé qui sortirait du dossier de stockage. */
    private Path resolve(String key) {
        StoragePaths.requireSafe(key);
        if (!key.startsWith(StoragePaths.ROOT_PREFIX)) {
            throw new IllegalArgumentException("Clé de stockage invalide : " + key);
        }
        Path target = root.resolve(key.substring(StoragePaths.ROOT_PREFIX.length())).normalize();
        if (!target.startsWith(root)) {
            throw new IllegalArgumentException("Clé de stockage invalide : " + key);
        }
        return target;
    }
}
