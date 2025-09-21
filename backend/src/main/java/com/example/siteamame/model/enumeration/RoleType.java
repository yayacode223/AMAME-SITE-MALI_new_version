package com.example.siteamame.model.enumeration;


import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum RoleType {
    ADMIN("Admin"),
    EDITOR("Editor"),
    MEMBER("Member"),
    USER("User");

    private final String label;
}
