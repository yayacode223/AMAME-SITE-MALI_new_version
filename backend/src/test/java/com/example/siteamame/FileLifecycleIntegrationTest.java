package com.example.siteamame;

import com.example.siteamame.dto.article.ArticleCreationRequest;
import com.example.siteamame.dto.article.ArticleDto;
import com.example.siteamame.dto.user.UserReponseDto;
import com.example.siteamame.dto.user.UserRequestDto;
import com.example.siteamame.service.ArticleService;
import com.example.siteamame.service.file.StoragePurgeJob;
import com.example.siteamame.service.user.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Cycle de vie d'un fichier sur un vrai PostgreSQL (docs/03, étape 2, critères de sortie) :
 * les déclencheurs de V2 et V3 ne s'exécutent que sur PostgreSQL, d'où Testcontainers (DT4).
 * Docker est requis.
 */
@SpringBootTest(properties = {
        "app.storage.purge.enabled=true",
        "app.storage.purge.retention=10d"
})
@Testcontainers
class FileLifecycleIntegrationTest {

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3};
    private static final byte[] PNG_2 = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 4, 5, 6};
    private static final byte[] PDF = "%PDF-1.7\n%contenu".getBytes(StandardCharsets.US_ASCII);

    private static final Path UPLOAD_DIR = createTempDir();

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>(System.getProperty("test.postgres.image", "postgres:18-alpine"));

    @DynamicPropertySource
    static void storage(DynamicPropertyRegistry registry) {
        registry.add("app.storage.local.upload-dir", UPLOAD_DIR::toString);
    }

    @Autowired private ArticleService articleService;
    @Autowired private UserService userService;
    @Autowired private StoragePurgeJob purgeJob;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private PlatformTransactionManager transactionManager;

    @Test
    void replacingAnArticleImageQueuesTheOldFileWhichIsPurgedAfterRetention() throws IOException {
        ArticleDto created = articleService.createArticle(article("Remplacement " + UUID.randomUUID()), png(PNG));
        String oldKey = articleFileKey(created.getId());
        assertThat(sha256Of(oldKey)).matches("[0-9a-f]{64}");

        articleService.updateArticle(created.getId(), articleService.getArticleById(created.getId()), png(PNG_2));

        String newKey = articleFileKey(created.getId());
        assertThat(newKey).isNotEqualTo(oldKey);
        assertThat(count("select count(*) from file_entity where file_path = ?", oldKey)).isZero();
        assertThat(count("select count(*) from storage_purge_queue where object_key = ? and purged_at is null", oldKey))
                .isEqualTo(1);
        // L'ancien fichier reste sur le disque pendant la rétention : la suppression est annulable.
        assertThat(onDisk(oldKey)).exists();
        assertThat(purgeJob.purgeOlderThan(Duration.ofDays(10)).purged()).isZero();
        assertThat(onDisk(oldKey)).exists();

        // Rétention raccourcie : l'objet est effacé et l'entrée marquée purgée.
        assertThat(purgeJob.purgeOlderThan(Duration.ZERO).purged()).isGreaterThanOrEqualTo(1);
        assertThat(onDisk(oldKey)).doesNotExist();
        assertThat(onDisk(newKey)).exists();
        assertThat(count("select count(*) from storage_purge_queue where object_key = ? and purged_at is not null", oldKey))
                .isEqualTo(1);
    }

    @Test
    void aFailureAfterTheUploadLeavesNoFileBehind() throws IOException {
        String title = "Doublon " + UUID.randomUUID();
        articleService.createArticle(article(title), png(PNG));
        long filesBefore = filesIn("actualite");

        // Même titre, donc même slug (unique) : la transaction est annulée après l'envoi du fichier.
        assertThatThrownBy(() -> articleService.createArticle(article(title), png(PNG_2)))
                .isInstanceOf(DataAccessException.class);

        assertThat(filesIn("actualite")).isEqualTo(filesBefore);
    }

    @Test
    void deletingAUserQueuesTheirCvAndPhotoAndKeepsTheirDonations() throws IOException {
        UserRequestDto request = new UserRequestDto();
        request.setNom("Supprime");
        request.setPrenom("Compte");
        request.setEmail("suppression-" + UUID.randomUUID() + "@test.local");
        request.setPassword("secret-de-test");
        UserReponseDto user = userService.register(request,
                new MockMultipartFile("cv", "cv.pdf", "application/pdf", PDF), png(PNG));
        List<String> keys = jdbc.queryForList(
                "select f.file_path from users_files uf join file_entity f on f.id = uf.files_id where uf.user_id = ?",
                String.class, user.getId());
        assertThat(keys).hasSize(2);
        inTransaction(() -> {
            jdbc.update("insert into refresh_token (token, user_id, expiry_date, revoked, created_at) "
                    + "values (?, ?, now() + interval '1 day', false, now())", UUID.randomUUID().toString(), user.getId());
            jdbc.update("insert into dons (user_id, montant, date_don) values (?, 10, now())", user.getId());
        });

        userService.deleteUser(user.getId());

        assertThat(count("select count(*) from users where id = ?", user.getId())).isZero();
        for (String key : keys) {
            assertThat(count("select count(*) from storage_purge_queue where object_key = ?", key)).isEqualTo(1);
        }
        assertThat(count("select count(*) from refresh_token where user_id = ?", user.getId())).isZero();
        assertThat(count("select count(*) from dons where user_id is null")).isGreaterThanOrEqualTo(1);
    }

    @Test
    void theDatabaseRefusesToChangeAFileKey() throws IOException {
        ArticleDto created = articleService.createArticle(article("Clé immuable " + UUID.randomUUID()), png(PNG));
        String key = articleFileKey(created.getId());

        assertThatThrownBy(() -> inTransaction(() -> jdbc.update(
                "update file_entity set file_path = ? where file_path = ?",
                "uploads/actualite/" + UUID.randomUUID() + ".png", key)))
                .isInstanceOf(DataAccessException.class);
        assertThat(articleFileKey(created.getId())).isEqualTo(key);
    }

    // ── Outils ──────────────────────────────────────────────────────────────

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
        return new MockMultipartFile("file", "image.png", "image/png", content);
    }

    private String articleFileKey(long articleId) {
        return jdbc.queryForObject(
                "select f.file_path from article a join file_entity f on f.id = a.file_id where a.id = ?",
                String.class, articleId);
    }

    private String sha256Of(String key) {
        return jdbc.queryForObject("select file_sha256 from file_entity where file_path = ?", String.class, key);
    }

    private long count(String sql, Object... args) {
        Long n = jdbc.queryForObject(sql, Long.class, args);
        return n == null ? 0 : n;
    }

    private void inTransaction(Runnable work) {
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> work.run());
    }

    private static Path onDisk(String key) {
        return UPLOAD_DIR.resolve(key.substring("uploads/".length()));
    }

    private static long filesIn(String folder) throws IOException {
        Path dir = UPLOAD_DIR.resolve(folder);
        if (!Files.isDirectory(dir)) {
            return 0;
        }
        try (Stream<Path> files = Files.list(dir)) {
            return files.count();
        }
    }

    private static Path createTempDir() {
        try {
            return Files.createTempDirectory("amame-uploads-test");
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
