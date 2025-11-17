package com.example.siteamame.controller;

import com.example.siteamame.dto.bourse.BourseCreationRequest;
import com.example.siteamame.dto.bourse.BourseDetailDto;
import com.example.siteamame.dto.bourse.BoursePageResponse;
import com.example.siteamame.service.BourseService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@AllArgsConstructor
@RestController
@RequestMapping("/api")
public class BourseController {
    private final BourseService bourseService;

    // Méthodes GET existantes
    @GetMapping("/visitor/bourses")
    public ResponseEntity<BoursePageResponse> getBoursesValides(
            @RequestParam(defaultValue="0") int page,
            @RequestParam(defaultValue = "9") int size,
            @RequestParam(defaultValue = "dateLimite") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection
    ){
        BoursePageResponse boursePageResponse = bourseService.getBoursesValides(page,size, sortBy, sortDirection);
        return ResponseEntity.ok(boursePageResponse);
    }

    @GetMapping("/visitor/bourses/filter")
    public ResponseEntity<BoursePageResponse> getBoursesValidesAndFiltere(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size,
            @RequestParam(defaultValue = "dateLimite") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection,
            @RequestParam(required = false) String categorie,
            @RequestParam(required = false) String niveau,
            @RequestParam(required = false) String pays
    ){
        String cleanCategorie = (categorie == null || "undefined".equals(categorie)) ? null : categorie.trim();
        String cleanNiveau = (niveau == null || "undefined".equals(niveau)) ? null : niveau.trim();
        String cleanPays = (pays == null || "undefined".equals(pays)) ? null : pays.trim();
        BoursePageResponse boursePageResponse = bourseService.getBoursesValidesAndFiltere(
                page, size, sortBy, sortDirection, cleanCategorie, cleanNiveau, cleanPays);
        return ResponseEntity.ok(boursePageResponse);
    }

    @GetMapping("/visitor/bourses/search")
    public ResponseEntity<BoursePageResponse> getBySearchBourses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size,
            @RequestParam(defaultValue = "dateLimite") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection,
            @RequestParam(required = false) String titre,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String pays
    ){
        String cleanTitre = (titre == null || "undefined".equals(titre)) ? null : titre.trim();
        String cleanDescription = (description == null || "undefined".equals(description)) ? null : description.trim();
        String cleanPays = (pays == null || "undefined".equals(pays)) ? null : pays.trim();

        BoursePageResponse boursePageResponse = bourseService.getBySearchBourses(
                page, size, sortBy, sortDirection, cleanTitre, cleanDescription, cleanPays);
        return ResponseEntity.ok(boursePageResponse);
    }

    @GetMapping("/visitor/bourses/{id}")
    public ResponseEntity<BourseDetailDto> getBourseById(@PathVariable Long id){
        BourseDetailDto bourseDetailDto = bourseService.getBourseById(id);
        return ResponseEntity.ok(bourseDetailDto);
    }

    // NOUVELLES MÉTHODES CRUD
    @PostMapping("/admin/bourses")
    public ResponseEntity<BourseDetailDto> createBourse(
            @RequestPart(value = "bourse") @Valid BourseCreationRequest bourseRequest,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        BourseDetailDto createdBourse = bourseService.createBourse(bourseRequest, file);
        return ResponseEntity.ok(createdBourse);
    }

    @PutMapping("/admin/bourses/{id}")
    public ResponseEntity<BourseDetailDto> updateBourse(
            @PathVariable Long id,
            @RequestPart(value = "bourse") @Valid BourseCreationRequest bourseRequest,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        BourseDetailDto updatedBourse = bourseService.updateBourse(id, bourseRequest, file);
        return ResponseEntity.ok(updatedBourse);
    }

    @DeleteMapping("/admin/bourses/{id}")
    public ResponseEntity<Void> deleteBourse(@PathVariable Long id) {
        bourseService.deleteBourse(id);
        return ResponseEntity.noContent().build();
    }

}