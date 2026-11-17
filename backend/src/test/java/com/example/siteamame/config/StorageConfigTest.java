package com.example.siteamame.config;

import com.example.siteamame.config.BunnyStorageProperties.Zone;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Contrôles de démarrage du stockage : la bascule vers Bunny refuse une configuration incomplète. */
class StorageConfigTest {

    private static final Zone NONE = new Zone("", "");
    private static final Zone PUBLIC = new Zone("amame-public", "cle-publique");
    private static final Zone PRIVATE = new Zone("amame-private", "cle-privee");

    @Test
    void localStorageNeedsNoBunnySetting() {
        assertThatCode(() -> new StorageConfig(storage("local", ""), bunny(NONE, NONE))).doesNotThrowAnyException();
    }

    @Test
    void anUnknownProviderIsRefused() {
        assertThatThrownBy(() -> new StorageConfig(storage("s3", ""), bunny(NONE, NONE)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("STORAGE_PROVIDER=s3");
    }

    @Test
    void bunnyWithoutItsSettingsNamesEveryMissingVariable() {
        assertThatThrownBy(() -> new StorageConfig(storage("bunny", ""), bunny(NONE, new Zone("amame-private", ""))))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("BUNNY_PUBLIC_ZONE et BUNNY_PUBLIC_ZONE_KEY")
                .hasMessageContaining("BUNNY_PRIVATE_ZONE et BUNNY_PRIVATE_ZONE_KEY")
                .hasMessageContaining("MEDIA_BASE_URL");
    }

    @Test
    void bunnyWithTheSameZoneForPublicAndPrivateFilesIsRefused() {
        Zone same = new Zone("amame-public", "cle");

        assertThatThrownBy(() -> new StorageConfig(storage("bunny", "https://media.amame.ml"), bunny(same, same)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("même zone");
    }

    @Test
    void bunnyFullyConfiguredStarts() {
        assertThatCode(() -> new StorageConfig(storage("bunny", "https://media.amame.ml"), bunny(PUBLIC, PRIVATE)))
                .doesNotThrowAnyException();
    }

    private static StorageProperties storage(String provider, String publicBaseUrl) {
        return new StorageProperties(provider, publicBaseUrl, new StorageProperties.Local("uploads"),
                StorageProperties.Purge.disabled());
    }

    private static BunnyStorageProperties bunny(Zone publicZone, Zone privateZone) {
        return new BunnyStorageProperties("https://storage.bunnycdn.com", publicZone, privateZone,
                Duration.ofSeconds(5), Duration.ofSeconds(20), 2);
    }
}
