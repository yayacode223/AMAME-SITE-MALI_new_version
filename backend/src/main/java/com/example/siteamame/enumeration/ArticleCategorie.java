package com.example.siteamame.enumeration;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ArticleCategorie {
    CONSEILS("Conseils"),
    ORIENTATION("Orientation"),
    BOURSES("Bourses"),
    CONCOURS("Concours"),
    TEMOIGNAGES("Témoignages"),
    ACTUALITES("Actualités");

    private final String label;

}