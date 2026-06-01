package com.example.siteamame.controller;

import com.example.siteamame.dto.common.PageResponse;
import com.example.siteamame.dto.partenaire.PartenaireDto;
import com.example.siteamame.dto.partenaire.PartenaireRequestDto;
import com.example.siteamame.service.PartenaireService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PartenaireController {

    private final PartenaireService partenaireService;

    @GetMapping("/visitor/partenaires")
    public ResponseEntity<List<PartenaireDto>> getAllPartenairesActifs() {
        return ResponseEntity.ok(partenaireService.getAllPartenairesActifs());
    }

    @GetMapping("/admin/partenaires")
    public ResponseEntity<PageResponse<PartenaireDto>> getAllPartenaires(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "ordre") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection) {
        return ResponseEntity.ok(partenaireService.getAllPartenairesPage(page, size, sortBy, sortDirection));
    }

    @GetMapping("/visitor/partenaires/{id}")
    public ResponseEntity<PartenaireDto> getPartenaireById(@PathVariable Long id) {
        return ResponseEntity.ok(partenaireService.getPartenaireById(id));
    }

    @PostMapping("/admin/partenaires")
    @PreAuthorize("hasAuthority('PARTENAIRE_CREATE')")
    public ResponseEntity<PartenaireDto> createPartenaire(
            @RequestPart(value = "partenaire") @Valid PartenaireRequestDto request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) throws IOException {
        return ResponseEntity.ok(partenaireService.createPartenaire(request, file));
    }

    @PutMapping("/admin/partenaires/{id}")
    @PreAuthorize("hasAuthority('PARTENAIRE_EDIT')")
    public ResponseEntity<PartenaireDto> updatePartenaire(
            @PathVariable Long id,
            @RequestPart(value = "partenaire") @Valid PartenaireRequestDto request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) throws IOException {
        return ResponseEntity.ok(partenaireService.updatePartenaire(id, request, file));
    }

    @DeleteMapping("/admin/partenaires/{id}")
    @PreAuthorize("hasAuthority('PARTENAIRE_DELETE')")
    public ResponseEntity<Void> deletePartenaire(@PathVariable Long id) {
        partenaireService.deletePartenaire(id);
        return ResponseEntity.noContent().build();
    }
}
