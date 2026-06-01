package com.example.siteamame.service.user;

import com.example.siteamame.enumeration.Permission;
import com.example.siteamame.model.User;
import com.example.siteamame.repository.UserRepository;
import com.example.siteamame.security.CustomUserDetails;
import com.example.siteamame.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@RequiredArgsConstructor
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PermissionService permissionService;

    /**
     * Chargé par JwtFilter à chaque requête authentifiée.
     * Calcule les permissions effectives (défaut rôle + overrides DB)
     * et les injecte dans CustomUserDetails.
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Utilisateur introuvable : " + email));
        Set<Permission> permissions = permissionService.getEffectivePermissions(user);
        return new CustomUserDetails(user, permissions);
    }
}
