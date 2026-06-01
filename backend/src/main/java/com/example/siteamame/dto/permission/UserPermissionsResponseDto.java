package com.example.siteamame.dto.permission;

import com.example.siteamame.enumeration.Permission;
import com.example.siteamame.enumeration.RoleType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserPermissionsResponseDto {

    private Long userId;
    private RoleType role;

    /** Permissions accordées par le rôle (avant overrides). */
    private Set<Permission> defaultPermissions;

    /** Overrides individuels accordés (au-delà du rôle). */
    private Set<Permission> grantedPermissions;

    /** Overrides individuels révoqués (retirés du rôle). */
    private Set<Permission> revokedPermissions;

    /** Résultat final = defaultPermissions + grantedPermissions − revokedPermissions. */
    private Set<Permission> effectivePermissions;
}
