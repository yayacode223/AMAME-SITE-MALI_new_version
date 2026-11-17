package com.example.siteamame.service;

import com.example.siteamame.model.RefreshToken;
import com.example.siteamame.model.User;
import com.example.siteamame.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpirationMs;

    /**
     * Crée un refresh token pour un utilisateur et le persiste en DB.
     */
    @Transactional
    public RefreshToken createRefreshToken(User user) {
        RefreshToken token = new RefreshToken();
        token.setToken(UUID.randomUUID().toString());
        token.setUser(user);
        token.setExpiryDate(LocalDateTime.now().plusSeconds(refreshExpirationMs / 1000));
        token.setRevoked(false);
        token.setCreatedAt(LocalDateTime.now());
        return refreshTokenRepository.save(token);
    }

    /**
     * Valide un refresh token : présence en DB, non révoqué, non expiré.
     * Lance une 401 si invalide.
     */
    @Transactional(readOnly = true)
    public RefreshToken validateRefreshToken(String tokenValue) {
        RefreshToken token = refreshTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Refresh token invalide"));

        if (token.isRevoked()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token révoqué");
        }

        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token expiré");
        }

        return token;
    }

    /**
     * Premier jeton utilisable parmi ceux que le navigateur a envoyés, dans l'ordre reçu.
     *
     * Un navigateur peut garder plusieurs cookies refresh_token : même nom, mais un domaine
     * différent, après un changement de COOKIE_DOMAIN (écart E50 du suivi de migration). Il
     * envoie d'abord le plus ancien, souvent périmé. Ne lire que le premier coupait la session
     * à chaque renouvellement. Lance une 401 si aucun n'est utilisable, avec le motif du premier refus.
     */
    @Transactional(readOnly = true)
    public RefreshToken validateFirstUsable(List<String> tokenValues) {
        ResponseStatusException firstRefusal = null;
        for (String tokenValue : tokenValues) {
            try {
                // Appel interne, sans passer par le proxy : un refus rattrapé ici ne marque pas
                // pour annulation la transaction du renouvellement.
                return validateRefreshToken(tokenValue);
            } catch (ResponseStatusException refusal) {
                if (firstRefusal == null) {
                    firstRefusal = refusal;
                }
            }
        }
        throw firstRefusal != null
                ? firstRefusal
                : new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token absent");
    }

    /**
     * Rotation : révoque l'ancien token et en crée un nouveau.
     */
    @Transactional
    public RefreshToken rotateRefreshToken(RefreshToken oldToken) {
        oldToken.setRevoked(true);
        refreshTokenRepository.save(oldToken);
        return createRefreshToken(oldToken.getUser());
    }

    /**
     * Révoque un token spécifique (logout).
     */
    @Transactional
    public void revokeByTokenValue(String tokenValue) {
        refreshTokenRepository.findByToken(tokenValue).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });
    }

    /**
     * Nettoyage des tokens expirés et révoqués, une fois par nuit dans la fenêtre commune aux
     * tâches qui touchent la base (02:30 UTC par défaut) : la base n'est réveillée qu'une fois.
     */
    @Scheduled(cron = "${app.auth.refresh-token-cleanup-cron}", zone = "UTC")
    @Transactional
    public void cleanupExpiredTokens() {
        refreshTokenRepository.deleteExpiredAndRevokedTokens(LocalDateTime.now());
    }
}
