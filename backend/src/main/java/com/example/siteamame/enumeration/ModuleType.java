package com.example.siteamame.enumeration;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ModuleType {
    BOURSES("Bourses"),
    ACTUALITES("Actualités"),
    ORIENTATION("Orientation"),
    UTILISATEURS("Utilisateurs"),
    CONCOURS("Concours"),
    AUTRES("Autres");

    private final String label;
}