package com.example.siteamame.dto.etablissement;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class EtablissementRequestDto {

    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    private String typeEtablissement;
    private String lieu;
    private String urlDetailEtablissement;
    private String urlLogo;
    private String urlImage;
    private String sourceSite;
}
