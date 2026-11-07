package com.example.siteamame.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Set;

/**
 * Vide le cache des listes publiques après toute modification faite par un administrateur.
 * Un seul point de vidage, branché sur /api/admin/** : un nouvel endpoint d'administration
 * est couvert sans rien avoir à annoter.
 */
@Component
@RequiredArgsConstructor
public class PublicListCacheInvalidator implements HandlerInterceptor, WebMvcConfigurer {

    private static final Set<String> READ_METHODS = Set.of("GET", "HEAD", "OPTIONS");

    private final CacheManager cacheManager;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(this).addPathPatterns("/api/admin/**");
    }

    /** Appelé une fois le traitement terminé, donc après le commit de la transaction du contrôleur. */
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        if (READ_METHODS.contains(request.getMethod())) return;
        Cache publicLists = cacheManager.getCache(CacheConfig.PUBLIC_LISTS);
        if (publicLists != null) {
            publicLists.clear();
        }
    }
}
