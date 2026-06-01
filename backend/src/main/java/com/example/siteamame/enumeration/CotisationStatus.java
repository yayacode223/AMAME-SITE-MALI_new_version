package com.example.siteamame.enumeration;

public enum CotisationStatus {
    PENDING("En attente"),
    PAID("Payée"),
    OVERDUE("En retard");

    private final String label;

    CotisationStatus(String label) { this.label = label; }

    public String getLabel() { return label; }
}
