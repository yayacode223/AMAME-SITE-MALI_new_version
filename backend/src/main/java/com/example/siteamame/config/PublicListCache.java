package com.example.siteamame.config;

import org.springframework.cache.annotation.Cacheable;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marque un endpoint public qui renvoie une liste (GET /api/visitor/…). Quand le cache des
 * listes publiques est actif (PUBLIC_LISTS_CACHE_TTL), la réponse est réutilisée sans interroger
 * la base ; le cache est vidé à chaque modification par un administrateur
 * ({@link PublicListCacheInvalidator}). Sans effet tant que le cache est désactivé.
 *
 * À ne pas poser sur un endpoint qui écrit en base (compteur de vues) ni sur une réponse
 * qui dépend de l'utilisateur connecté.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Cacheable(cacheNames = CacheConfig.PUBLIC_LISTS, keyGenerator = CacheConfig.PUBLIC_LIST_KEY_GENERATOR,
        unless = "#result == null || !#result.statusCode.is2xxSuccessful()")
public @interface PublicListCache {
}
