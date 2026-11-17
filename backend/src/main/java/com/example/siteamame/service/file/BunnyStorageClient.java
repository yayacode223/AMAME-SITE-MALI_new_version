package com.example.siteamame.service.file;

import com.example.siteamame.config.BunnyStorageProperties;
import com.example.siteamame.config.BunnyStorageProperties.Zone;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.io.InterruptedIOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.NoSuchFileException;
import java.time.Duration;
import java.util.Locale;
import java.util.OptionalLong;

/**
 * Client de l'API HTTP native de Bunny Storage (B02 D1) : écriture, lecture et suppression d'un objet
 * désigné par sa clé, dans une zone.
 *
 * <ul>
 *   <li>Le mot de passe de la zone part dans l'en-tête {@code AccessKey} et n'apparaît dans aucun
 *       message : les erreurs ne citent que la zone et la clé.</li>
 *   <li>Chaque écriture porte l'empreinte SHA-256 du contenu (en-tête {@code Checksum}) : Bunny refuse
 *       un contenu qui ne lui correspond pas.</li>
 *   <li>Budget de DT5 : délai de réponse borné, et une nouvelle tentative seulement après une erreur
 *       réseau ou une réponse 5xx. Les trois opérations sont idempotentes : réécrire la même clé avec
 *       le même contenu ne change rien, supprimer un objet absent non plus.</li>
 *   <li>Lecture par petits blocs ({@link StorageIo}) : pas de grand tampon hors du tas.</li>
 * </ul>
 */
public class BunnyStorageClient implements AutoCloseable {

    private static final Logger log = LoggerFactory.getLogger(BunnyStorageClient.class);

    /** Au-delà de la limite des uploads (10 Mo), avec une marge : un objet plus gros est refusé à la lecture. */
    static final long MAX_OBJECT_SIZE = 16L * 1024 * 1024;

    private final HttpClient http;
    private final String endpoint;
    private final Duration timeout;
    private final int attempts;
    private final long retryDelayMillis;

    public BunnyStorageClient(HttpClient http, BunnyStorageProperties props) {
        this(http, props, 500);
    }

    BunnyStorageClient(HttpClient http, BunnyStorageProperties props, long retryDelayMillis) {
        this.http = http;
        String base = props.endpoint();
        while (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        this.endpoint = base;
        this.timeout = props.timeout();
        this.attempts = Math.max(1, props.attempts());
        this.retryDelayMillis = retryDelayMillis;
    }

    /** Écrit l'objet. {@code sha256Hex} : empreinte du contenu, contrôlée par Bunny à la réception. */
    public void put(Zone zone, String key, byte[] content, String contentType, String sha256Hex) throws IOException {
        HttpRequest request = request(zone, key)
                .header("Checksum", sha256Hex.toUpperCase(Locale.ROOT))
                .header("Content-Type", contentType)
                .PUT(HttpRequest.BodyPublishers.ofByteArray(content))
                .build();
        HttpResponse<Void> response = send(request, HttpResponse.BodyHandlers.discarding(), zone, key);
        if (response.statusCode() != 201 && response.statusCode() != 200) {
            throw failure("écriture", response.statusCode(), zone, key);
        }
    }

    /**
     * Lit l'objet entier.
     *
     * @throws NoSuchFileException si l'objet n'existe pas dans la zone
     */
    public byte[] get(Zone zone, String key) throws IOException {
        HttpResponse<InputStream> response =
                send(request(zone, key).GET().build(), HttpResponse.BodyHandlers.ofInputStream(), zone, key);
        try (InputStream body = response.body()) {
            if (response.statusCode() == 404) {
                throw new NoSuchFileException(target(zone, key));
            }
            if (response.statusCode() != 200) {
                throw failure("lecture", response.statusCode(), zone, key);
            }
            OptionalLong length = response.headers().firstValueAsLong("Content-Length");
            if (length.isPresent()) {
                if (length.getAsLong() > MAX_OBJECT_SIZE) {
                    throw new IOException("Bunny : objet trop volumineux (" + length.getAsLong() + " octets) : "
                            + target(zone, key));
                }
                return StorageIo.readExactly(body, length.getAsLong());
            }
            return StorageIo.readAtMost(body, MAX_OBJECT_SIZE);
        }
    }

    /** Supprime l'objet. Idempotent : un objet déjà absent n'est pas une erreur. */
    public void delete(Zone zone, String key) throws IOException {
        HttpResponse<Void> response =
                send(request(zone, key).DELETE().build(), HttpResponse.BodyHandlers.discarding(), zone, key);
        int status = response.statusCode();
        if (status != 200 && status != 204 && status != 404) {
            throw failure("suppression", status, zone, key);
        }
    }

    @Override
    public void close() {
        http.close();
    }

    private HttpRequest.Builder request(Zone zone, String key) {
        StoragePaths.requireSafe(key);
        return HttpRequest.newBuilder(URI.create(endpoint + "/" + zone.name() + "/" + key))
                .timeout(timeout)
                .header("AccessKey", zone.accessKey());
    }

    /** Envoie la requête ; recommence après une erreur réseau ou une réponse 5xx, dans la limite du budget. */
    private <T> HttpResponse<T> send(HttpRequest request, HttpResponse.BodyHandler<T> handler, Zone zone, String key)
            throws IOException {
        for (int attempt = 1; ; attempt++) {
            try {
                HttpResponse<T> response = http.send(request, handler);
                if (response.statusCode() < 500 || attempt >= attempts) {
                    return response;
                }
                discard(response.body());
                log.warn("Bunny : HTTP {} pour {}, tentative {} sur {}",
                        response.statusCode(), target(zone, key), attempt, attempts);
            } catch (IOException e) {
                if (attempt >= attempts) {
                    throw new IOException("Bunny injoignable pour " + target(zone, key) + " : " + e, e);
                }
                log.warn("Bunny : {} pour {}, tentative {} sur {}", e.toString(), target(zone, key), attempt, attempts);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new InterruptedIOException("Appel à Bunny interrompu : " + target(zone, key));
            }
            pause();
        }
    }

    private void pause() throws InterruptedIOException {
        try {
            Thread.sleep(retryDelayMillis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new InterruptedIOException("Appel à Bunny interrompu");
        }
    }

    private static void discard(Object body) {
        if (body instanceof InputStream in) {
            try {
                in.close();
            } catch (IOException ignored) {
                // corps d'une réponse en échec : rien à en tirer
            }
        }
    }

    private static IOException failure(String operation, int status, Zone zone, String key) {
        return new IOException("Bunny : " + operation + " refusée (HTTP " + status + ") pour " + target(zone, key));
    }

    private static String target(Zone zone, String key) {
        return zone.name() + "/" + key;
    }
}
