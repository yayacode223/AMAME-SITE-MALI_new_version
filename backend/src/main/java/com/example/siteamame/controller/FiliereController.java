package com.example.siteamame.controller;

import com.example.siteamame.dto.common.PageResponse;
import com.example.siteamame.dto.filiere.FiliereDto;
import com.example.siteamame.dto.filiere.FiliereRequestDto;
import com.example.siteamame.dto.filiere.FiliereSummaryDto;
import com.example.siteamame.enumeration.DomaineFiliereSerieType;
import com.example.siteamame.service.FiliereService;
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
public class FiliereController {

    private final FiliereService filiereService;

    @GetMapping("/visitor/filieres")
    public ResponseEntity<PageResponse<FiliereSummaryDto>> getAllFilieres(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size,
            @RequestParam(defaultValue = "nom") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection) {
        return ResponseEntity.ok(filiereService.getFilieresPage(page, size, sortBy, sortDirection));
    }

    @GetMapping("/visitor/filieres/{id}")
    public ResponseEntity<FiliereDto> getFiliereById(@PathVariable Long id) {
        return ResponseEntity.ok(filiereService.getFiliereById(id));
    }

    @GetMapping("/visitor/filieres/search")
    public ResponseEntity<PageResponse<FiliereSummaryDto>> searchFilieres(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size,
            @RequestParam(defaultValue = "nom") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(filiereService.searchFilieresPage(search, page, size, sortBy, sortDirection));
    }

    @GetMapping("/visitor/filieres/domaine/{domaine}")
    public ResponseEntity<PageResponse<FiliereSummaryDto>> getFilieresByDomaine(
            @PathVariable DomaineFiliereSerieType domaine,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size,
            @RequestParam(defaultValue = "nom") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection) {
        return ResponseEntity.ok(filiereService.getFilieresByDomainePage(domaine, page, size, sortBy, sortDirection));
    }

    @GetMapping("/visitor/filieres/domaines")
    public ResponseEntity<List<String>> getAvailableDomaines() {
        List<String> domaines = List.of(
                "SCIENCES_ET_TECHNOLOGIES",
                "SCIENCES_DE_LA_SANTE",
                "SCIENCES_ECONOMIQUES_ET_GESTION",
                "DROIT_POLITIQUE",
                "LETTRES_ET_SCIENCES_HUMAINES",
                "ARTS_ET_COMMUNICATION"
        );
        return ResponseEntity.ok(domaines);
    }


    @PostMapping("/admin/filieres")
    @PreAuthorize("hasAuthority('FILIERE_CREATE')")
    public ResponseEntity<FiliereDto> ajouterFiliere(
            @RequestParam(value = "filiere") @Valid FiliereRequestDto filiereRequestDto,
            @RequestPart(value = "file", required = false)MultipartFile file
            ) throws IOException {
        return ResponseEntity.ok(filiereService.ajouterFiliere(filiereRequestDto, file));
    }

    @PutMapping("/admin/filieres/{id}")
    @PreAuthorize("hasAuthority('FILIERE_EDIT')")
    public ResponseEntity<FiliereDto> modifierFiliere(
            @PathVariable Long id,
            @RequestPart(value = "filiere") FiliereRequestDto filiereRequestDto,
            @RequestPart(value = "file", required = false)MultipartFile file
    ) throws IOException {
        return ResponseEntity.ok(filiereService.modifierFiliere(id, filiereRequestDto, file));
    }

    @DeleteMapping("/admin/filieres/{id}")
    @PreAuthorize("hasAuthority('FILIERE_DELETE')")
    public ResponseEntity<Void> deleteFiliere(@PathVariable Long id){
        filiereService.deleteFiliere(id);
        return ResponseEntity.noContent().build();
    }
    
}