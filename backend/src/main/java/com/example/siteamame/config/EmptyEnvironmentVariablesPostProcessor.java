package com.example.siteamame.config;

import org.apache.commons.logging.Log;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.context.config.ConfigDataEnvironmentPostProcessor;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.boot.logging.DeferredLogFactory;
import org.springframework.boot.origin.Origin;
import org.springframework.boot.origin.OriginLookup;
import org.springframework.boot.origin.SystemEnvironmentOrigin;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.PropertySource;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.env.SystemEnvironmentPropertySource;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Une variable d'environnement définie mais vide est traitée comme absente : la valeur par défaut
 * de la configuration s'applique ({@code ${DB_POOL_MIN_IDLE:0}} donne {@code 0}).
 *
 * <p>Sans cela, Spring garde la chaîne vide, qui ne se convertit ni en nombre, ni en booléen, ni en
 * durée, ni en expression cron : le backend refuse de démarrer. Une stack Portainer écrite en
 * {@code - VAR=${VAR}}, sans valeur par défaut, transmet VIDE toute variable absente de ses
 * variables : {@code backend-v1.2} a ainsi refusé de démarrer en production le 16 novembre 2026
 * ({@code DB_POOL_MIN_IDLE}, écart E49), et {@code backend-v1.3} aurait fait de même avec
 * {@code STORAGE_PURGE_ENABLED} (essai du 17 novembre, écart E51).
 *
 * <p>Aucune variable lue par l'application ne donne à « vide » un autre sens qu'« absente » : une
 * valeur par défaut vide ({@code ${COOKIE_DOMAIN:}}) reste vide, et une variable sans valeur par
 * défaut ({@code ${JWT_SECRET}}) fait échouer le démarrage par un message explicite au lieu de
 * démarrer avec un secret vide. Une valeur faite seulement d'espaces compte comme vide.
 *
 * <p>Passe après la mise en place de la source des variables d'environnement par Spring Boot et
 * avant la lecture des fichiers de configuration et des profils. Enregistré dans
 * {@code META-INF/spring.factories}.
 */
public class EmptyEnvironmentVariablesPostProcessor implements EnvironmentPostProcessor, Ordered {

    static final int ORDER = ConfigDataEnvironmentPostProcessor.ORDER - 1;

    private static final String SOURCE_NAME = StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME;

    private final Log log;

    public EmptyEnvironmentVariablesPostProcessor(DeferredLogFactory logFactory) {
        this.log = logFactory.getLog(EmptyEnvironmentVariablesPostProcessor.class);
    }

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        PropertySource<?> current = environment.getPropertySources().get(SOURCE_NAME);
        if (!(current instanceof SystemEnvironmentPropertySource systemEnvironment)) {
            return;
        }
        Map<String, Object> kept = new LinkedHashMap<>();
        List<String> ignored = systemEnvironment.getSource().entrySet().stream()
                .filter(entry -> {
                    boolean empty = entry.getValue() instanceof String value && value.isBlank();
                    if (!empty) {
                        kept.put(entry.getKey(), entry.getValue());
                    }
                    return empty;
                })
                .map(Map.Entry::getKey)
                .sorted()
                .toList();
        if (ignored.isEmpty()) {
            return;
        }
        environment.getPropertySources().replace(SOURCE_NAME, new NonEmptySystemEnvironmentPropertySource(kept));
        // Les noms seulement : une valeur vide ne révèle rien, mais la règle reste la même partout.
        log.info("Variables d'environnement vides, traitées comme absentes : " + String.join(", ", ignored));
    }

    @Override
    public int getOrder() {
        return ORDER;
    }

    /** Variables d'environnement non vides, avec la même résolution des noms et la même origine. */
    static final class NonEmptySystemEnvironmentPropertySource extends SystemEnvironmentPropertySource
            implements OriginLookup<String> {

        NonEmptySystemEnvironmentPropertySource(Map<String, Object> source) {
            super(SOURCE_NAME, source);
        }

        @Override
        public Origin getOrigin(String key) {
            String property = resolvePropertyName(key);
            return super.containsProperty(property) ? new SystemEnvironmentOrigin(property) : null;
        }
    }
}
