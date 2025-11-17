package com.example.siteamame.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "bourse", uniqueConstraints = {
        @UniqueConstraint(columnNames = "url_source")
})
public class Bourse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "titre", length = 500, nullable = false)
    private String titre;

    @Column(name = "description_courte", columnDefinition = "TEXT")
    private String descriptionCourte;

    @Column(name = "description_longue", columnDefinition = "TEXT")
    private String descriptionLongue;

    @Column(name = "bailleur", length = 300)
    private String bailleur;

    @Column(name = "nombres_vues")
    private Integer nombresVues = 0;

    @Column(name = "pays_hote", length = 100)
    private String paysHote;

    @Column(name = "niveau", length = 200)
    private String niveau;

    @Column(name = "financement", length = 200)
    private String financement;

    @Column(name = "organisation", length = 300)
    private String organisation;

    @Column(name = "financement_statut", length = 100)
    private String financementStatut;

    @Column(name = "date_limite")
    private LocalDate dateLimite;

    @Column(name = "pays_eligible", columnDefinition = "TEXT")
    private String paysEligible;

    @Column(name = "region_eligible", columnDefinition = "TEXT")
    private String regionEligible;

    @Column(name = "lien_site_officiel", length = 500)
    private String lienSiteOfficiel;

    @Column(name = "url_source", length = 500, unique = true)
    private String urlSource;

    @Column(name = "categorie", length = 200)
    private String categorie;

    @Column(name = "date_scraping")
    private LocalDateTime dateScraping = LocalDateTime.now();

    @Column(name = "date_publication")
    private LocalDate datePublication;

    @OneToOne(cascade = CascadeType.ALL)
    private File file;
}