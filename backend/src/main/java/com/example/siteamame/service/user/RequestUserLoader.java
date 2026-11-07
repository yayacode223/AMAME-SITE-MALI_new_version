package com.example.siteamame.service.user;

import com.example.siteamame.config.CacheConfig;
import com.example.siteamame.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

/**
 * Chargement de l'utilisateur pour le filtre JWT, mis en cache 60 secondes : sans lui, chaque
 * requête authentifiée interroge deux fois la base (utilisateur, puis permissions).
 *
 * Réservé au filtre JWT. La connexion (login) ne passe jamais par ce cache : un ancien mot de
 * passe ne doit pas rester utilisable. Toute méthode qui change un rôle, des permissions ou un
 * mot de passe, ou qui supprime un utilisateur, vide ce cache
 * ({@code @CacheEvict(cacheNames = CacheConfig.REQUEST_USER, allEntries = true)}).
 */
@Service
@RequiredArgsConstructor
public class RequestUserLoader {

    private final CustomUserDetailsService delegate;

    /** L'utilisateur renvoyé est détaché et partagé entre les requêtes : ne jamais le modifier. */
    @Cacheable(cacheNames = CacheConfig.REQUEST_USER, key = "#root.args[0].toLowerCase(T(java.util.Locale).ROOT)")
    public CustomUserDetails load(String email) {
        return (CustomUserDetails) delegate.loadUserByUsername(email);
    }
}
