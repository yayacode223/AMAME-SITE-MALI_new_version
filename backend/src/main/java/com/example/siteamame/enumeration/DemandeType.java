package com.example.siteamame.enumeration;

import lombok.Getter;

@Getter
public enum DemandeType {
    TRES_FORTE("Très forte"),
    FORTE("Forte"),
    MOYENNE("Moyenne"),
    CROISSANTE("Croissante"),
    VARIABLE("Variable");

    private final String label;

    DemandeType(String label) {
        this.label = label;
    }

}