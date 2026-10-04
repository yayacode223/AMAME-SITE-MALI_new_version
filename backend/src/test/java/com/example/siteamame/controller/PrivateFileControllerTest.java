package com.example.siteamame.controller;

import com.example.siteamame.enumeration.FileType;
import com.example.siteamame.enumeration.Permission;
import com.example.siteamame.enumeration.RoleType;
import com.example.siteamame.model.File;
import com.example.siteamame.model.User;
import com.example.siteamame.repository.FileRepository;
import com.example.siteamame.repository.UserRepository;
import com.example.siteamame.security.CustomUserDetails;
import com.example.siteamame.service.file.FileStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.NoSuchFileException;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Règles d'accès aux fichiers privés (CV et photos des inscrits) : le propriétaire et les
 * titulaires de USER_READ_ALL lisent, tous les autres sont refusés, et un fichier public
 * n'est jamais servi par cet endpoint.
 */
@ExtendWith(MockitoExtension.class)
class PrivateFileControllerTest {

    private static final long FILE_ID = 12L;
    private static final long OWNER_ID = 7L;
    private static final long OTHER_ID = 8L;
    private static final String CV_KEY = "uploads/utilisateur/11111111-1111-1111-1111-111111111111.pdf";
    private static final String PHOTO_KEY = "uploads/utilisateur/22222222-2222-2222-2222-222222222222.jpg";

    @Mock
    private FileRepository fileRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private FileStorageService storage;
    @InjectMocks
    private PrivateFileController controller;

    @Test
    void ownerReadsOwnPhotoWithPrivateBrowserCache() throws IOException {
        byte[] content = {1, 2, 3};
        when(fileRepository.findById(FILE_ID)).thenReturn(Optional.of(file(PHOTO_KEY, FileType.IMAGE, "image/jpeg")));
        when(userRepository.existsByIdAndFiles_Id(OWNER_ID, FILE_ID)).thenReturn(true);
        when(storage.load(PHOTO_KEY)).thenReturn(content);

        ResponseEntity<byte[]> response = controller.read(FILE_ID, principal(OWNER_ID));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(content);
        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.IMAGE_JPEG);
        assertThat(response.getHeaders().getCacheControl()).contains("private").contains("max-age=3600");
        assertThat(response.getHeaders().getFirst("X-Content-Type-Options")).isEqualTo("nosniff");
    }

    @Test
    void ownerReadsOwnCvWhichIsNeverCached() throws IOException {
        when(fileRepository.findById(FILE_ID)).thenReturn(Optional.of(file(CV_KEY, FileType.DOCUMENT, "application/pdf")));
        when(userRepository.existsByIdAndFiles_Id(OWNER_ID, FILE_ID)).thenReturn(true);
        when(storage.load(CV_KEY)).thenReturn(new byte[]{4});

        ResponseEntity<byte[]> response = controller.read(FILE_ID, principal(OWNER_ID));

        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_PDF);
        assertThat(response.getHeaders().getCacheControl()).isEqualTo("no-store");
        assertThat(response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION)).startsWith("inline");
    }

    @Test
    void userReadAllHolderReadsAnotherUsersCv() throws IOException {
        when(fileRepository.findById(FILE_ID)).thenReturn(Optional.of(file(CV_KEY, FileType.DOCUMENT, "application/pdf")));
        when(userRepository.existsByIdAndFiles_Id(OTHER_ID, FILE_ID)).thenReturn(false);
        when(storage.load(CV_KEY)).thenReturn(new byte[]{4});

        ResponseEntity<byte[]> response = controller.read(FILE_ID, principal(OTHER_ID, Permission.USER_READ_ALL));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void anotherUserIsForbiddenAndNothingIsRead() throws IOException {
        when(fileRepository.findById(FILE_ID)).thenReturn(Optional.of(file(CV_KEY, FileType.DOCUMENT, "application/pdf")));
        when(userRepository.existsByIdAndFiles_Id(OTHER_ID, FILE_ID)).thenReturn(false);

        assertThatThrownBy(() -> controller.read(FILE_ID, principal(OTHER_ID, Permission.DASHBOARD_ACCESS)))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));
        verify(storage, never()).load(anyString());
    }

    @Test
    void publicFileIsNotServedByThisEndpointEvenToAnAdmin() throws IOException {
        when(fileRepository.findById(FILE_ID)).thenReturn(Optional.of(
                file("uploads/actualite/33333333-3333-3333-3333-333333333333.jpeg", FileType.IMAGE, "image/jpeg")));

        assertThatThrownBy(() -> controller.read(FILE_ID, principal(OTHER_ID, Permission.USER_READ_ALL)))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
        verify(storage, never()).load(anyString());
    }

    @Test
    void unknownFileIsNotFound() {
        when(fileRepository.findById(FILE_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.read(FILE_ID, principal(OWNER_ID)))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void rowWithoutItsFileOnDiskIsNotFound() throws IOException {
        when(fileRepository.findById(FILE_ID)).thenReturn(Optional.of(file(CV_KEY, FileType.DOCUMENT, "application/pdf")));
        when(userRepository.existsByIdAndFiles_Id(OWNER_ID, FILE_ID)).thenReturn(true);
        when(storage.load(CV_KEY)).thenThrow(new NoSuchFileException(CV_KEY));

        assertThatThrownBy(() -> controller.read(FILE_ID, principal(OWNER_ID)))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void missingMimeTypeFallsBackToNeutralDownload() throws IOException {
        when(fileRepository.findById(FILE_ID)).thenReturn(Optional.of(file(CV_KEY, FileType.DOCUMENT, null)));
        when(userRepository.existsByIdAndFiles_Id(OWNER_ID, FILE_ID)).thenReturn(true);
        when(storage.load(CV_KEY)).thenReturn(new byte[]{4});

        ResponseEntity<byte[]> response = controller.read(FILE_ID, principal(OWNER_ID));

        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_OCTET_STREAM);
    }

    private static File file(String key, FileType type, String mimeType) {
        File file = new File();
        file.setId(FILE_ID);
        file.setFileName(key.substring(key.lastIndexOf('/') + 1));
        file.setFilePath(key);
        file.setFileType(type);
        file.setFileMimeType(mimeType);
        return file;
    }

    private static CustomUserDetails principal(long userId, Permission... permissions) {
        User user = new User();
        user.setId(userId);
        user.setRole(RoleType.USER);
        return new CustomUserDetails(user, Set.of(permissions));
    }
}
