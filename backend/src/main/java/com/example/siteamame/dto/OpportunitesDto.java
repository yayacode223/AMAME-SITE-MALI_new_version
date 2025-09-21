package com.example.siteamame.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@AllArgsConstructor
@Setter
@Getter
public class OpportunitesDto {

    private Long id;
    private String titre;
    private String description_complete; // On peut prendre la description courte ici si on en a une
    private String urlSource;
    private String urlPdf1;
    private String urlPdf2;
    private String sourceSite;
    private String paysOffrant;
    private String urlDrapeau;
    private Integer anneePertinence;
}