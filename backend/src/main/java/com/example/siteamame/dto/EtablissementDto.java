package com.example.siteamame.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@AllArgsConstructor
@Setter
@Getter
public class EtablissementDto {
    private Long id;
    private String nom;
    private String typeEtablissement;
    private String lieu;
    private String urlDetailEtablissement;
    private String urlLogo;
    private String url_image; 
}
