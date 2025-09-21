package com.example.siteamame.config;

import com.example.siteamame.security.JwtFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod; // Import nécessaire
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy; // Import pour la gestion de session (si JWT)
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. Activer CORS en utilisant la configuration définie dans le bean corsConfigurationSource()
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // 2. Désactiver CSRF (commun pour les API stateless avec JWT/tokens)
                .csrf(csrf -> csrf.disable())
                // 3. Configurer la gestion de session (important si vous utilisez JWT pour être stateless)
                // Si vous utilisez des cookies HttpOnly pour la session, vous pourriez vouloir une autre politique.
                // Pour JWT, STATELESS est typique.
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**", "/api/user/**").permitAll() // Ajustez "public" si nécessaire pour vos endpoints user non protégés
                        .requestMatchers("/api/health", "/error").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() // Permettre les requêtes OPTIONS pour le preflight CORS
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/editor/**").hasAnyRole("EDITOR", "ADMIN")
                        .anyRequest().authenticated() // Toutes les autres requêtes nécessitent une authentification
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Spécifiez l'origine de votre frontend
        configuration.setAllowedOrigins(List.of("http://localhost", "http://localhost:8081", "http://localhost:8080"));
        // Méthodes HTTP autorisées
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        // En-têtes autorisés
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Cache-Control", "Content-Type", "X-Requested-With"));
        // En-têtes que le navigateur est autorisé à exposer au code JavaScript client
        // configuration.setExposedHeaders(List.of("Authorization")); // Décommentez si vous avez besoin d'exposer des en-têtes spécifiques
        // Autoriser les credentials (cookies, en-têtes d'autorisation)
        // C'est TRÈS IMPORTANT si vous utilisez des cookies HttpOnly ou des tokens via l'en-tête Authorization
        configuration.setAllowCredentials(true);
        // Durée maximale pendant laquelle les résultats d'une requête pre-flight peuvent être mis en cache
        configuration.setMaxAge(3600L); // 1 heure

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Appliquer cette configuration à toutes les routes de votre application
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}