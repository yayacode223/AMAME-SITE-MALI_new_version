package com.example.siteamame.config;

import com.example.siteamame.service.file.BunnyStorageClient;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.net.http.HttpClient;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Configuration
@EnableConfigurationProperties({StorageProperties.class, BunnyStorageProperties.class})
public class StorageConfig {

    /** Fournisseurs pour lesquels une implémentation de FileStorageService existe. */
    private static final Set<String> PROVIDERS = Set.of("local", "bunny");

    public StorageConfig(StorageProperties props, BunnyStorageProperties bunny) {
        // Sans ce contrôle, une valeur inconnue ne laisserait qu'une erreur d'injection peu lisible.
        if (!PROVIDERS.contains(props.provider())) {
            throw new IllegalStateException("STORAGE_PROVIDER=" + props.provider()
                    + " : valeur inconnue. Valeurs possibles : " + PROVIDERS);
        }
        if ("bunny".equals(props.provider())) {
            requireBunnySettings(props, bunny);
        }
    }

    /**
     * La bascule vers Bunny (étape 3.5) refuse de démarrer sur une configuration incomplète, plutôt que
     * de démarrer et d'échouer au premier upload, ou de produire des URL relatives qui pointeraient
     * vers le disque du serveur, où les nouveaux fichiers ne sont plus.
     */
    private static void requireBunnySettings(StorageProperties props, BunnyStorageProperties bunny) {
        List<String> missing = new ArrayList<>();
        if (!bunny.publicZone().configured()) {
            missing.add("BUNNY_PUBLIC_ZONE et BUNNY_PUBLIC_ZONE_KEY");
        }
        if (!bunny.privateZone().configured()) {
            missing.add("BUNNY_PRIVATE_ZONE et BUNNY_PRIVATE_ZONE_KEY");
        }
        if (props.publicBaseUrl() == null || props.publicBaseUrl().isBlank()) {
            missing.add("MEDIA_BASE_URL (adresse du CDN, par exemple https://media.amame.ml)");
        }
        if (!missing.isEmpty()) {
            throw new IllegalStateException("STORAGE_PROVIDER=bunny : à définir : " + String.join(", ", missing));
        }
        if (bunny.publicZone().name().equals(bunny.privateZone().name())) {
            // Les CV et photos des inscrits seraient servis par le CDN.
            throw new IllegalStateException("STORAGE_PROVIDER=bunny : BUNNY_PUBLIC_ZONE et BUNNY_PRIVATE_ZONE"
                    + " désignent la même zone (" + bunny.publicZone().name() + ") : il en faut deux distinctes");
        }
    }

    @Bean
    @ConditionalOnProperty(name = "app.storage.provider", havingValue = "bunny")
    BunnyStorageClient bunnyStorageClient(BunnyStorageProperties props) {
        HttpClient http = HttpClient.newBuilder()
                .connectTimeout(props.connectTimeout())
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
        return new BunnyStorageClient(http, props);
    }
}
