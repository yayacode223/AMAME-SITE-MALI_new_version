package com.example.siteamame.dto.bourse;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class BourseDetailDto {
    private Long id;
    private String titre;
    private String descriptionCourte;
    private String descriptionLongue;
    private String bailleur;
    private Integer nombresVues;
    private String paysHote;
    private String niveau;
    private String financement;
    private String organisation;
    private String financementStatut;
    private LocalDate dateLimite;
    private String paysEligible;
    private String regionEligible;
    private String lienSiteOfficiel;
    private String urlSource;
    private String categorie;
    private LocalDateTime dateScraping = LocalDateTime.now();
    private LocalDate datePublication;
}
