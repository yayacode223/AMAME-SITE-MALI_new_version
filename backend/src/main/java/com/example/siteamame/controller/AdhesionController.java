package com.example.siteamame.controller;

import com.example.siteamame.dto.adhesion.AdhesionDto;
import com.example.siteamame.dto.adhesion.AdhesionRegisterRequest;
import com.example.siteamame.dto.adhesion.AdhesionRejectRequest;
import com.example.siteamame.dto.adhesion.AdhesionRequestDto;
import com.example.siteamame.dto.common.PageResponse;
import com.example.siteamame.enumeration.AdhesionStatus;
import com.example.siteamame.security.CustomUserDetails;
import com.example.siteamame.service.AdhesionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AdhesionController {

    private final AdhesionService adhesionService;

    // ── Route publique : inscription + adhésion en une seule requête ────────

    /**
     * Crée un compte utilisateur et soumet une demande d'adhésion simultanément.
     * Accessible sans authentification (flux "Adhérer" depuis la navbar).
     */
    @PostMapping("/visitor/adhesion/register")
    public ResponseEntity<AdhesionDto> registerAndSubmitAdhesion(
            @RequestBody @Valid AdhesionRegisterRequest request) {
        return ResponseEntity.ok(adhesionService.registerAndSubmitAdhesion(request));
    }

    // ── Routes utilisateur authentifié ──────────────────────────────────────

    /** Soumettre une demande d'adhésion. */
    @PostMapping("/user/adhesion")
    public ResponseEntity<AdhesionDto> submitAdhesion(
            @RequestBody @Valid AdhesionRequestDto request,
            Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return ResponseEntity.ok(adhesionService.submitAdhesion(userDetails.getUser().getId(), request));
    }

    /** Consulter le statut de sa propre demande d'adhésion. */
    @GetMapping("/user/adhesion/status")
    public ResponseEntity<?> getAdhesionStatus(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return ResponseEntity.ok(
                adhesionService.getAdhesionStatus(userDetails.getUser().getId()).orElse(null)
        );
    }

    // ── Routes admin ────────────────────────────────────────────────────────

    /** Liste paginée de toutes les demandes (admin). */
    @GetMapping("/admin/adhesions")
    @PreAuthorize("hasAuthority('ADHESION_MANAGE')")
    public ResponseEntity<PageResponse<AdhesionDto>> getAllAdhesions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection,
            @RequestParam(required = false) AdhesionStatus status) {
        return ResponseEntity.ok(
                adhesionService.getAllAdhesions(page, size, sortBy, sortDirection, status)
        );
    }

    /** Statistiques rapides (nombre de demandes en attente et total membres). */
    @GetMapping("/admin/adhesions/stats")
    @PreAuthorize("hasAuthority('ADHESION_MANAGE')")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(Map.of(
                "pending", adhesionService.countByStatus(AdhesionStatus.PENDING),
                "approved", adhesionService.countByStatus(AdhesionStatus.APPROVED),
                "rejected", adhesionService.countByStatus(AdhesionStatus.REJECTED)
        ));
    }

    /** Approuver une demande → passe l'utilisateur en MEMBER. */
    @PutMapping("/admin/adhesions/{id}/approve")
    @PreAuthorize("hasAuthority('ADHESION_MANAGE')")
    public ResponseEntity<AdhesionDto> approveAdhesion(@PathVariable Long id) {
        return ResponseEntity.ok(adhesionService.approveAdhesion(id));
    }

    /** Rejeter une demande avec raison optionnelle. */
    @PutMapping("/admin/adhesions/{id}/reject")
    @PreAuthorize("hasAuthority('ADHESION_MANAGE')")
    public ResponseEntity<AdhesionDto> rejectAdhesion(
            @PathVariable Long id,
            @RequestBody(required = false) AdhesionRejectRequest request) {
        return ResponseEntity.ok(
                adhesionService.rejectAdhesion(id, request != null ? request.getReason() : null)
        );
    }

    /** Supprimer une demande. */
    @DeleteMapping("/admin/adhesions/{id}")
    @PreAuthorize("hasAuthority('ADHESION_MANAGE')")
    public ResponseEntity<Void> deleteAdhesion(@PathVariable Long id) {
        adhesionService.deleteAdhesion(id);
        return ResponseEntity.noContent().build();
    }
}
