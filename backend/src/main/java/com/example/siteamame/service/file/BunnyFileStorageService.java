package com.example.siteamame.service.file;

import com.example.siteamame.config.BunnyStorageProperties;
import com.example.siteamame.config.BunnyStorageProperties.Zone;
import com.example.siteamame.dto.file.FileDto;
import com.example.siteamame.enumeration.FileType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.NoSuchFileException;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Stockage dans Bunny (STORAGE_PROVIDER=bunny, étape 3). Même clé, même cycle de vie qu'en local :
 * l'objet est écrit avant la validation de sa ligne et effacé tout de suite si la transaction est
 * annulée ; ensuite, seule la tâche de purge l'efface ({@link FileStorageService}).
 *
 * La zone se déduit de la clé : uploads/utilisateur/ va dans la zone privée, jamais servie par le
 * CDN ; tout le reste dans la zone publique, origine du CDN.
 */
@Service
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "bunny")
public class BunnyFileStorageService implements FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(BunnyFileStorageService.class);

    private final BunnyStorageClient client;
    private final Zone publicZone;
    private final Zone privateZone;
    private final UploadValidator validator;
    private final AtomicReference<Outcome> lastOutcome = new AtomicReference<>();

    public BunnyFileStorageService(BunnyStorageClient client, BunnyStorageProperties props, UploadValidator validator) {
        this.client = client;
        this.publicZone = props.publicZone();
        this.privateZone = props.privateZone();
        this.validator = validator;
        log.info("Stockage des fichiers dans Bunny : zone publique {}, zone privée {}",
                publicZone.name(), privateZone.name());
    }

    @Override
    public FileDto storeFile(MultipartFile file, String folderName, FileType fileType) throws IOException {
        ValidatedFile valid = validator.validate(file, fileType);
        String fileName = UUID.randomUUID() + "." + valid.extension();
        String key = StoragePaths.key(folderName, fileName);
        String sha256 = valid.sha256();

        track(() -> {
            client.put(zoneFor(key), key, valid.content(), valid.mimeType(), sha256);
            return null;
        });
        UploadCompensation.deleteOnRollback(key, this);

        return new FileDto(fileName, fileType, key, valid.mimeType(), valid.content().length, sha256);
    }

    @Override
    public void delete(String key) throws IOException {
        track(() -> {
            client.delete(zoneFor(key), key);
            return null;
        });
    }

    @Override
    public byte[] load(String filePath) throws IOException {
        return track(() -> client.get(zoneFor(filePath), filePath));
    }

    /** Résultat du dernier appel à Bunny, ou null s'il n'y en a pas eu depuis le démarrage. */
    Outcome lastOutcome() {
        return lastOutcome.get();
    }

    /** Zone d'une clé ; refuse toute clé hors du format uploads/&lt;dossier&gt;/&lt;fichier&gt;. */
    Zone zoneFor(String key) {
        StoragePaths.requireSafe(key);
        if (!key.startsWith(StoragePaths.ROOT_PREFIX)) {
            throw new IllegalArgumentException("Clé de stockage invalide : " + key);
        }
        return StoragePaths.isPrivate(key) ? privateZone : publicZone;
    }

    /** Exécute un appel et retient son issue ; un objet absent est une réponse normale de Bunny. */
    private <T> T track(BunnyCall<T> call) throws IOException {
        try {
            T result = call.run();
            lastOutcome.set(new Outcome(true, Instant.now(), null));
            return result;
        } catch (NoSuchFileException e) {
            lastOutcome.set(new Outcome(true, Instant.now(), null));
            throw e;
        } catch (IOException | RuntimeException e) {
            lastOutcome.set(new Outcome(false, Instant.now(), e.getMessage()));
            throw e;
        }
    }

    @FunctionalInterface
    private interface BunnyCall<T> {
        T run() throws IOException;
    }

    /** Issue d'un appel à Bunny : succès, ou échec avec son message (sans aucun mot de passe). */
    record Outcome(boolean success, Instant at, String error) {}
}
