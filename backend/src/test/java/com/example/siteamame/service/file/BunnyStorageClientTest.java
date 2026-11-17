package com.example.siteamame.service.file;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.NoSuchFileException;
import java.time.Duration;

import static com.example.siteamame.service.file.FakeBunny.PRIVATE;
import static com.example.siteamame.service.file.FakeBunny.PUBLIC;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Client de Bunny Storage face à un faux Bunny : contrat de l'API, budget de DT5, aucun secret dans les erreurs. */
class BunnyStorageClientTest {

    private static final String KEY = "uploads/actualite/0b8f1d2e-3a4b-4c5d-8e9f-a0b1c2d3e4f5.png";
    private static final byte[] CONTENT = "contenu de test".getBytes(StandardCharsets.UTF_8);

    private FakeBunny bunny;
    private BunnyStorageClient client;

    @BeforeEach
    void setUp() throws IOException {
        bunny = new FakeBunny();
        client = bunny.client(Duration.ofSeconds(2), 2);
    }

    @AfterEach
    void tearDown() {
        client.close();
        bunny.close();
    }

    @Test
    void anObjectIsWrittenWithItsChecksumReadBackThenDeleted() throws IOException {
        client.put(PUBLIC, KEY, CONTENT, "image/png", FakeBunny.sha256Hex(CONTENT));

        assertThat(bunny.objects).containsKey(PUBLIC.name() + "/" + KEY);
        // Bunny exige l'empreinte en hexadécimal majuscule
        assertThat(bunny.checksums).containsExactly(FakeBunny.sha256Hex(CONTENT).toUpperCase());
        assertThat(client.get(PUBLIC, KEY)).isEqualTo(CONTENT);

        client.delete(PUBLIC, KEY);

        assertThat(bunny.objects).isEmpty();
    }

    @Test
    void aContentThatDoesNotMatchItsChecksumIsRefused() {
        assertThatThrownBy(() -> client.put(PUBLIC, KEY, CONTENT, "image/png", FakeBunny.sha256Hex(new byte[]{1})))
                .isInstanceOf(IOException.class)
                .hasMessageContaining("HTTP 400")
                .hasMessageContaining(PUBLIC.name() + "/" + KEY);
        assertThat(bunny.objects).isEmpty();
    }

    @Test
    void aMissingObjectIsReportedAsSuchAndItsDeletionIsNotAnError() throws IOException {
        assertThatThrownBy(() -> client.get(PRIVATE, KEY)).isInstanceOf(NoSuchFileException.class);

        client.delete(PRIVATE, KEY);
    }

    @Test
    void aServerErrorIsRetriedOnceWithinTheBudget() throws IOException {
        bunny.failuresToSend.set(1);

        client.put(PUBLIC, KEY, CONTENT, "image/png", FakeBunny.sha256Hex(CONTENT));

        assertThat(bunny.requests).hasSize(2);
        assertThat(bunny.objects).containsKey(PUBLIC.name() + "/" + KEY);
    }

    @Test
    void afterTheLastAttemptTheErrorIsReturned() {
        bunny.failuresToSend.set(5);

        assertThatThrownBy(() -> client.put(PUBLIC, KEY, CONTENT, "image/png", FakeBunny.sha256Hex(CONTENT)))
                .isInstanceOf(IOException.class)
                .hasMessageContaining("HTTP 503");
        assertThat(bunny.requests).hasSize(2);
    }

    @Test
    void aSlowAnswerIsAbandonedAfterTheTimeoutOfEachAttempt() throws IOException {
        bunny.delayMillis = 1_500;
        try (BunnyStorageClient impatient = bunny.client(Duration.ofMillis(300), 2)) {
            long start = System.nanoTime();

            assertThatThrownBy(() -> impatient.get(PUBLIC, KEY))
                    .isInstanceOf(IOException.class)
                    .hasMessageContaining("Bunny injoignable");

            assertThat(Duration.ofNanos(System.nanoTime() - start)).isLessThan(Duration.ofMillis(1_400));
        }
    }

    @Test
    void aWrongPasswordFailsWithoutRevealingAnyPassword() {
        var wrong = new com.example.siteamame.config.BunnyStorageProperties.Zone(PUBLIC.name(), "mauvais-mot-de-passe");

        assertThatThrownBy(() -> client.put(wrong, KEY, CONTENT, "image/png", FakeBunny.sha256Hex(CONTENT)))
                .isInstanceOf(IOException.class)
                .hasMessageContaining("HTTP 401")
                .hasMessageNotContaining("mauvais-mot-de-passe")
                .hasMessageNotContaining(PUBLIC.accessKey());
        assertThat(wrong.toString()).doesNotContain("mauvais-mot-de-passe");
    }

    @Test
    void aKeyOutsideTheAllowedFormatIsRefusedBeforeAnyCall() {
        assertThatThrownBy(() -> client.get(PUBLIC, "uploads/../secret"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(bunny.requests).isEmpty();
    }
}
