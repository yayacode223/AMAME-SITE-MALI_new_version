package com.example.siteamame.service.file;

import com.example.siteamame.config.StorageProperties;
import com.example.siteamame.model.File;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** L'URL d'un fichier se calcule à partir de sa clé et de MEDIA_BASE_URL : elle n'est jamais stockée. */
class MediaUrlResolverTest {

    private static final String PUBLIC_KEY = "uploads/actualite/3f0c.jpg";
    private static final String PRIVATE_KEY = "uploads/utilisateur/9a1b.pdf";

    @Test
    void withoutBaseUrlPublicFilesGetARelativeUrl() {
        assertThat(resolver("").publicUrl(PUBLIC_KEY)).isEqualTo("/uploads/actualite/3f0c.jpg");
    }

    @Test
    void theBaseUrlIsPrependedWhateverItsTrailingSlashes() {
        assertThat(resolver("https://media.amame.ml").publicUrl(PUBLIC_KEY))
                .isEqualTo("https://media.amame.ml/uploads/actualite/3f0c.jpg");
        assertThat(resolver("https://media.amame.ml//").publicUrl(PUBLIC_KEY))
                .isEqualTo("https://media.amame.ml/uploads/actualite/3f0c.jpg");
    }

    @Test
    void aPrivateFileIsOnlyReachableThroughTheAuthenticatedEndpoint() {
        MediaUrlResolver resolver = resolver("https://media.amame.ml");

        assertThat(resolver.urlOf(file(42L, PRIVATE_KEY))).isEqualTo("/api/user/files/42");
        assertThat(resolver.publicUrl(PRIVATE_KEY)).isNull();
    }

    @Test
    void aPublicFileEntityGetsItsPublicUrl() {
        assertThat(resolver("https://media.amame.ml").urlOf(file(7L, PUBLIC_KEY)))
                .isEqualTo("https://media.amame.ml/uploads/actualite/3f0c.jpg");
    }

    @Test
    void aMissingFileHasNoUrl() {
        MediaUrlResolver resolver = resolver("");

        assertThat(resolver.urlOf(null)).isNull();
        assertThat(resolver.urlOf(new File())).isNull();
        assertThat(resolver.publicUrl(null)).isNull();
        assertThat(resolver.publicUrl(" ")).isNull();
    }

    private static MediaUrlResolver resolver(String publicBaseUrl) {
        return new MediaUrlResolver(
                new StorageProperties("local", publicBaseUrl, new StorageProperties.Local("uploads"),
                StorageProperties.Purge.disabled()));
    }

    private static File file(Long id, String key) {
        File file = new File();
        file.setId(id);
        file.setFilePath(key);
        return file;
    }
}
