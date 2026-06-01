package com.example.siteamame.service;

import com.example.siteamame.dto.authentification.LoginRequestDto;
import com.example.siteamame.dto.user.UserReponseDto;
import com.example.siteamame.enumeration.Permission;
import com.example.siteamame.mapper.UserMapperDto;
import com.example.siteamame.model.RefreshToken;
import com.example.siteamame.model.User;
import com.example.siteamame.repository.UserRepository;
import com.example.siteamame.security.jwt.JwtUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class AuthentificationService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final UserMapperDto userMapperDto;
    private final RefreshTokenService refreshTokenService;
    private final PermissionService permissionService;

    // ── Constantes cookies ──────────────────────────────────────────────────────

    private static final String ACCESS_COOKIE  = "access_token";
    private static final String REFRESH_COOKIE = "refresh_token";
    private static final int    ACCESS_MAX_AGE  = 15 * 60;          // 15 min
    private static final int    REFRESH_MAX_AGE = 7 * 24 * 60 * 60; // 7 jours

    // ── Propriétés cookie (valeurs selon le profil actif) ───────────────────────
    @Value("${cookie.domain:}")
    private String cookieDomain;

    @Value("${cookie.secure:false}")
    private boolean cookieSecure;

    // ── Login ───────────────────────────────────────────────────────────────────

    public UserReponseDto login(LoginRequestDto loginRequest, HttpServletResponse response) {
        User user = userRepository.findByEmailIgnoreCase(loginRequest.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email ou mot de passe incorrect"));

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email ou mot de passe incorrect");
        }

        String accessToken = jwtUtil.generateToken(user.getEmail(), user.getRole());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        setAccessTokenCookie(response, accessToken);
        setRefreshTokenCookie(response, refreshToken.getToken());

        return withPermissions(userMapperDto.UserToDto(user), user);
    }

    // ── Refresh ─────────────────────────────────────────────────────────────────

    public UserReponseDto refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshTokenValue = extractRefreshTokenFromCookies(request);

        if (refreshTokenValue == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token absent");
        }

        RefreshToken oldToken = refreshTokenService.validateRefreshToken(refreshTokenValue);
        RefreshToken newRefreshToken = refreshTokenService.rotateRefreshToken(oldToken);

        User user = oldToken.getUser();
        String newAccessToken = jwtUtil.generateToken(user.getEmail(), user.getRole());

        setAccessTokenCookie(response, newAccessToken);
        setRefreshTokenCookie(response, newRefreshToken.getToken());

        // NE PAS appeler withPermissions() ici :
        // 1. L'intercepteur Axios ignore le corps de la réponse /auth/refresh
        // 2. Charger les permissions ici peut lever une exception DB et casser le refresh
        // Les permissions sont rechargées proprement par /auth/me après le refresh.
        return userMapperDto.UserToDto(user);
    }

    // ── Get current user ────────────────────────────────────────────────────────

    public UserReponseDto getCurrentUser(Authentication authentication) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
        return withPermissions(userMapperDto.UserToDto(user), user);
    }

    // ── Logout ──────────────────────────────────────────────────────────────────

    public String logout(HttpServletRequest request, HttpServletResponse response) {
        String refreshTokenValue = extractRefreshTokenFromCookies(request);
        if (refreshTokenValue != null) {
            refreshTokenService.revokeByTokenValue(refreshTokenValue);
        }

        clearCookie(response, ACCESS_COOKIE, "/");
        clearCookie(response, REFRESH_COOKIE, "/api/auth");

        return "Déconnexion réussie";
    }

    // ── Helper : enrichit le DTO avec les permissions effectives ────────────────

    private UserReponseDto withPermissions(UserReponseDto dto, User user) {
        dto.setPermissions(
                permissionService.getEffectivePermissions(user)
                        .stream()
                        .map(Permission::name)
                        .collect(Collectors.toSet())
        );
        return dto;
    }

    // ── Helpers cookies ─────────────────────────────────────────────────────────

    private void setAccessTokenCookie(HttpServletResponse response, String token) {
        response.addHeader("Set-Cookie", buildCookie(ACCESS_COOKIE, token, "/", ACCESS_MAX_AGE).toString());
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String token) {
        response.addHeader("Set-Cookie", buildCookie(REFRESH_COOKIE, token, "/api/auth", REFRESH_MAX_AGE).toString());
    }

    private void clearCookie(HttpServletResponse response, String name, String path) {
        response.addHeader("Set-Cookie", buildCookie(name, "", path, 0).toString());
    }

    private ResponseCookie buildCookie(String name, String value, String path, int maxAge) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(cookieSecure)
                .path(path)
                .maxAge(maxAge)
                .sameSite("Strict");
        if (cookieDomain != null && !cookieDomain.isBlank()) {
            builder = builder.domain(cookieDomain);
        }
        return builder.build();
    }

    private String extractRefreshTokenFromCookies(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie cookie : cookies) {
            if (REFRESH_COOKIE.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
