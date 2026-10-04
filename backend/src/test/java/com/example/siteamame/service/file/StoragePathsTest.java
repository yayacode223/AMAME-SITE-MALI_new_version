package com.example.siteamame.service.file;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StoragePathsTest {

    @Test
    void onlyKeysUnderTheUserFolderArePrivate() {
        assertThat(StoragePaths.isPrivate("uploads/utilisateur/11111111-1111-1111-1111-111111111111.pdf")).isTrue();
        assertThat(StoragePaths.isPrivate("uploads/actualite/33333333-3333-3333-3333-333333333333.jpeg")).isFalse();
        assertThat(StoragePaths.isPrivate("uploads/utilisateur-public/photo.jpg")).isFalse();
        assertThat(StoragePaths.isPrivate(null)).isFalse();
    }

    @Test
    void keyIsBuiltFromFolderAndFileName() {
        assertThat(StoragePaths.key("actualite", "a.png")).isEqualTo("uploads/actualite/a.png");
    }

    @Test
    void generatedKeysAreAccepted() {
        String key = "uploads/utilisateur/11111111-1111-1111-1111-111111111111.pdf";
        assertThat(StoragePaths.requireSafe(key)).isEqualTo(key);
    }

    @Test
    void anythingThatIsNotAGeneratedKeyIsRejected() {
        for (String key : new String[]{
                "uploads/utilisateur/../../etc/passwd",
                "/etc/passwd",
                "uploads\\utilisateur\\a.pdf",
                "https://exemple.org/a.png",
                "uploads/utilisateur/a b.pdf",
                ""}) {
            assertThatThrownBy(() -> StoragePaths.requireSafe(key))
                    .as("clé « %s »", key)
                    .isInstanceOf(IllegalArgumentException.class);
        }
        assertThatThrownBy(() -> StoragePaths.requireSafe(null)).isInstanceOf(IllegalArgumentException.class);
    }
}
