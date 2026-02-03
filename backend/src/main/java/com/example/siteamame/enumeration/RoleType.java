package com.example.siteamame.enumeration;


import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RoleType {
    ADMIN("Administrateur"),
    EDITOR("Editeur"),
    MEMBER("Membre"),
    USER("Utilisateur");

    private final String label;
}
