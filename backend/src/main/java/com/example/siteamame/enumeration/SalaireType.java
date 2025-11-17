package com.example.siteamame.enumeration;

import lombok.Getter;

@Getter
public enum SalaireType {
    TRES_ELEVE("Très élevé"),
    ELEVE("Élevé"),
    MOYEN_ELEVE("Moyen à élevé"),
    MOYEN("Moyen"),
    VARIABLE("Variable");

    private final String label;

    SalaireType(String label) {
        this.label = label;
    }

}