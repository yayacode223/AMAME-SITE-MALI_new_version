package com.example.siteamame.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.Date;

@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "opportunites") // Assurez-vous que le nom de la table est correct
public class Opportunites {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT") // PERMET DES TITRES LONGS
    private String titre;

    @Column(columnDefinition = "TEXT") // PERMET DES DESCRIPTIONS TRÈS LONGUES
    private String descriptionComplete;

    @Column(columnDefinition = "TEXT") // LES URL PEUVENT ÊTRE LONGUES
    private String urlSource;

    @Column(columnDefinition = "TEXT")
    private String urlPdf1;

    @Column(columnDefinition = "TEXT")
    private String urlPdf2;

    private String sourceSite;

    // Pour l'année, Integer est bien
    private Integer anneePertinence;

    private String paysOffrant;
    private String urlDrapeau;

    @Temporal(TemporalType.TIMESTAMP) // Spécifie que c'est une date + heure
    private Date dateScraping;

}