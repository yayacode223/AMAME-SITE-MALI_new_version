package com.example.siteamame.controller;

import com.example.siteamame.dto.permission.PermissionGrantRequestDto;
import com.example.siteamame.dto.permission.RoleChangeRequestDto;
import com.example.siteamame.dto.permission.UserPermissionsResponseDto;
import com.example.siteamame.enumeration.Permission;
import com.example.siteamame.enumeration.PermissionType;
import com.example.siteamame.enumeration.RoleType;
import com.example.siteamame.model.User;
import com.example.siteamame.model.UserPermission;
import com.example.siteamame.repository.UserPermissionRepository;
import com.example.siteamame.repository.UserRepository;
import com.example.siteamame.security.CustomUserDetails;
import com.example.siteamame.service.PermissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.Arrays;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService permissionService;
    private final UserPermissionRepository userPermissionRepository;
    private final UserRepository userRepository;

    // ── Référentiel des permissions ─────────────────────────────────────────

    /** Liste toutes les permissions disponibles dans l'application. */
    @GetMapping("/permissions")
    @PreAuthorize("hasAuthority('USER_READ_ALL')")
    public ResponseEntity<List<Map<String, String>>> getAllPermissions() {
        List<Map<String, String>> permissions = Arrays.stream(Permission.values())
                .map(p -> Map.of("name", p.name(), "label", p.getLabel()))
                .toList();
        return ResponseEntity.ok(permissions);
    }

    /** Retourne les permissions par défaut d'un rôle donné. */
    @GetMapping("/permissions/role/{role}")
    @PreAuthorize("hasAuthority('USER_READ_ALL')")
    public ResponseEntity<Set<Permission>> getDefaultPermissionsForRole(@PathVariable RoleType role) {
        return ResponseEntity.ok(Permission.defaultPermissionsFor(role));
    }

    // ── Gestion des permissions d'un utilisateur ────────────────────────────

    /** Détail complet des permissions d'un utilisateur (défaut + overrides + effectif). */
    @Transactional(readOnly = true)
    @GetMapping("/users/{id}/permissions")
    @PreAuthorize("hasAuthority('USER_READ_ALL')")
    public ResponseEntity<UserPermissionsResponseDto> getUserPermissions(@PathVariable Long id) {
        User target = findUserOrThrow(id);

        Set<Permission> defaults = Permission.defaultPermissionsFor(target.getRole());
        List<UserPermission> overrides = userPermissionRepository.findByUser(target);

        Set<Permission> granted = overrides.stream()
                .filter(o -> o.getType() == PermissionType.GRANTED)
                .map(UserPermission::getPermission)
                .collect(Collectors.toCollection(() -> EnumSet.noneOf(Permission.class)));

        Set<Permission> revoked = overrides.stream()
                .filter(o -> o.getType() == PermissionType.REVOKED)
                .map(UserPermission::getPermission)
                .collect(Collectors.toCollection(() -> EnumSet.noneOf(Permission.class)));

        Set<Permission> effective = permissionService.getEffectivePermissions(target);

        return ResponseEntity.ok(new UserPermissionsResponseDto(
                id, target.getRole(), defaults, granted, revoked, effective
        ));
    }

    /** Accorde une permission individuelle à un utilisateur. */
    @Transactional
    @PostMapping("/users/{id}/permissions/grant")
    @PreAuthorize("hasAuthority('USER_GRANT_PERMISSIONS')")
    public ResponseEntity<Void> grantPermission(
            @PathVariable Long id,
            @RequestBody @Valid PermissionGrantRequestDto request,
            Authentication authentication) {

        User target = findUserOrThrow(id);
        User grantor = getAuthenticatedUser(authentication);
        permissionService.grantPermission(target, request.getPermission(), grantor);
        return ResponseEntity.ok().build();
    }

    /** Révoque une permission individuelle d'un utilisateur. */
    @Transactional
    @PostMapping("/users/{id}/permissions/revoke")
    @PreAuthorize("hasAuthority('USER_GRANT_PERMISSIONS')")
    public ResponseEntity<Void> revokePermission(
            @PathVariable Long id,
            @RequestBody @Valid PermissionGrantRequestDto request,
            Authentication authentication) {

        User target = findUserOrThrow(id);
        User revoker = getAuthenticatedUser(authentication);
        permissionService.revokePermission(target, request.getPermission(), revoker);
        return ResponseEntity.ok().build();
    }

    /** Supprime un override individuel (retour aux permissions par défaut du rôle). */
    @Transactional
    @DeleteMapping("/users/{id}/permissions/{permission}")
    @PreAuthorize("hasAuthority('USER_GRANT_PERMISSIONS')")
    public ResponseEntity<Void> removeOverride(
            @PathVariable Long id,
            @PathVariable Permission permission,
            Authentication authentication) {

        User target = findUserOrThrow(id);
        User actor = getAuthenticatedUser(authentication);
        permissionService.removeOverride(target, permission, actor);
        return ResponseEntity.noContent().build();
    }

    // ── Changement de rôle ──────────────────────────────────────────────────

    /** Change le rôle d'un utilisateur. */
    @Transactional
    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasAuthority('USER_MANAGE_ROLES')")
    public ResponseEntity<Void> changeRole(
            @PathVariable Long id,
            @RequestBody @Valid RoleChangeRequestDto request,
            Authentication authentication) {

        User target = findUserOrThrow(id);
        User changer = getAuthenticatedUser(authentication);
        permissionService.changeRole(target, request.getRole(), changer);
        userRepository.save(target);
        return ResponseEntity.ok().build();
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private User findUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
    }

    private User getAuthenticatedUser(Authentication authentication) {
        CustomUserDetails details = (CustomUserDetails) authentication.getPrincipal();
        return userRepository.findByEmailIgnoreCase(details.getUsername())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Utilisateur authentifié introuvable"));
    }
}
