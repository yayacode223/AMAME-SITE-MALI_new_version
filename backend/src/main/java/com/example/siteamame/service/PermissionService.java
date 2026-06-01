package com.example.siteamame.service;

import com.example.siteamame.enumeration.Permission;
import com.example.siteamame.enumeration.PermissionType;
import com.example.siteamame.enumeration.RoleType;
import com.example.siteamame.model.User;
import com.example.siteamame.model.UserPermission;
import com.example.siteamame.repository.UserPermissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class PermissionService {

    private final UserPermissionRepository userPermissionRepository;

    // ── Calcul des permissions effectives ───────────────────────────────────

    /**
     * Calcule les permissions effectives d'un utilisateur :
     *   permissionsParDéfautDuRôle + GRANTED individuelles - REVOKED individuelles
     */
    @Transactional(readOnly = true)
    public Set<Permission> getEffectivePermissions(User user) {
        // EnumSet.copyOf lève IllegalArgumentException sur un set vide → on sécurise
        Set<Permission> defaults = Permission.defaultPermissionsFor(user.getRole());
        Set<Permission> effective = defaults.isEmpty()
                ? EnumSet.noneOf(Permission.class)
                : EnumSet.copyOf(defaults);

        try {
            List<UserPermission> overrides = userPermissionRepository.findByUser(user);
            for (UserPermission override : overrides) {
                if (override.getType() == PermissionType.GRANTED) {
                    effective.add(override.getPermission());
                } else {
                    effective.remove(override.getPermission());
                }
            }
        } catch (Exception e) {
            // Garde-fou : si la table user_permission n'existe pas encore (migration en cours),
            // on retourne les permissions par défaut du rôle sans bloquer l'authentification.
            log.warn("Impossible de charger les overrides de permission pour l'utilisateur {} : {}",
                    user.getId(), e.getMessage());
        }
        return effective;
    }

    // ── Grant / Revoke ──────────────────────────────────────────────────────

    /**
     * Accorde une permission individuelle à un utilisateur.
     * Le granteur doit :
     *   1. Avoir lui-même la permission USER_GRANT_PERMISSIONS
     *   2. Avoir un rang de rôle strictement supérieur à celui du target
     *   3. Posséder lui-même la permission qu'il accorde
     */
    @Transactional
    public void grantPermission(User target, Permission permission, User grantedBy) {
        validateGrantorAuthority(grantedBy, target, permission);
        upsertOverride(target, permission, PermissionType.GRANTED, grantedBy);
    }

    /**
     * Révoque une permission individuelle d'un utilisateur.
     * Mêmes contraintes que grantPermission.
     */
    @Transactional
    public void revokePermission(User target, Permission permission, User revokedBy) {
        validateGrantorAuthority(revokedBy, target, permission);
        upsertOverride(target, permission, PermissionType.REVOKED, revokedBy);
    }

    /**
     * Supprime un override individuel, ramenant l'utilisateur aux permissions
     * par défaut de son rôle pour cette permission.
     */
    @Transactional
    public void removeOverride(User target, Permission permission, User removedBy) {
        validateGrantorAuthority(removedBy, target, permission);
        userPermissionRepository.deleteByUserAndPermission(target, permission);
    }

    // ── Changement de rôle ──────────────────────────────────────────────────

    /**
     * Change le rôle d'un utilisateur.
     * Le changer doit avoir USER_MANAGE_ROLES et un rang supérieur au target ET
     * au rôle cible.
     */
    @Transactional
    public void changeRole(User target, RoleType newRole, User changedBy) {
        Set<Permission> changerPerms = getEffectivePermissions(changedBy);
        if (!changerPerms.contains(Permission.USER_MANAGE_ROLES)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Permission USER_MANAGE_ROLES requise pour changer un rôle");
        }
        int changerRank = roleRank(changedBy.getRole());
        if (changerRank <= roleRank(target.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Impossible de modifier le rôle d'un utilisateur de rang supérieur ou égal");
        }
        if (changerRank <= roleRank(newRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Impossible d'attribuer un rôle supérieur ou égal au vôtre");
        }
        target.setRole(newRole);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private void upsertOverride(User target, Permission permission,
                                 PermissionType type, User actor) {
        UserPermission override = userPermissionRepository
                .findByUserAndPermission(target, permission)
                .orElseGet(UserPermission::new);

        override.setUser(target);
        override.setPermission(permission);
        override.setType(type);
        override.setGrantedBy(actor);
        override.setGrantedAt(LocalDateTime.now());
        userPermissionRepository.save(override);
    }

    private void validateGrantorAuthority(User grantor, User target, Permission permission) {
        Set<Permission> grantorPerms = getEffectivePermissions(grantor);
        if (!grantorPerms.contains(Permission.USER_GRANT_PERMISSIONS)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Permission USER_GRANT_PERMISSIONS requise");
        }
        if (roleRank(grantor.getRole()) <= roleRank(target.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Impossible d'agir sur un utilisateur de rang supérieur ou égal");
        }
        if (!grantorPerms.contains(permission)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous ne pouvez pas accorder une permission que vous ne possédez pas");
        }
    }

    /**
     * Rang numérique d'un rôle : plus le chiffre est élevé, plus le rôle est puissant.
     * Utilisé pour les comparaisons hiérarchiques.
     */
    public static int roleRank(RoleType role) {
        return switch (role) {
            case SUPERADMIN -> 6;
            case ADMIN      -> 5;
            case EDITOR     -> 4;
            case MEMBER     -> 3;
            case USER       -> 2;
            case VISITOR    -> 1;
        };
    }
}
