package com.example.siteamame.dto.bourse;

import lombok.Data;
import java.time.LocalDate;

@Data
public class BourseCreationRequest {
    private String titre;
    private String descriptionCourte;
    private String descriptionLongue;
    private String bailleur;
    private String paysHote;
    private String niveau;
    private String categorie;
    private String financementStatut;
    private String organisation;
    private LocalDate dateLimite;
    private String financement;
    private String paysEligible;
    private String regionEligible;
    private String lienSiteOfficiel;
    private String urlSource;
}