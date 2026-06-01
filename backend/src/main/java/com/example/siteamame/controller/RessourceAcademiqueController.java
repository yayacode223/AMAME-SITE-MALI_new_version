package com.example.siteamame.controller;

import com.example.siteamame.dto.common.PageResponse;
import com.example.siteamame.dto.ressource.RessourceAcademiqueDto;
import com.example.siteamame.dto.ressource.RessourceAcademiqueRequestDto;
import com.example.siteamame.service.RessourceAcademiqueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RessourceAcademiqueController {

    private final RessourceAcademiqueService ressourceService;

    @GetMapping("/visitor/ressources")
    public ResponseEntity<PageResponse<RessourceAcademiqueDto>> getAllRessourcesActives(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "ordre") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection) {
        return ResponseEntity.ok(ressourceService.getRessourcesActivesPage(page, size, sortBy, sortDirection));
    }

    @GetMapping("/visitor/ressources/{id}")
    public ResponseEntity<RessourceAcademiqueDto> getRessourceById(@PathVariable Long id) {
        return ResponseEntity.ok(ressourceService.getRessourceById(id));
    }

    @GetMapping("/admin/ressources")
    public ResponseEntity<PageResponse<RessourceAcademiqueDto>> getAllRessources(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "ordre") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection) {
        return ResponseEntity.ok(ressourceService.getRessourcesPage(page, size, sortBy, sortDirection));
    }

    @PostMapping("/admin/ressources")
    @PreAuthorize("hasAuthority('RESSOURCE_CREATE')")
    public ResponseEntity<RessourceAcademiqueDto> createRessource(
            @RequestPart(value = "ressource") @Valid RessourceAcademiqueRequestDto request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) throws IOException {
        return new ResponseEntity<>(ressourceService.createRessource(request, file), HttpStatus.CREATED);
    }

    @PutMapping("/admin/ressources/{id}")
    @PreAuthorize("hasAuthority('RESSOURCE_EDIT')")
    public ResponseEntity<RessourceAcademiqueDto> updateRessource(
            @PathVariable Long id,
            @RequestPart(value = "ressource") @Valid RessourceAcademiqueRequestDto request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) throws IOException {
        return ResponseEntity.ok(ressourceService.updateRessource(id, request, file));
    }

    @DeleteMapping("/admin/ressources/{id}")
    @PreAuthorize("hasAuthority('RESSOURCE_DELETE')")
    public ResponseEntity<Void> deleteRessource(@PathVariable Long id) {
        ressourceService.deleteRessource(id);
        return ResponseEntity.noContent().build();
    }
}
