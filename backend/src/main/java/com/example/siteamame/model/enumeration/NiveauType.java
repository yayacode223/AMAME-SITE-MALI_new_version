package com.example.siteamame.model.enumeration;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.validation.beanvalidation.SpringValidatorAdapter;
@AllArgsConstructor
@Getter
public enum NiveauType {
    BACHELIER("Bachelier(e)"),
    LICENCE("Licence"),
    MASTER("Master"),
    DOCTORAT("Doctorat");
    private final String label;
}

