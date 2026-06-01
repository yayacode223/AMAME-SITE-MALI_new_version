package com.example.siteamame.controller;

import com.example.siteamame.dto.common.PageResponse;
import com.example.siteamame.dto.etablissement.EtablissementDto;
import com.example.siteamame.dto.etablissement.EtablissementRequestDto;
import com.example.siteamame.service.EtablissementService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api")
public class EtablissementController {

    private final EtablissementService etablissementService;

    /* ── Routes publiques ── */

    @GetMapping("/visitor/etablissements")
    public ResponseEntity<PageResponse<EtablissementDto>> getAllEtablissements(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "nom") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection) {
        return ResponseEntity.ok(etablissementService.getEtablissementsPage(page, size, sortBy, sortDirection));
    }

    @GetMapping("/visitor/etablissements/{id}")
    public ResponseEntity<EtablissementDto> getEtablissementById(@PathVariable Long id) {
        return ResponseEntity.ok(etablissementService.getEtablissementById(id));
    }

    /* Compatibilité avec l'ancien endpoint (USER authentifié) */
    @GetMapping("/user/etablissement")
    public ResponseEntity<List<EtablissementDto>> getAllEtablissementsLegacy() {
        return ResponseEntity.ok(etablissementService.getAllEtablissements());
    }

    /* ── Routes admin ── */

    @PostMapping("/admin/etablissements")
    @PreAuthorize("hasAuthority('ETABLISSEMENT_CREATE')")
    public ResponseEntity<EtablissementDto> createEtablissement(
            @RequestBody @Valid EtablissementRequestDto request) {
        return new ResponseEntity<>(etablissementService.createEtablissement(request), HttpStatus.CREATED);
    }

    @PutMapping("/admin/etablissements/{id}")
    @PreAuthorize("hasAuthority('ETABLISSEMENT_EDIT')")
    public ResponseEntity<EtablissementDto> updateEtablissement(
            @PathVariable Long id,
            @RequestBody @Valid EtablissementRequestDto request) {
        return ResponseEntity.ok(etablissementService.updateEtablissement(id, request));
    }

    @DeleteMapping("/admin/etablissements/{id}")
    @PreAuthorize("hasAuthority('ETABLISSEMENT_DELETE')")
    public ResponseEntity<Void> deleteEtablissement(@PathVariable Long id) {
        etablissementService.deleteEtablissement(id);
        return ResponseEntity.noContent().build();
    }
}
