package com.example.siteamame.controller;

import com.example.siteamame.dto.auth.ForgotPasswordRequest;
import com.example.siteamame.dto.auth.ResetPasswordRequest;
import com.example.siteamame.dto.authentification.LoginRequestDto;
import com.example.siteamame.dto.user.UserReponseDto;
import com.example.siteamame.service.AuthentificationService;
import com.example.siteamame.service.PasswordResetService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@AllArgsConstructor
@RestController
@RequestMapping("/api")
public class AuthController {
    private final AuthentificationService user;
    private final PasswordResetService passwordResetService;

    @Transactional
    @PostMapping("/auth/login")
    public ResponseEntity<UserReponseDto> loginUser(@Valid @RequestBody LoginRequestDto loginReq, HttpServletResponse res) {
        return new ResponseEntity<>(user.login(loginReq, res), HttpStatus.OK);
    }

    @Transactional
    @GetMapping("/auth/me")
    public ResponseEntity<UserReponseDto> getUserProfil(Authentication authentication) {
        return new ResponseEntity<>(user.getCurrentUser(authentication), HttpStatus.OK);
    }
    
    /**
     * Endpoint public — lit le cookie refresh_token, valide, rotate,
     * génère un nouvel access_token et retourne les infos utilisateur.
     * Appelé par le frontend quand l'access token expire (401).
     */
    @Transactional
    @PostMapping("/auth/refresh")
    public ResponseEntity<UserReponseDto> refreshToken(HttpServletRequest req, HttpServletResponse res) {
        return ResponseEntity.ok(user.refresh(req, res));
    }

    @PostMapping("/auth/logout")
    public ResponseEntity<String> logoutUser(HttpServletRequest req, HttpServletResponse res) {
        return new ResponseEntity<>(user.logout(req, res), HttpStatus.OK);
    }

    // ── Mot de passe oublié ─────────────────────────────────────────────────

    @PostMapping("/visitor/auth/forgot-password")
    public ResponseEntity<Void> forgotPassword(@RequestBody @Valid ForgotPasswordRequest request) {
        passwordResetService.requestPasswordReset(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/visitor/auth/reset-password")
    public ResponseEntity<Void> resetPassword(@RequestBody @Valid ResetPasswordRequest request) {
        passwordResetService.resetPassword(request);
        return ResponseEntity.ok().build();
    }
}
