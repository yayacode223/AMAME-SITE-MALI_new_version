package com.example.siteamame.controller;

import com.example.siteamame.dto.common.PageResponse;
import com.example.siteamame.dto.galerie.GalerieCreationRequest;
import com.example.siteamame.dto.galerie.GalerieDto;
import com.example.siteamame.dto.galerie.GalerieSummaryDto;
import com.example.siteamame.service.GalerieService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class GalerieController {

    private final GalerieService galerieService;

    /* ── Endpoints visiteur (publics) ──────────────────────────────── */

    @Transactional(readOnly = true)
    @GetMapping("/visitor/galeries")
    public ResponseEntity<PageResponse<GalerieSummaryDto>> getAllGaleries(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size,
            @RequestParam(defaultValue = "dateCreation") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        return ResponseEntity.ok(galerieService.getGaleriesPage(page, size, sortBy, sortDirection));
    }

    @Transactional(readOnly = true)
    @GetMapping("/visitor/galeries/{id}")
    public ResponseEntity<GalerieDto> getGalerieById(@PathVariable Long id) {
        return ResponseEntity.ok(galerieService.getGalerieById(id));
    }

    /* ── Endpoints admin (protégés : ROLE_ADMIN / SUPERADMIN) ───────── */

    @Transactional(readOnly = true)
    @GetMapping("/admin/galeries")
    public ResponseEntity<PageResponse<GalerieSummaryDto>> getAllGaleriesAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "dateCreation") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        return ResponseEntity.ok(galerieService.getGaleriesAdminPage(page, size, sortBy, sortDirection));
    }

    @Transactional
    @PostMapping("/admin/galeries")
    @PreAuthorize("hasAuthority('GALERIE_CREATE')")
    public ResponseEntity<GalerieDto> createGalerie(
            @RequestPart(value = "galerie") @Valid GalerieCreationRequest request,
            @RequestPart(value = "image", required = false) MultipartFile file
    ) throws IOException {
        return ResponseEntity.ok(galerieService.createGalerie(request, file));
    }

    @Transactional
    @PutMapping("/admin/galeries/{id}")
    @PreAuthorize("hasAuthority('GALERIE_EDIT')")
    public ResponseEntity<GalerieDto> updateGalerie(
            @PathVariable Long id,
            @RequestPart(value = "galerie") @Valid GalerieDto galerieDto,
            @RequestPart(value = "image", required = false) MultipartFile file
    ) throws IOException {
        return ResponseEntity.ok(galerieService.updateGalerie(id, galerieDto, file));
    }

    @Transactional
    @DeleteMapping("/admin/galeries/{id}")
    @PreAuthorize("hasAuthority('GALERIE_DELETE')")
    public ResponseEntity<Void> deleteGalerie(@PathVariable Long id) {
        galerieService.deleteGalerie(id);
        return ResponseEntity.noContent().build();
    }
}
