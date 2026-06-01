package com.example.siteamame.enumeration;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AdhesionStatus {
    PENDING("En attente"),
    APPROVED("Approuvée"),
    REJECTED("Rejetée");

    private final String label;
}
