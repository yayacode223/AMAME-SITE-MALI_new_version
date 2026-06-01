package com.example.siteamame.controller;

import com.example.siteamame.dto.cotisation.CotisationDto;
import com.example.siteamame.dto.don.DonDto;
import com.example.siteamame.dto.don.DonRequestDto;
import com.example.siteamame.dto.user.ChangePasswordRequest;
import com.example.siteamame.dto.user.UpdateProfileRequest;
import com.example.siteamame.dto.user.UserReponseDto;
import com.example.siteamame.security.CustomUserDetails;
import com.example.siteamame.service.MembreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class MembreController {

    private final MembreService membreService;

    private Long currentUserId(Authentication auth) {
        return ((CustomUserDetails) auth.getPrincipal()).getUser().getId();
    }

    // ── Profil ───────────────────────────────────────────────────────────────

    @PatchMapping("/profile")
    public ResponseEntity<UserReponseDto> updateProfile(
            @RequestBody @Valid UpdateProfileRequest request,
            Authentication auth) {
        return ResponseEntity.ok(membreService.updateProfile(currentUserId(auth), request));
    }

    // ── Mot de passe ─────────────────────────────────────────────────────────

    @PutMapping("/change-password")
    public ResponseEntity<Void> changePassword(
            @RequestBody @Valid ChangePasswordRequest request,
            Authentication auth) {
        membreService.changePassword(currentUserId(auth), request);
        return ResponseEntity.ok().build();
    }

    // ── Stats tableau de bord ────────────────────────────────────────────────

    @GetMapping("/membre/stats")
    public ResponseEntity<MembreService.DashboardStats> getDashboardStats(Authentication auth) {
        return ResponseEntity.ok(membreService.getDashboardStats(currentUserId(auth)));
    }

    // ── Cotisations ──────────────────────────────────────────────────────────

    @GetMapping("/cotisations")
    public ResponseEntity<List<CotisationDto>> getMyCotisations(Authentication auth) {
        return ResponseEntity.ok(membreService.getMyCotisations(currentUserId(auth)));
    }

    // ── Dons ─────────────────────────────────────────────────────────────────

    @GetMapping("/dons")
    public ResponseEntity<List<DonDto>> getMyDons(Authentication auth) {
        return ResponseEntity.ok(membreService.getMyDons(currentUserId(auth)));
    }

    @PostMapping("/dons")
    public ResponseEntity<DonDto> submitDon(
            @RequestBody @Valid DonRequestDto request,
            Authentication auth) {
        return ResponseEntity.ok(membreService.submitDon(currentUserId(auth), request));
    }
}
