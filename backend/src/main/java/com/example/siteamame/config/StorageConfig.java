package com.example.siteamame.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.Set;

@Configuration
@EnableConfigurationProperties(StorageProperties.class)
public class StorageConfig {

    /** Fournisseurs pour lesquels une implémentation de FileStorageService existe. */
    private static final Set<String> PROVIDERS = Set.of("local");

    public StorageConfig(StorageProperties props) {
        // Sans ce contrôle, une valeur inconnue ne laisserait qu'une erreur d'injection peu lisible.
        if (!PROVIDERS.contains(props.provider())) {
            throw new IllegalStateException("STORAGE_PROVIDER=" + props.provider()
                    + " : valeur inconnue. Valeurs possibles : " + PROVIDERS);
        }
    }
}
