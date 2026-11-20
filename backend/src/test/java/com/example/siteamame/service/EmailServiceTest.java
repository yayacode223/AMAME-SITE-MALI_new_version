package com.example.siteamame.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Year;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

/**
 * Contenu des e-mails : le sigle AMAME développé correctement, l'année courante dans le pied,
 * et les valeurs saisies (nom, e-mail, motif) échappées avant d'entrer dans le HTML.
 *
 * <p>Avec {@code -Demail.preview.dir=<dossier>}, chaque e-mail est aussi écrit dans ce dossier,
 * pour le regarder dans un navigateur.
 */
class EmailServiceTest {

    private static final String FULL_NAME = "Association Malienne d'Appui aux Meilleurs Élèves";

    private EmailService emailService;
    private EmailService self;

    @BeforeEach
    void setUp() {
        emailService = new EmailService(mock(JavaMailSender.class));
        // Les méthodes publiques passent par le proxy @Async (self.send) : on l'intercepte ici.
        self = mock(EmailService.class);
        ReflectionTestUtils.setField(emailService, "self", self);
        ReflectionTestUtils.setField(emailService, "frontendUrl", "https://amame.ml");
    }

    @Test
    void everyEmailSpellsOutTheAcronymCorrectlyAndCarriesTheCurrentYear() throws IOException {
        Map<String, String> emails = new LinkedHashMap<>();
        emailService.sendAdhesionRequestToAdmin("admin@amame.ml", "Awa", "Traoré", "awa@example.com", 12L);
        emails.put("demande-admin", sentTo("admin@amame.ml"));
        emailService.sendAdhesionApprovalToUser("awa@example.com", "Awa", "Traoré");
        emails.put("approbation", sentTo("awa@example.com"));
        emailService.sendAdhesionRejectionToUser("moussa@example.com", "Moussa", "Keita", "Dossier incomplet");
        emails.put("rejet", sentTo("moussa@example.com"));
        emailService.sendPasswordResetEmail("fanta@example.com", "Fanta", "Diarra", "jeton-123");
        emails.put("mot-de-passe", sentTo("fanta@example.com"));

        for (Map.Entry<String, String> email : emails.entrySet()) {
            String html = email.getValue();
            assertThat(html).as(email.getKey()).contains(FULL_NAME);
            assertThat(html).as(email.getKey()).doesNotContain("Avancement", "Mérite Éducatif");
            assertThat(html).as(email.getKey()).contains("© " + Year.now().getValue() + " AMAME");
            preview(email.getKey(), html);
        }
        assertThat(emails.get("approbation")).contains("l'<strong>" + FULL_NAME + " (AMAME)</strong>");
    }

    @Test
    void valuesTypedByUsersAreEscaped() {
        emailService.sendAdhesionRequestToAdmin("admin@amame.ml",
                "<a href=\"https://exemple.test\">Cliquez</a>", "N'Diaye", "x@example.com<script>", 3L);
        String admin = sentTo("admin@amame.ml");
        assertThat(admin).doesNotContain("<a href=\"https://exemple.test\">", "<script>");
        assertThat(admin).contains("&lt;a href=&quot;https://exemple.test&quot;&gt;Cliquez&lt;/a&gt;");
        assertThat(admin).contains("N&#39;Diaye");

        emailService.sendAdhesionRejectionToUser("moussa@example.com", "Moussa", "Keita", "<b>Refus</b>");
        String rejection = sentTo("moussa@example.com");
        assertThat(rejection).doesNotContain("<b>Refus</b>").contains("&lt;b&gt;Refus&lt;/b&gt;");
    }

    @Test
    void accentedNamesAreKeptAsTyped() {
        emailService.sendAdhesionApprovalToUser("a@example.com", "Aïssata", "Koné");
        assertThat(sentTo("a@example.com")).contains("<strong>Aïssata</strong>");
    }

    private String sentTo(String recipient) {
        ArgumentCaptor<String> body = ArgumentCaptor.forClass(String.class);
        verify(self).send(eq(recipient), anyString(), body.capture());
        return body.getValue();
    }

    private static void preview(String name, String html) throws IOException {
        String dir = System.getProperty("email.preview.dir");
        if (dir != null && !dir.isBlank()) {
            Path target = Path.of(dir);
            Files.createDirectories(target);
            Files.writeString(target.resolve(name + ".html"), html, StandardCharsets.UTF_8);
        }
    }
}
