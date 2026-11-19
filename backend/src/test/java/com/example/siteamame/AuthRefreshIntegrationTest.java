package com.example.siteamame;

import com.example.siteamame.dto.user.UserRequestDto;
import com.example.siteamame.service.user.UserService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.io.IOException;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Renouvellement de session quand le navigateur envoie deux cookies refresh_token, le périmé
 * d'abord (écart E50 du suivi de migration), à travers le contrôleur et ses transactions réelles :
 * le refus du premier jeton, rattrapé, ne doit pas faire échouer la transaction du renouvellement.
 * Docker est requis.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class AuthRefreshIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>(System.getProperty("test.postgres.image", "postgres:18-alpine"));

    @Autowired private MockMvc mockMvc;
    @Autowired private UserService userService;
    @Autowired private JdbcTemplate jdbc;

    @Test
    void aRevokedRefreshCookieSentFirstNoLongerEndsTheSession() throws Exception {
        String email = "session-" + UUID.randomUUID() + "@test.local";
        register(email);

        MvcResult login = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"secret-de-test\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String first = refreshCookieOf(login);

        // Premier renouvellement : le jeton est remplacé, l'ancien révoqué
        MvcResult rotated = mockMvc.perform(post("/api/auth/refresh").cookie(new Cookie("refresh_token", first)))
                .andExpect(status().isOk())
                .andReturn();
        String second = refreshCookieOf(rotated);
        assertThat(second).isNotEqualTo(first);
        assertThat(revoked(first)).isTrue();

        // Le navigateur envoie l'ancien cookie (révoqué) avant l'actuel : la session continue
        MvcResult renewed = mockMvc.perform(post("/api/auth/refresh")
                        .cookie(new Cookie("refresh_token", first), new Cookie("refresh_token", second)))
                .andExpect(status().isOk())
                .andReturn();
        String third = refreshCookieOf(renewed);
        assertThat(third).isNotIn(first, second);
        assertThat(revoked(second)).isTrue();
        assertThat(revoked(third)).isFalse();

        // Seul le jeton révoqué : refus, comme avant
        mockMvc.perform(post("/api/auth/refresh").cookie(new Cookie("refresh_token", first)))
                .andExpect(status().isUnauthorized());

        // La déconnexion révoque tous les jetons reçus
        mockMvc.perform(post("/api/auth/logout")
                        .cookie(new Cookie("refresh_token", first), new Cookie("refresh_token", third)))
                .andExpect(status().isOk());
        assertThat(revoked(third)).isTrue();
    }

    private void register(String email) throws IOException {
        UserRequestDto request = new UserRequestDto();
        request.setNom("Session");
        request.setPrenom("Compte");
        request.setEmail(email);
        request.setPassword("secret-de-test");
        userService.register(request, null, null);
    }

    private static String refreshCookieOf(MvcResult result) {
        return result.getResponse().getHeaders("Set-Cookie").stream()
                .filter(header -> header.startsWith("refresh_token="))
                .map(header -> header.substring("refresh_token=".length(), header.indexOf(';')))
                .filter(value -> !value.isEmpty())
                .findFirst()
                .orElseThrow(() -> new AssertionError("aucun cookie refresh_token posé"));
    }

    private boolean revoked(String token) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
                "select revoked from refresh_token where token = ?", Boolean.class, token));
    }
}
