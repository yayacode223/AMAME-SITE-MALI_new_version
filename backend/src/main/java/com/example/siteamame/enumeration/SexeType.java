package com.example.siteamame.enumeration;


import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SexeType {
    HOMME("Homme"),
    FEMME("Femme");

    private final String label;
}
