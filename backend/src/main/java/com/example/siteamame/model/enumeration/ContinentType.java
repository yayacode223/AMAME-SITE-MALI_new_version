package com.example.siteamame.model.enumeration;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ContinentType {
    AFRIQUE("Afrique"),
    AMERIQUE("Amerique"),
    ASIE("Asie"),
    EUROPE("Europe"),
    OCEANIE("Oceanie");

    private final String label;
}
