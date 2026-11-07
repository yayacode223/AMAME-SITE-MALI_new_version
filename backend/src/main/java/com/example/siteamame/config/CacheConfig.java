package com.example.siteamame.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.interceptor.KeyGenerator;
import org.springframework.cache.interceptor.SimpleKey;
import org.springframework.cache.support.NoOpCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.cache.transaction.TransactionAwareCacheManagerProxy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

import java.time.Duration;
import java.util.List;

/**
 * Deux caches en mémoire, tous deux destinés à épargner la base :
 * <ul>
 *   <li>{@link #REQUEST_USER} : l'utilisateur chargé par le filtre JWT à chaque requête authentifiée ;</li>
 *   <li>{@link #PUBLIC_LISTS} : les listes publiques, désactivé tant que PUBLIC_LISTS_CACHE_TTL vaut 0.</li>
 * </ul>
 * Leur efficacité se lit dans /actuator/metrics/cache.gets (succès et échecs par cache).
 *
 * Ordre des aspects : le cache passe juste avant la transaction. Une réponse trouvée dans le
 * cache n'ouvre donc aucune transaction (une transaction en lecture seule emprunte une connexion
 * dès son ouverture), tandis que les contrôles d'accès (@PreAuthorize) s'exécutent toujours avant.
 */
@Configuration
@EnableCaching(order = Ordered.LOWEST_PRECEDENCE - 1)
public class CacheConfig {

    public static final String REQUEST_USER = "requestUser";
    public static final String PUBLIC_LISTS = "publicLists";
    public static final String PUBLIC_LIST_KEY_GENERATOR = "publicListKeyGenerator";

    /** Délai maximal avant qu'un changement de rôle non signalé au cache soit pris en compte. */
    private static final Duration REQUEST_USER_TTL = Duration.ofSeconds(60);

    private static final Logger log = LoggerFactory.getLogger(CacheConfig.class);

    @Bean
    public CacheManager cacheManager(@Value("${app.cache.public-lists.ttl}") Duration publicListsTtl) {
        Cache requestUser = new CaffeineCache(REQUEST_USER,
                Caffeine.newBuilder().maximumSize(1000).expireAfterWrite(REQUEST_USER_TTL).recordStats().build());

        boolean publicListsEnabled = !publicListsTtl.isZero() && !publicListsTtl.isNegative();
        Cache publicLists = publicListsEnabled
                ? new CaffeineCache(PUBLIC_LISTS,
                        Caffeine.newBuilder().maximumSize(500).expireAfterWrite(publicListsTtl).recordStats().build())
                : new NoOpCache(PUBLIC_LISTS);
        log.info("Cache des listes publiques : {}", publicListsEnabled ? "actif, durée " + publicListsTtl : "désactivé");

        SimpleCacheManager caches = new SimpleCacheManager();
        caches.setCaches(List.of(requestUser, publicLists));
        caches.initializeCaches();
        // Dans une transaction, un vidage n'est appliqué qu'après le commit : sinon une requête
        // concurrente pourrait remettre en cache la valeur d'avant la modification.
        return new TransactionAwareCacheManagerProxy(caches);
    }

    /** Clé d'une liste publique : la méthode appelée et ses arguments (page, tri, filtres). */
    @Bean(PUBLIC_LIST_KEY_GENERATOR)
    public KeyGenerator publicListKeyGenerator() {
        return (target, method, params) ->
                new SimpleKey(method.getDeclaringClass().getName(), method.getName(), params);
    }
}
