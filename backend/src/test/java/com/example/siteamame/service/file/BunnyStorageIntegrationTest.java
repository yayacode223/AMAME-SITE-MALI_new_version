package com.example.siteamame.service.file;

import com.example.siteamame.dto.article.ArticleCreationRequest;
import com.example.siteamame.dto.article.ArticleDto;
import com.example.siteamame.dto.user.UserReponseDto;
import com.example.siteamame.dto.user.UserRequestDto;
import com.example.siteamame.service.ArticleService;
import com.example.siteamame.service.user.UserService;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.actuate.health.Status;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static com.example.siteamame.service.file.FakeBunny.PRIVATE;
import static com.example.siteamame.service.file.FakeBunny.PUBLIC;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Application complète avec STORAGE_PROVIDER=bunny, face à un faux Bunny, sur un vrai PostgreSQL
 * (déclencheurs de V2, V3 et V5) : le cycle de vie des fichiers de l'étape 2 est inchangé, les objets
 * vont dans la bonne zone, et les URL publiques pointent vers le CDN. Docker est requis.
 */
@SpringBootTest(properties = {
        "app.storage.provider=bunny",
        "app.storage.public-base-url=https://media.amame.ml",
        "app.storage.purge.enabled=true"
})
@Testcontainers
class BunnyStorageIntegrationTest {

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3};
    private static final byte[] PNG_2 = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 4, 5, 6};
    private static final byte[] PDF = "%PDF-1.7\n%contenu".getBytes(StandardCharsets.US_ASCII);

    private static final FakeBunny BUNNY = startBunny();

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>(System.getProperty("test.postgres.image", "postgres:15-alpine"));

    @DynamicPropertySource
    static void bunny(DynamicPropertyRegistry registry) {
        var props = BUNNY.properties(Duration.ofSeconds(5), 2);
        registry.add("app.storage.bunny.endpoint", props::endpoint);
        registry.add("app.storage.bunny.public-zone.name", PUBLIC::name);
        registry.add("app.storage.bunny.public-zone.access-key", PUBLIC::accessKey);
        registry.add("app.storage.bunny.private-zone.name", PRIVATE::name);
        registry.add("app.storage.bunny.private-zone.access-key", PRIVATE::accessKey);
    }

    @Autowired private FileStorageService storage;
    @Autowired private ArticleService articleService;
    @Autowired private UserService userService;
    @Autowired private StoragePurgeJob purgeJob;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private List<HealthIndicator> indicators;

    @AfterAll
    static void stopBunny() {
        BUNNY.close();
    }

    @Test
    void theBunnyImplementationIsActiveWithItsHealthIndicator() {
        assertThat(storage).isInstanceOf(BunnyFileStorageService.class);
        assertThat(indicators).anyMatch(BunnyStorageHealthIndicator.class::isInstance);
    }

    @Test
    void anArticleImageGoesToThePublicZoneAndItsUrlPointsToTheCdn() throws IOException {
        ArticleDto created = articleService.createArticle(article("Bunny " + UUID.randomUUID()), png(PNG));
        String key = articleFileKey(created.getId());

        assertThat(BUNNY.objects).containsKey(PUBLIC.name() + "/" + key);
        assertThat(created.getFileUrl()).isEqualTo("https://media.amame.ml/" + key);
        assertThat(sha256Of(key)).isEqualTo(FakeBunny.sha256Hex(PNG));
    }

    @Test
    void replacingAnImageQueuesTheOldObjectWhichThePurgeDeletesFromBunny() throws IOException {
        ArticleDto created = articleService.createArticle(article("Remplacement " + UUID.randomUUID()), png(PNG));
        String oldKey = articleFileKey(created.getId());

        articleService.updateArticle(created.getId(), articleService.getArticleById(created.getId()), png(PNG_2));
        String newKey = articleFileKey(created.getId());

        assertThat(newKey).isNotEqualTo(oldKey);
        assertThat(count("select count(*) from storage_purge_queue where object_key = ? and purged_at is null", oldKey))
                .isEqualTo(1);
        // Pendant la rétention, l'ancien objet reste dans Bunny : la suppression est annulable.
        assertThat(BUNNY.objects).containsKey(PUBLIC.name() + "/" + oldKey);

        assertThat(purgeJob.purgeOlderThan(Duration.ZERO).purged()).isGreaterThanOrEqualTo(1);

        assertThat(BUNNY.objects).doesNotContainKey(PUBLIC.name() + "/" + oldKey);
        assertThat(BUNNY.objects).containsKey(PUBLIC.name() + "/" + newKey);
    }

    @Test
    void aFailureAfterTheUploadLeavesNoObjectInBunny() throws IOException {
        String title = "Doublon " + UUID.randomUUID();
        articleService.createArticle(article(title), png(PNG));
        int objectsBefore = BUNNY.objects.size();

        // Même titre, donc même slug (unique) : la transaction est annulée après l'envoi du fichier.
        assertThatThrownBy(() -> articleService.createArticle(article(title), png(PNG_2)))
                .isInstanceOf(RuntimeException.class);

        assertThat(BUNNY.objects).hasSize(objectsBefore);
    }

    @Test
    void theFilesOfARegisteredUserGoToThePrivateZoneOnly() throws IOException {
        UserRequestDto request = new UserRequestDto();
        request.setNom("Prive");
        request.setPrenom("Compte");
        request.setEmail("prive-" + UUID.randomUUID() + "@test.local");
        request.setPassword("secret-de-test");
        UserReponseDto user = userService.register(request,
                new MockMultipartFile("cv", "cv.pdf", "application/pdf", PDF), png(PNG));

        List<String> keys = jdbc.queryForList(
                "select f.file_path from users_files uf join file_entity f on f.id = uf.files_id where uf.user_id = ?",
                String.class, user.getId());
        assertThat(keys).hasSize(2).allMatch(key -> key.startsWith("uploads/utilisateur/"));
        for (String key : keys) {
            assertThat(BUNNY.objects).containsKey(PRIVATE.name() + "/" + key);
            assertThat(BUNNY.objects).doesNotContainKey(PUBLIC.name() + "/" + key);
        }
        byte[] read = storage.load(keys.get(0));
        assertThat(Arrays.equals(read, PDF) || Arrays.equals(read, PNG)).isTrue();
        assertThat(indicators.stream().filter(BunnyStorageHealthIndicator.class::isInstance).findFirst()
                .orElseThrow().health().getStatus()).isEqualTo(Status.UP);
    }

    private static FakeBunny startBunny() {
        try {
            return new FakeBunny();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static ArticleCreationRequest article(String title) {
        ArticleCreationRequest request = new ArticleCreationRequest();
        request.setTitre(title);
        request.setContenu("Contenu");
        request.setAuteur("Test");
        request.setCategorie("Test");
        request.setEstPublie(true);
        return request;
    }

    private static MockMultipartFile png(byte[] content) {
        return new MockMultipartFile("image", "image.png", "image/png", content);
    }

    private String articleFileKey(long articleId) {
        return jdbc.queryForObject(
                "select f.file_path from article a join file_entity f on f.id = a.file_id where a.id = ?",
                String.class, articleId);
    }

    private String sha256Of(String key) {
        return jdbc.queryForObject("select file_sha256 from file_entity where file_path = ?", String.class, key);
    }

    private int count(String sql, Object... args) {
        Integer value = jdbc.queryForObject(sql, Integer.class, args);
        return value == null ? 0 : value;
    }
}
