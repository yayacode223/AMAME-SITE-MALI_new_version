package com.example.siteamame.service.file;

import com.example.siteamame.config.BunnyStorageProperties;
import com.example.siteamame.config.BunnyStorageProperties.Zone;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.http.HttpClient;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Faux Bunny Storage pour les tests : mêmes règles que l'API réelle pour ce que le backend utilise.
 * Mot de passe de la zone contrôlé à chaque appel (401 sinon), empreinte contrôlée à l'écriture
 * (400 si elle ne correspond pas au contenu), 404 pour un objet absent.
 */
final class FakeBunny implements AutoCloseable {

    static final Zone PUBLIC = new Zone("amame-public-test", "cle-publique-secrete");
    static final Zone PRIVATE = new Zone("amame-private-test", "cle-privee-secrete");

    /** Objets stockés, par « zone/clé ». */
    final Map<String, byte[]> objects = new ConcurrentHashMap<>();
    /** Requêtes reçues : « MÉTHODE zone/clé ». */
    final List<String> requests = new CopyOnWriteArrayList<>();
    /** En-têtes Checksum reçus. */
    final List<String> checksums = new CopyOnWriteArrayList<>();
    /** Nombre de prochaines requêtes auxquelles répondre 503. */
    final AtomicInteger failuresToSend = new AtomicInteger();
    /** Délai avant chaque réponse, en millisecondes. */
    volatile long delayMillis;

    private final HttpServer server;

    FakeBunny() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.setExecutor(Executors.newCachedThreadPool());
        server.createContext("/", this::handle);
        server.start();
    }

    BunnyStorageProperties properties(Duration timeout, int attempts) {
        return new BunnyStorageProperties("http://127.0.0.1:" + server.getAddress().getPort() + "/",
                PUBLIC, PRIVATE, Duration.ofSeconds(2), timeout, attempts);
    }

    BunnyStorageClient client(Duration timeout, int attempts) {
        HttpClient http = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofSeconds(2))
                .build();
        return new BunnyStorageClient(http, properties(timeout, attempts), 10);
    }

    static String sha256Hex(byte[] content) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(content));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private void handle(HttpExchange exchange) throws IOException {
        try {
            String path = exchange.getRequestURI().getPath().substring(1);
            requests.add(exchange.getRequestMethod() + " " + path);
            if (delayMillis > 0) {
                Thread.sleep(delayMillis);
            }
            if (failuresToSend.getAndUpdate(n -> Math.max(0, n - 1)) > 0) {
                respond(exchange, 503, new byte[0]);
                return;
            }
            String zone = path.substring(0, path.indexOf('/'));
            Zone expected = PUBLIC.name().equals(zone) ? PUBLIC : PRIVATE.name().equals(zone) ? PRIVATE : null;
            if (expected == null || !expected.accessKey().equals(exchange.getRequestHeaders().getFirst("AccessKey"))) {
                respond(exchange, 401, new byte[0]);
                return;
            }
            switch (exchange.getRequestMethod()) {
                case "PUT" -> {
                    byte[] body;
                    try (InputStream in = exchange.getRequestBody()) {
                        body = in.readAllBytes();
                    }
                    String checksum = exchange.getRequestHeaders().getFirst("Checksum");
                    checksums.add(checksum);
                    if (checksum != null && !checksum.equals(sha256Hex(body).toUpperCase())) {
                        respond(exchange, 400, new byte[0]);
                        return;
                    }
                    objects.put(path, body);
                    respond(exchange, 201, new byte[0]);
                }
                case "GET" -> {
                    byte[] body = objects.get(path);
                    respond(exchange, body == null ? 404 : 200, body == null ? new byte[0] : body);
                }
                case "DELETE" -> respond(exchange, objects.remove(path) == null ? 404 : 200, new byte[0]);
                default -> respond(exchange, 405, new byte[0]);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            exchange.close();
        }
    }

    private static void respond(HttpExchange exchange, int status, byte[] body) throws IOException {
        exchange.sendResponseHeaders(status, body.length == 0 ? -1 : body.length);
        if (body.length > 0) {
            try (OutputStream out = exchange.getResponseBody()) {
                out.write(body);
            }
        }
    }

    @Override
    public void close() {
        server.stop(0);
    }
}
