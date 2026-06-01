package com.example.siteamame.controller;

import com.example.siteamame.dto.concours.ConcoursPageResponse;
import com.example.siteamame.dto.concours.ConcoursReponseDto;
import com.example.siteamame.dto.concours.ConcoursRequestDto;
import com.example.siteamame.enumeration.NiveauType;
import com.example.siteamame.enumeration.StatusType;
import com.example.siteamame.service.ConcoursService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@AllArgsConstructor
@RequestMapping("/api")
public class ConcoursController {
    private final ConcoursService concoursService;

    @GetMapping("/visitor/concours")
    public ResponseEntity<ConcoursPageResponse> getAllConcours(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size,
            @RequestParam(defaultValue = "dateLimite") String sortBy,
            @RequestParam(defaultValue = "ASC")  String sortDirection
    ){
        ConcoursPageResponse concoursPageResponse = concoursService.getAllConcours(
                page, size,
                sortBy, sortDirection
        );
        return ResponseEntity.ok(concoursPageResponse);
    }

    @GetMapping("/visitor/concours/filter")
    public ResponseEntity<ConcoursPageResponse> getConcoursByNieauOrByStatus(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size,
            @RequestParam(defaultValue = "dateLimite") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection,
            @RequestParam(required = false)  NiveauType niveau,
            @RequestParam(required = false) StatusType status
    ){
        ConcoursPageResponse concoursPageResponse = concoursService.getConcoursByNiveauOrByStatus(
                page,
                size,
                sortBy,
                sortDirection,
                niveau,
                status
        );
        return ResponseEntity.ok(concoursPageResponse);
    }

    @GetMapping("/visitor/concours/search")
    public ResponseEntity<ConcoursPageResponse> getConcoursBySearch(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size,
            @RequestParam(defaultValue = "dateLimite") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection,
            @RequestParam(required = false) String search
    ){
        String cleanSearch = (search == null || "undefined".equals(search)) ? null : search.trim();
        ConcoursPageResponse concoursPageResponse = concoursService.getConcoursBySearch(
                page,size,
                sortBy, sortDirection,
                cleanSearch
        );
        return ResponseEntity.ok(concoursPageResponse);
    }

    @GetMapping("/visitor/concours/{id}")
    public ResponseEntity<ConcoursReponseDto> recupereConcours(@PathVariable Long id){
        return ResponseEntity.ok(concoursService.recupererConcours(id));
    }

    @PostMapping("/admin/concours")
    @PreAuthorize("hasAuthority('CONCOURS_CREATE')")
    public ResponseEntity<ConcoursReponseDto> ajouterConcours(
            @RequestPart(value="concours") @Valid ConcoursRequestDto concoursRequestDto,
            @RequestPart(value="file", required = false) MultipartFile file
    ){
        return ResponseEntity.ok(concoursService.ajouterConcours(concoursRequestDto, file));
    }

    @PutMapping("/admin/concours/{id}")
    @PreAuthorize("hasAuthority('CONCOURS_EDIT')")
    public ResponseEntity<ConcoursReponseDto> modifierConcours(
            @PathVariable Long id,
            @RequestPart(value = "concours") ConcoursRequestDto concoursRequestDto,
            @RequestPart(value = "file", required = false) MultipartFile file
    ){
        return ResponseEntity.ok(concoursService.modifierConcours(id, concoursRequestDto, file));
    }

    @DeleteMapping("/admin/concours/{id}")
    @PreAuthorize("hasAuthority('CONCOURS_DELETE')")
    public ResponseEntity<Void> deleteConcours(@PathVariable Long id){
        concoursService.deleteConcours(id);
        return ResponseEntity.noContent().build();
    }

}
