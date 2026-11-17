package com.example.siteamame.service;

import com.example.siteamame.model.RefreshToken;
import com.example.siteamame.repository.RefreshTokenRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Un navigateur peut envoyer plusieurs cookies refresh_token, le plus ancien d'abord (écart E50
 * du suivi de migration) : le renouvellement retient le premier jeton utilisable.
 */
@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private RefreshTokenService refreshTokenService;

    @Test
    void skipsARevokedTokenAndKeepsTheNextUsableOne() {
        when(refreshTokenRepository.findByToken("ancien")).thenReturn(Optional.of(token("ancien", true, 1)));
        RefreshToken current = token("actuel", false, 1);
        when(refreshTokenRepository.findByToken("actuel")).thenReturn(Optional.of(current));

        assertThat(refreshTokenService.validateFirstUsable(List.of("ancien", "actuel"))).isSameAs(current);
    }

    @Test
    void skipsUnknownAndExpiredTokens() {
        when(refreshTokenRepository.findByToken("inconnu")).thenReturn(Optional.empty());
        when(refreshTokenRepository.findByToken("expire")).thenReturn(Optional.of(token("expire", false, -1)));
        RefreshToken current = token("actuel", false, 1);
        when(refreshTokenRepository.findByToken("actuel")).thenReturn(Optional.of(current));

        assertThat(refreshTokenService.validateFirstUsable(List.of("inconnu", "expire", "actuel"))).isSameAs(current);
    }

    @Test
    void keepsTheFirstTokenWhenItIsUsable() {
        RefreshToken first = token("premier", false, 1);
        when(refreshTokenRepository.findByToken("premier")).thenReturn(Optional.of(first));

        // Le second n'est même pas lu
        assertThat(refreshTokenService.validateFirstUsable(List.of("premier", "second"))).isSameAs(first);
    }

    @Test
    void refusesWithTheReasonOfTheFirstRefusalWhenNoTokenIsUsable() {
        when(refreshTokenRepository.findByToken("revoque")).thenReturn(Optional.of(token("revoque", true, 1)));
        when(refreshTokenRepository.findByToken("inconnu")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> refreshTokenService.validateFirstUsable(List.of("revoque", "inconnu")))
                .isInstanceOfSatisfying(ResponseStatusException.class, refusal -> {
                    assertThat(refusal.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
                    assertThat(refusal.getReason()).isEqualTo("Refresh token révoqué");
                });
    }

    @Test
    void refusesAnEmptyList() {
        assertThatThrownBy(() -> refreshTokenService.validateFirstUsable(List.of()))
                .isInstanceOfSatisfying(ResponseStatusException.class, refusal -> {
                    assertThat(refusal.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
                    assertThat(refusal.getReason()).isEqualTo("Refresh token absent");
                });
        verifyNoInteractions(refreshTokenRepository);
    }

    private static RefreshToken token(String value, boolean revoked, int daysToExpiry) {
        RefreshToken token = new RefreshToken();
        token.setToken(value);
        token.setRevoked(revoked);
        token.setExpiryDate(LocalDateTime.now().plusDays(daysToExpiry));
        return token;
    }
}
