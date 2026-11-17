package com.example.siteamame.controller;

import com.example.siteamame.model.File;
import com.example.siteamame.repository.FileRepository;
import com.example.siteamame.repository.UserRepository;
import com.example.siteamame.security.CustomUserDetails;
import com.example.siteamame.service.file.FileStorageService;
import com.example.siteamame.service.file.StoragePaths;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.NoSuchFileException;

/**
 * Seule voie de lecture des fichiers privés (CV et photos des inscrits).
 * La décision d'accès est prise à partir de la base : propriétaire du fichier, ou droit de voir tous les utilisateurs.
 */
@RestController
@RequestMapping("/api/user/files")
@RequiredArgsConstructor
public class PrivateFileController {

    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final FileStorageService storage;

    @GetMapping("/{fileId}")
    public ResponseEntity<byte[]> read(@PathVariable Long fileId,
                                       @AuthenticationPrincipal CustomUserDetails me) throws IOException {
        File file = fileRepository.findById(fileId)
                .filter(f -> StoragePaths.isPrivate(f.getFilePath()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fichier introuvable"));

        boolean owner = userRepository.existsByIdAndFiles_Id(me.getUser().getId(), fileId);
        boolean admin = me.getAuthorities().stream()
                .anyMatch(a -> "USER_READ_ALL".equals(a.getAuthority()));
        if (!owner && !admin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé");
        }

        byte[] content;
        try {
            content = storage.load(file.getFilePath());
        } catch (NoSuchFileException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Fichier introuvable");
        }

        // Jamais dans le cache du navigateur, photo comprise : ce cache ne distingue pas les comptes.
        // Une photo gardée « private, max-age=3600 » restait lisible, sur le même navigateur, par le
        // compte connecté ensuite (constaté le 16 novembre 2026, écart E44 du suivi de migration).
        return ResponseEntity.ok()
                .contentType(mediaTypeOf(file))
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(file.getFileName()).build().toString())
                .header("X-Content-Type-Options", "nosniff")
                .body(content);
    }

    private static MediaType mediaTypeOf(File file) {
        try {
            return MediaType.parseMediaType(file.getFileMimeType());
        } catch (RuntimeException e) {
            // MIME absent ou illisible sur d'anciennes lignes : téléchargement neutre
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }
}
