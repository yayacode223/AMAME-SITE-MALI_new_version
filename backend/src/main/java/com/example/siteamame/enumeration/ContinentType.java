package com.example.siteamame.enumeration;


import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ContinentType {
    AFRIQUE("Afrique"),
    AMERIQUE("Amerique"),
    ASIE("Asie"),
    EUROPE("Europe"),
    OCEANIE("Oceanie");

    private final String label;
}
