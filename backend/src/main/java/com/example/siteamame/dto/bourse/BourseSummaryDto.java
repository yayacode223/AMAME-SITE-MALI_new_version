package com.example.siteamame.dto.bourse;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class BourseSummaryDto {
    private Long id;
    private String titre;
    private String descriptionCourte;
    private String bailleur;
    private String paysHote;
    private String niveau;
    private String categorie;
    private String financementStatut;
    private String organisation;
    private LocalDate dateLimite;
}
