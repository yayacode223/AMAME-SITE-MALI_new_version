package com.example.siteamame.service.file;

import com.example.siteamame.dto.file.FileDto;
import com.example.siteamame.enumeration.FileType;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.actuate.health.Status;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.io.IOException;
import java.time.Duration;

import static com.example.siteamame.service.file.FakeBunny.PRIVATE;
import static com.example.siteamame.service.file.FakeBunny.PUBLIC;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Stockage dans Bunny : zone déduite de la clé, empreinte, compensation, état de santé. */
class BunnyFileStorageServiceTest {

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3};

    private FakeBunny bunny;
    private BunnyStorageClient client;
    private BunnyFileStorageService storage;
    private BunnyStorageHealthIndicator health;

    @BeforeEach
    void setUp() throws IOException {
        bunny = new FakeBunny();
        client = bunny.client(Duration.ofSeconds(2), 2);
        storage = new BunnyFileStorageService(client, bunny.properties(Duration.ofSeconds(2), 2), new UploadValidator());
        health = new BunnyStorageHealthIndicator(storage);
    }

    @AfterEach
    void tearDown() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
        client.close();
        bunny.close();
    }

    @Test
    void aPublicFileGoesToThePublicZoneUnderItsKeyWithItsChecksum() throws IOException {
        FileDto stored = storage.storeFile(png("photo.png"), "actualite", FileType.IMAGE);

        assertThat(stored.getFilePath()).matches("uploads/actualite/[0-9a-f-]{36}\\.png");
        assertThat(stored.getFileSha256()).isEqualTo(FakeBunny.sha256Hex(PNG));
        assertThat(stored.getFileMimeType()).isEqualTo("image/png");
        assertThat(stored.getFileSize()).isEqualTo(PNG.length);
        assertThat(bunny.objects).containsOnlyKeys(PUBLIC.name() + "/" + stored.getFilePath());
        assertThat(bunny.checksums).containsExactly(FakeBunny.sha256Hex(PNG).toUpperCase());
    }

    @Test
    void aFileOfARegisteredUserGoesToThePrivateZoneAndIsReadBackFromIt() throws IOException {
        FileDto stored = storage.storeFile(png("cv.png"), "utilisateur", FileType.DOCUMENT);

        assertThat(bunny.objects).containsOnlyKeys(PRIVATE.name() + "/" + stored.getFilePath());
        assertThat(storage.load(stored.getFilePath())).isEqualTo(PNG);

        storage.delete(stored.getFilePath());

        assertThat(bunny.objects).isEmpty();
        storage.delete(stored.getFilePath());
    }

    @Test
    void anUploadWhoseTransactionIsRolledBackIsDeletedAtOnce() throws IOException {
        TransactionSynchronizationManager.initSynchronization();
        storage.storeFile(png("photo.png"), "actualite", FileType.IMAGE);
        assertThat(bunny.objects).hasSize(1);

        for (TransactionSynchronization sync : TransactionSynchronizationManager.getSynchronizations()) {
            sync.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);
        }

        assertThat(bunny.objects).isEmpty();
    }

    @Test
    void anUploadWhoseTransactionIsCommittedStays() throws IOException {
        TransactionSynchronizationManager.initSynchronization();
        storage.storeFile(png("photo.png"), "actualite", FileType.IMAGE);

        for (TransactionSynchronization sync : TransactionSynchronizationManager.getSynchronizations()) {
            sync.afterCompletion(TransactionSynchronization.STATUS_COMMITTED);
        }

        assertThat(bunny.objects).hasSize(1);
    }

    @Test
    void aRefusedFileIsNeverSent() {
        MockMultipartFile notAnImage = new MockMultipartFile("image", "photo.png", "image/png", "pas une image".getBytes());

        assertThatThrownBy(() -> storage.storeFile(notAnImage, "actualite", FileType.IMAGE))
                .isInstanceOf(InvalidUploadException.class);
        assertThat(bunny.requests).isEmpty();
    }

    @Test
    void theZoneOfAKeyIsDeducedFromItAndForeignKeysAreRefused() {
        assertThat(storage.zoneFor("uploads/utilisateur/a.pdf")).isEqualTo(PRIVATE);
        assertThat(storage.zoneFor("uploads/partenaire/a.png")).isEqualTo(PUBLIC);
        assertThatThrownBy(() -> storage.zoneFor("static/hero.webp")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> storage.zoneFor("uploads/../x")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void healthFollowsTheLastRealCallWithoutCallingBunny() throws IOException {
        assertThat(health.health().getStatus()).isEqualTo(Status.UNKNOWN);

        bunny.failuresToSend.set(5);
        assertThatThrownBy(() -> storage.storeFile(png("photo.png"), "actualite", FileType.IMAGE))
                .isInstanceOf(IOException.class);
        int requestsAfterFailure = bunny.requests.size();
        assertThat(health.health().getStatus()).isEqualTo(Status.DOWN);
        assertThat(health.health().getDetails().toString()).doesNotContain(PUBLIC.accessKey());

        bunny.failuresToSend.set(0);
        storage.storeFile(png("photo.png"), "actualite", FileType.IMAGE);
        assertThat(health.health().getStatus()).isEqualTo(Status.UP);
        // Les sondes n'ont envoyé aucune requête à Bunny
        assertThat(bunny.requests).hasSize(requestsAfterFailure + 1);
    }

    private static MockMultipartFile png(String name) {
        return new MockMultipartFile("image", name, "image/png", PNG);
    }
}
