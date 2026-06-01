package com.example.siteamame.controller;

import com.example.siteamame.dto.common.PageResponse;
import com.example.siteamame.dto.membre.MembreDto;
import com.example.siteamame.dto.membre.MembreRequestDto;
import com.example.siteamame.service.MembreBureauService;
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
public class MembreBureauController {

    private final MembreBureauService membreBureauService;

    @GetMapping("/visitor/membres")
    public ResponseEntity<List<MembreDto>> getAllMembresActifs() {
        return ResponseEntity.ok(membreBureauService.getAllMembresActifs());
    }

    @GetMapping("/admin/membres")
    public ResponseEntity<PageResponse<MembreDto>> getAllMembres(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "ordre") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection) {
        return ResponseEntity.ok(membreBureauService.getAllMembresPage(page, size, sortBy, sortDirection));
    }

    @GetMapping("/admin/membres/{id}")
    public ResponseEntity<MembreDto> getMembreById(@PathVariable Long id) {
        return ResponseEntity.ok(membreBureauService.getMembreById(id));
    }

    @PostMapping("/admin/membres")
    @PreAuthorize("hasAuthority('MEMBRE_CREATE')")
    public ResponseEntity<MembreDto> createMembre(
            @RequestPart(value = "membre") @Valid MembreRequestDto request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) throws IOException {
        return ResponseEntity.ok(membreBureauService.createMembre(request, file));
    }

    @PutMapping("/admin/membres/{id}")
    @PreAuthorize("hasAuthority('MEMBRE_EDIT')")
    public ResponseEntity<MembreDto> updateMembre(
            @PathVariable Long id,
            @RequestPart(value = "membre") @Valid MembreRequestDto request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) throws IOException {
        return ResponseEntity.ok(membreBureauService.updateMembre(id, request, file));
    }

    @DeleteMapping("/admin/membres/{id}")
    @PreAuthorize("hasAuthority('MEMBRE_DELETE')")
    public ResponseEntity<Void> deleteMembre(@PathVariable Long id) {
        membreBureauService.deleteMembre(id);
        return ResponseEntity.noContent().build();
    }
}
