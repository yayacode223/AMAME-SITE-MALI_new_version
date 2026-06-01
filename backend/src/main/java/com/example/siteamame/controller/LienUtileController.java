package com.example.siteamame.controller;

import com.example.siteamame.dto.common.PageResponse;
import com.example.siteamame.dto.lienutile.LienUtileDto;
import com.example.siteamame.dto.lienutile.LienUtileRequestDto;
import com.example.siteamame.service.LienUtileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LienUtileController {

    private final LienUtileService lienUtileService;

    @GetMapping("/visitor/liens-utiles")
    public ResponseEntity<List<LienUtileDto>> getAllLiensActifs() {
        return ResponseEntity.ok(lienUtileService.getAllLiensActifs());
    }

    @GetMapping("/visitor/liens-utiles/{id}")
    public ResponseEntity<LienUtileDto> getLienById(@PathVariable Long id) {
        return ResponseEntity.ok(lienUtileService.getLienById(id));
    }

    @GetMapping("/admin/liens-utiles")
    public ResponseEntity<PageResponse<LienUtileDto>> getAllLiens(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "ordre") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection) {
        return ResponseEntity.ok(lienUtileService.getAllLiensPage(page, size, sortBy, sortDirection));
    }

    @PostMapping("/admin/liens-utiles")
    @PreAuthorize("hasAuthority('LIEN_UTILE_CREATE')")
    public ResponseEntity<LienUtileDto> createLien(@RequestBody @Valid LienUtileRequestDto request) {
        return new ResponseEntity<>(lienUtileService.createLien(request), HttpStatus.CREATED);
    }

    @PutMapping("/admin/liens-utiles/{id}")
    @PreAuthorize("hasAuthority('LIEN_UTILE_EDIT')")
    public ResponseEntity<LienUtileDto> updateLien(
            @PathVariable Long id, @RequestBody @Valid LienUtileRequestDto request) {
        return ResponseEntity.ok(lienUtileService.updateLien(id, request));
    }

    @DeleteMapping("/admin/liens-utiles/{id}")
    @PreAuthorize("hasAuthority('LIEN_UTILE_DELETE')")
    public ResponseEntity<Void> deleteLien(@PathVariable Long id) {
        lienUtileService.deleteLien(id);
        return ResponseEntity.noContent().build();
    }
}
