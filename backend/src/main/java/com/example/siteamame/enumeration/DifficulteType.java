package com.example.siteamame.enumeration;

import lombok.Getter;

@Getter
public enum DifficulteType {
    TRES_ELEVEE("Très élevée"),
    ELEVEE("Élevée"),
    MOYENNE("Moyenne"),
    VARIABLE("Variable");

    private final String label;

    DifficulteType(String label) {
        this.label = label;
    }

}