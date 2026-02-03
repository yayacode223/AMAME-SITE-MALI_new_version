package com.example.siteamame.enumeration;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DemandeType {
    TRES_FORTE("Très forte"),
    FORTE("Forte"),
    MOYENNE("Moyenne"),
    CROISSANTE("Croissante"),
    VARIABLE("Variable");

    private final String label;

}