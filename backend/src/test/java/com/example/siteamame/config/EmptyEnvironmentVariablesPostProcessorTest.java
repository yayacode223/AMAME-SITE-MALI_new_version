package com.example.siteamame.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.context.properties.bind.BindException;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.origin.OriginLookup;
import org.springframework.boot.origin.SystemEnvironmentOrigin;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.PropertySource;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.env.SystemEnvironmentPropertySource;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Supplier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.core.env.StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME;

/**
 * Variables d'environnement vides, comme les transmet une stack sans valeurs par défaut
 * (écarts E49 et E51 du suivi de migration).
 */
class EmptyEnvironmentVariablesPostProcessorTest {

    /** Extrait d'application.properties : les placeholders tels qu'ils y sont écrits. */
    private static final Map<String, Object> APPLICATION = Map.of(
            "app.storage.purge.enabled", "${STORAGE_PURGE_ENABLED:false}",
            "app.storage.purge.retention", "${STORAGE_PURGE_RETENTION:10d}",
            "app.storage.purge.schedule", "${STORAGE_PURGE_SCHEDULE:0 30 2 * * *}",
            "spring.datasource.hikari.minimum-idle", "${DB_POOL_MIN_IDLE:0}",
            "cookie.domain", "${COOKIE_DOMAIN:}");

    private static final Map<String, Object> PRODUCTION_SHAPED = Map.of(
            "STORAGE_PURGE_ENABLED", "",
            "STORAGE_PURGE_RETENTION", "",
            "STORAGE_PURGE_SCHEDULE", "",
            "DB_POOL_MIN_IDLE", "",
            "COOKIE_DOMAIN", "",
            "MAIL_HOST", "smtp.example.org");

    @Test
    void withoutTheProcessorAnEmptyVariableBreaksTheBinding() {
        StandardEnvironment environment = environment(PRODUCTION_SHAPED);

        assertThatThrownBy(() -> storage(environment)).isInstanceOf(BindException.class);
    }

    @Test
    void emptyVariablesFallBackToTheDefaultValues() {
        StandardEnvironment environment = environment(PRODUCTION_SHAPED);

        process(environment);

        StorageProperties.Purge purge = storage(environment).purge();
        assertThat(purge.enabled()).isFalse();
        assertThat(purge.retention()).isEqualTo(Duration.ofDays(10));
        assertThat(purge.schedule()).isEqualTo("0 30 2 * * *");
        assertThat(environment.getProperty("spring.datasource.hikari.minimum-idle", Integer.class)).isZero();
        assertThat(environment.getProperty("cookie.domain")).isEmpty();
        assertThat(environment.containsProperty("STORAGE_PURGE_ENABLED")).isFalse();
    }

    @Test
    void nonEmptyVariablesAreKeptWithTheirOrigin() {
        Map<String, Object> variables = new HashMap<>(PRODUCTION_SHAPED);
        variables.put("STORAGE_PURGE_ENABLED", "true");
        variables.put("STORAGE_PURGE_RETENTION", "31");
        StandardEnvironment environment = environment(variables);

        process(environment);

        StorageProperties.Purge purge = storage(environment).purge();
        assertThat(purge.enabled()).isTrue();
        assertThat(purge.retention()).isEqualTo(Duration.ofDays(31));
        assertThat(environment.getProperty("MAIL_HOST")).isEqualTo("smtp.example.org");
        // Liaison souple conservée : MAIL_HOST se lit aussi sous le nom mail.host.
        assertThat(Binder.get(environment).bind("mail.host", String.class).get()).isEqualTo("smtp.example.org");
        PropertySource<?> source = environment.getPropertySources().get(SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME);
        assertThat(source).isInstanceOf(SystemEnvironmentPropertySource.class);
        @SuppressWarnings("unchecked")
        OriginLookup<String> origins = (OriginLookup<String>) source;
        assertThat(origins.getOrigin("MAIL_HOST")).isInstanceOf(SystemEnvironmentOrigin.class);
        assertThat(origins.getOrigin("STORAGE_PURGE_SCHEDULE")).isNull();
    }

    @Test
    void aValueMadeOfSpacesCountsAsEmpty() {
        StandardEnvironment environment = environment(Map.of("STORAGE_PURGE_ENABLED", "  "));

        process(environment);

        assertThat(storage(environment).purge().enabled()).isFalse();
    }

    @Test
    void withoutEmptyVariablesTheSourceIsLeftAsIs() {
        StandardEnvironment environment = environment(Map.of("MAIL_HOST", "smtp.example.org"));
        PropertySource<?> before = environment.getPropertySources().get(SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME);

        process(environment);

        assertThat(environment.getPropertySources().get(SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME)).isSameAs(before);
    }

    private static StandardEnvironment environment(Map<String, Object> variables) {
        StandardEnvironment environment = new StandardEnvironment();
        environment.getPropertySources().replace(SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME,
                new SystemEnvironmentPropertySource(SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME, new HashMap<>(variables)));
        environment.getPropertySources().addLast(new MapPropertySource("application", APPLICATION));
        return environment;
    }

    private static void process(StandardEnvironment environment) {
        new EmptyEnvironmentVariablesPostProcessor(Supplier::get)
                .postProcessEnvironment(environment, new SpringApplication());
    }

    private static StorageProperties storage(StandardEnvironment environment) {
        return Binder.get(environment).bindOrCreate("app.storage", StorageProperties.class);
    }
}
