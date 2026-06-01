package com.example.siteamame.enumeration;


import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RoleType {
    SUPERADMIN("Super Admin"),
    ADMIN("Administrateur"),
    EDITOR("Editeur"),
    MEMBER("Membre"),
    USER("Utilisateur"),
    VISITOR("Visiteur"); 

    private final String label;
}
