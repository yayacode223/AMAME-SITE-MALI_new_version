package com.example.siteamame.security;

import com.example.siteamame.enumeration.Permission;
import com.example.siteamame.model.User;
import lombok.AllArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Set;

@AllArgsConstructor
public class CustomUserDetails implements UserDetails {

    private final User user;

    /**
     * Permissions effectives calculées par PermissionService.
     * Pré-calculées à la construction pour éviter des appels DB répétés.
     */
    private final Set<Permission> permissions;

    /**
     * Expose une GrantedAuthority par rôle (ROLE_X) ET par permission (nom de l'enum).
     * Spring Security utilise ces authorities pour @PreAuthorize("hasAuthority(...)").
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
        permissions.forEach(p -> authorities.add(new SimpleGrantedAuthority(p.name())));
        return authorities;
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public String getUsername() {
        return user.getEmail();
    }

    /** Expose l'entité User pour les controllers qui en ont besoin. */
    public User getUser() {
        return user;
    }
}
