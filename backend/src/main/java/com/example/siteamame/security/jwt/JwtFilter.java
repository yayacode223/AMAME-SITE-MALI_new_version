package com.example.siteamame.security.jwt;

import com.example.siteamame.security.CustomUserDetails;
import com.example.siteamame.service.user.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@AllArgsConstructor
@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService customUserDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getServletPath();

        // Routes publiques — pas de vérification du token
        if (path.equals("/api/auth/login")
                || path.equals("/api/auth/logout")
                || path.equals("/api/auth/refresh")
                || path.startsWith("/api/visitor/")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Toutes les autres routes : vérification de l'access token
        String token = extractAccessToken(request);

        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            // extractUsernameSafely évite les ExpiredJwtException non catchées (évite 500)
            Optional<String> usernameOpt = jwtUtil.extractUsernameSafely(token);

            if (usernameOpt.isPresent()) {
                String username = usernameOpt.get();
                if (jwtUtil.validateToken(token, username)) {
                    CustomUserDetails userDetails =
                            (CustomUserDetails) customUserDetailsService.loadUserByUsername(username);

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
                // Token expiré ou invalide → pas d'auth → Spring Security renverra 401
                // Le frontend interceptera ce 401 et tentera le refresh
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Lit l'access token depuis :
     * 1. Cookie "access_token" (HttpOnly, prioritaire)
     * 2. Header "Authorization: Bearer <token>" (fallback pour clients non-navigateur)
     */
    private String extractAccessToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("access_token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
