package com.example.siteamame.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;
@AllArgsConstructor
@Setter
@Getter
@Entity
@Table(name = "etablissements")

public class Etablissement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String nom;

    private String typeEtablissement;
    private String lieu;

    @Column(columnDefinition = "TEXT", unique = true)
    private String urlDetailEtablissement;

    @Column(columnDefinition = "TEXT")
    private String urlLogo;
    
    @Column(columnDefinition = "TEXT")
    private String urlImage;

    private String sourceSite;

    @Temporal(TemporalType.TIMESTAMP)
    private Date dateScraping;
}