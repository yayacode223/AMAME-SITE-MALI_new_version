package com.example.siteamame.service;

import com.example.siteamame.dto.auth.ForgotPasswordRequest;
import com.example.siteamame.dto.auth.ResetPasswordRequest;
import com.example.siteamame.model.PasswordResetToken;
import com.example.siteamame.model.User;
import com.example.siteamame.repository.PasswordResetTokenRepository;
import com.example.siteamame.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    private static final int TOKEN_VALIDITY_HOURS = 1;

    // ── Demande de réinitialisation ──────────────────────────────────────────

    @Transactional
    public void requestPasswordReset(ForgotPasswordRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Aucun compte n'est associé à cette adresse email."));

        // Invalider les tokens existants de cet utilisateur avant d'en créer un nouveau
        tokenRepository.deleteAllByUserId(user.getId());

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(UUID.randomUUID().toString());
        resetToken.setUser(user);
        resetToken.setExpiresAt(LocalDateTime.now().plusHours(TOKEN_VALIDITY_HOURS));
        resetToken.setUsed(false);
        tokenRepository.save(resetToken);

        emailService.sendPasswordResetEmail(
                user.getEmail(),
                user.getPrenom(),
                user.getNom(),
                resetToken.getToken()
        );

        log.info("Demande de réinitialisation envoyée à {}", user.getEmail());
    }

    // ── Réinitialisation du mot de passe ─────────────────────────────────────

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = tokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Lien de réinitialisation invalide."));

        if (resetToken.isUsed()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ce lien a déjà été utilisé. Veuillez soumettre une nouvelle demande.");
        }

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ce lien a expiré (validité 1 heure). Veuillez soumettre une nouvelle demande.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        log.info("Mot de passe réinitialisé pour {}", user.getEmail());
    }
}
