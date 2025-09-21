package com.example.siteamame.security;


import com.example.siteamame.model.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;


import java.util.Collection;


import java.util.stream.Collectors;

public class CustomUserDetails implements UserDetails {

    private final User user;

    public CustomUserDetails(User user) {
        this.user = user;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return null;
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public String getUsername() {
        return user.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true; // selon ton besoin
    }

    @Override
    public boolean isAccountNonLocked() {
        return true; // selon ton besoin
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true; // selon ton besoin
    }

    @Override
    public boolean isEnabled() {
        return true; // selon ton besoin
    }
}

