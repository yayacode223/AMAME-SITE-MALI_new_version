package com.example.siteamame.enumeration;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.validation.beanvalidation.SpringValidatorAdapter;
@AllArgsConstructor
@Getter
public enum NiveauType {
    BACHELIER("Bachelier(e)"),
    BAC_2("BTS, DUT"),
    LICENCE("Licence"),
    MASTER("Master"),
    DOCTORAT("Doctorat"),
    AUTRE("Autre");

    private final String label;
}

