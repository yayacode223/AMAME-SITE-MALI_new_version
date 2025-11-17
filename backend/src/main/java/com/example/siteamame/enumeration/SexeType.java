package com.example.siteamame.enumeration;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum SexeType {
    HOMME("Homme"),
    FEMME("Femme");

    private final String label;
}
