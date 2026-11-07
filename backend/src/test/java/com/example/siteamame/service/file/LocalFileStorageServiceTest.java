package com.example.siteamame.service.file;

import com.example.siteamame.config.StorageProperties;
import com.example.siteamame.dto.file.FileDto;
import com.example.siteamame.enumeration.FileType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Le stockage local écrit dans le dossier configuré, et nulle part ailleurs. */
class LocalFileStorageServiceTest {

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3};

    @TempDir
    Path uploadDir;

    private LocalFileStorageService storage;

    @BeforeEach
    void setUp() {
        storage = new LocalFileStorageService(
                new StorageProperties("local", "", new StorageProperties.Local(uploadDir.toString())),
                new UploadValidator());
    }

    @Test
    void aStoredFileLandsInTheConfiguredDirectoryUnderItsKey() throws IOException {
        FileDto stored = storage.storeFile(
                new MockMultipartFile("image", "Photo de Profil.PNG", "image/png", PNG), "actualite", FileType.IMAGE);

        assertThat(stored.getFilePath()).matches("uploads/actualite/[0-9a-f-]{36}\\.png");
        assertThat(stored.getFilePath()).isEqualTo(StoragePaths.key("actualite", stored.getFileName()));
        assertThat(stored.getFileMimeType()).isEqualTo("image/png");
        assertThat(stored.getFileSize()).isEqualTo(PNG.length);
        assertThat(Files.readAllBytes(uploadDir.resolve("actualite").resolve(stored.getFileName()))).isEqualTo(PNG);
    }

    @Test
    void aStoredFileCanBeReadBackFromItsKeyThenDeleted() throws IOException {
        FileDto stored = storage.storeFile(
                new MockMultipartFile("cv", "cv.png", "image/png", PNG), "utilisateur", FileType.DOCUMENT);

        assertThat(storage.load(stored.getFilePath())).isEqualTo(PNG);

        storage.deleteFile(stored.getFileName(), "utilisateur");

        assertThat(uploadDir.resolve("utilisateur").resolve(stored.getFileName())).doesNotExist();
        // Supprimer un fichier déjà absent n'est pas une erreur
        storage.deleteFile(stored.getFileName(), "utilisateur");
    }

    @Test
    void aRefusedFileLeavesNothingOnDisk() {
        MockMultipartFile html = new MockMultipartFile("image", "photo.png", "image/png", "<html>".getBytes());

        assertThatThrownBy(() -> storage.storeFile(html, "actualite", FileType.IMAGE))
                .isInstanceOf(InvalidUploadException.class);
        assertThat(uploadDir.resolve("actualite")).doesNotExist();
    }

    @Test
    void aKeyCannotReachOutsideTheStorageDirectory() {
        assertThatThrownBy(() -> storage.load("uploads/../secret.txt")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> storage.load("etc/passwd")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> storage.load("/etc/passwd")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> storage.deleteFile("../../x.png", "actualite"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
