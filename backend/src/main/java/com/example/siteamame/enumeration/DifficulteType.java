package com.example.siteamame.enumeration;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DifficulteType {
    TRES_ELEVEE("Très élevée"),
    ELEVEE("Élevée"),
    MOYENNE("Moyenne"),
    VARIABLE("Variable");

    private final String label;

}