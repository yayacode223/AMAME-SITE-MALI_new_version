package com.example.siteamame.enumeration;

public enum ArticleCategorie {
    CONSEILS("Conseils"),
    ORIENTATION("Orientation"),
    BOURSES("Bourses"),
    CONCOURS("Concours"),
    TEMOIGNAGES("Témoignages"),
    ACTUALITES("Actualités");

    private final String label;

    ArticleCategorie(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}