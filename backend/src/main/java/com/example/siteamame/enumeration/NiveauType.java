package com.example.siteamame.enumeration;

import lombok.AllArgsConstructor;
import lombok.Getter;


@AllArgsConstructor
@Getter
public enum NiveauType {
    PRIMAIRE("Primaire"),
    SECONDAIRE("Secondaire"),
    LYCEE("Lycee"),
    BACHELIER("Bachelier(e)"),
    BAC_2("BTS, DUT, DEUG"),
    LICENCE("Licence"),
    MASTER("Master"),
    DOCTORAT("Doctorat"),
    AUTRE("Autre");

    private final String label;
}

