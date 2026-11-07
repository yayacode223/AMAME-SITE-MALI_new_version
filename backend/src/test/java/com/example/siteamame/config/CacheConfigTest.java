package com.example.siteamame.config;

import com.example.siteamame.security.CustomUserDetails;
import com.example.siteamame.service.AdhesionService;
import com.example.siteamame.service.MembreService;
import com.example.siteamame.service.PasswordResetService;
import com.example.siteamame.service.PermissionService;
import com.example.siteamame.service.user.CustomUserDetailsService;
import com.example.siteamame.service.user.RequestUserLoader;
import com.example.siteamame.service.user.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.convert.ApplicationConversionService;
import org.springframework.boot.test.util.TestPropertyValues;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionSynchronizationUtils;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Les deux caches qui épargnent la base : utilisateur du filtre JWT, listes publiques. */
class CacheConfigTest {

    private AnnotationConfigApplicationContext context;

    @AfterEach
    void close() {
        if (context != null) {
            context.close();
        }
    }

    // ── Listes publiques ────────────────────────────────────────────────────

    @Test
    void publicListsAreNotCachedByDefault() {
        PublicEndpoints endpoints = start("0").getBean(PublicEndpoints.class);

        endpoints.articles(0, "DESC");
        endpoints.articles(0, "DESC");

        assertThat(endpoints.calls()).isEqualTo(2);
    }

    @Test
    void onceEnabledAnIdenticalRequestIsServedWithoutCallingTheEndpoint() {
        PublicEndpoints endpoints = start("10m").getBean(PublicEndpoints.class);

        ResponseEntity<List<String>> first = endpoints.articles(0, "DESC");
        ResponseEntity<List<String>> second = endpoints.articles(0, "DESC");

        assertThat(endpoints.calls()).isEqualTo(1);
        assertThat(second.getBody()).isEqualTo(first.getBody());
    }

    @Test
    void theKeyCoversTheEndpointAndEveryArgument() {
        PublicEndpoints endpoints = start("10m").getBean(PublicEndpoints.class);

        endpoints.articles(0, "DESC");
        endpoints.articles(1, "DESC");
        endpoints.articles(0, "ASC");
        // Mêmes arguments, autre endpoint : ne doit pas recevoir la réponse des articles
        ResponseEntity<List<String>> bourses = endpoints.bourses(0, "DESC");

        assertThat(endpoints.calls()).isEqualTo(4);
        assertThat(bourses.getBody()).containsExactly("bourses-0-DESC");
    }

    @Test
    void anErrorResponseIsNeverCached() {
        PublicEndpoints endpoints = start("10m").getBean(PublicEndpoints.class);

        endpoints.failing();
        endpoints.failing();

        assertThat(endpoints.calls()).isEqualTo(2);
    }

    @Test
    void anAdministratorWriteEmptiesThePublicListsButAReadDoesNot() {
        start("10m");
        PublicEndpoints endpoints = context.getBean(PublicEndpoints.class);
        PublicListCacheInvalidator invalidator = new PublicListCacheInvalidator(context.getBean(CacheManager.class));

        endpoints.articles(0, "DESC");
        invalidator.afterCompletion(new MockHttpServletRequest("GET", "/api/admin/articles"),
                new MockHttpServletResponse(), new Object(), null);
        endpoints.articles(0, "DESC");
        assertThat(endpoints.calls()).isEqualTo(1);

        invalidator.afterCompletion(new MockHttpServletRequest("PUT", "/api/admin/articles/1"),
                new MockHttpServletResponse(), new Object(), null);
        endpoints.articles(0, "DESC");
        assertThat(endpoints.calls()).isEqualTo(2);
    }

    // ── Utilisateur du filtre JWT ───────────────────────────────────────────

    @Test
    void theRequestUserIsLoadedOnceWhateverTheCaseOfTheEmail() {
        start("0");
        RequestUserLoader loader = context.getBean(RequestUserLoader.class);
        CustomUserDetailsService delegate = context.getBean(CustomUserDetailsService.class);

        CustomUserDetails first = loader.load("Admin@amame.ml");
        CustomUserDetails second = loader.load("admin@AMAME.ml");

        assertThat(second).isSameAs(first);
        verify(delegate, times(1)).loadUserByUsername(anyString());
    }

    @Test
    void emptyingTheRequestUserCacheForcesAReload() {
        start("0");
        RequestUserLoader loader = context.getBean(RequestUserLoader.class);
        CustomUserDetailsService delegate = context.getBean(CustomUserDetailsService.class);

        loader.load("admin@amame.ml");
        context.getBean(CacheManager.class).getCache(CacheConfig.REQUEST_USER).clear();
        loader.load("admin@amame.ml");

        verify(delegate, times(2)).loadUserByUsername(anyString());
    }

    @Test
    void insideATransactionTheCacheIsOnlyEmptiedAfterTheCommit() {
        start("0");
        RequestUserLoader loader = context.getBean(RequestUserLoader.class);
        CustomUserDetailsService delegate = context.getBean(CustomUserDetailsService.class);
        Cache cache = context.getBean(CacheManager.class).getCache(CacheConfig.REQUEST_USER);
        loader.load("admin@amame.ml");

        TransactionSynchronizationManager.initSynchronization();
        try {
            cache.clear();
            // La modification n'est pas encore validée : l'ancienne valeur reste servie
            loader.load("admin@amame.ml");
            verify(delegate, times(1)).loadUserByUsername(anyString());

            TransactionSynchronizationUtils.triggerAfterCommit();
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }

        loader.load("admin@amame.ml");
        verify(delegate, times(2)).loadUserByUsername(anyString());
    }

    @Test
    void everyMethodThatChangesWhatTheJwtFilterReliesOnEmptiesTheRequestUserCache() {
        Map<Class<?>, List<String>> expected = Map.of(
                PermissionService.class, List.of("grantPermission", "revokePermission", "removeOverride", "changeRole"),
                AdhesionService.class, List.of("approveAdhesion", "rejectAdhesion"),
                MembreService.class, List.of("changePassword"),
                PasswordResetService.class, List.of("resetPassword"),
                UserService.class, List.of("update", "deleteUser"));

        expected.forEach((type, methods) -> methods.forEach(name -> {
            Method method = Arrays.stream(type.getDeclaredMethods())
                    .filter(m -> m.getName().equals(name))
                    .findFirst()
                    .orElseThrow(() -> new AssertionError(type.getSimpleName() + "." + name + " introuvable"));
            CacheEvict evict = method.getAnnotation(CacheEvict.class);
            assertThat(evict).as("%s.%s doit vider le cache", type.getSimpleName(), name).isNotNull();
            assertThat(evict.cacheNames()).containsExactly(CacheConfig.REQUEST_USER);
            assertThat(evict.allEntries()).isTrue();
        }));
    }

    private AnnotationConfigApplicationContext start(String publicListsTtl) {
        context = new AnnotationConfigApplicationContext();
        TestPropertyValues.of("app.cache.public-lists.ttl=" + publicListsTtl).applyTo(context);
        // Comme dans l'application : les durées s'écrivent « 10m », « 1h »…
        context.getBeanFactory().setConversionService(ApplicationConversionService.getSharedInstance());
        context.register(CacheConfig.class, TestBeans.class);
        context.refresh();
        return context;
    }

    @Configuration
    static class TestBeans {
        @Bean
        PublicEndpoints publicEndpoints() {
            return new PublicEndpoints();
        }

        @Bean
        CustomUserDetailsService customUserDetailsService() {
            CustomUserDetailsService delegate = mock(CustomUserDetailsService.class);
            when(delegate.loadUserByUsername(anyString())).thenAnswer(call -> mock(CustomUserDetails.class));
            return delegate;
        }

        @Bean
        RequestUserLoader requestUserLoader(CustomUserDetailsService delegate) {
            return new RequestUserLoader(delegate);
        }
    }

    /** Stand-in d'un contrôleur public : même forme de méthode que les vrais endpoints. */
    static class PublicEndpoints {
        private final AtomicInteger calls = new AtomicInteger();

        /** À lire par cette méthode : un champ lu à travers le proxy du cache serait vide. */
        public int calls() {
            return calls.get();
        }

        @PublicListCache
        public ResponseEntity<List<String>> articles(int page, String sortDirection) {
            calls.incrementAndGet();
            return ResponseEntity.ok(List.of("articles-" + page + "-" + sortDirection));
        }

        @PublicListCache
        public ResponseEntity<List<String>> bourses(int page, String sortDirection) {
            calls.incrementAndGet();
            return ResponseEntity.ok(List.of("bourses-" + page + "-" + sortDirection));
        }

        @PublicListCache
        public ResponseEntity<String> failing() {
            calls.incrementAndGet();
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body("indisponible");
        }
    }
}
