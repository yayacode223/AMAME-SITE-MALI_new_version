package com.example.siteamame.dto.partenaire;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PartenaireRequestDto {

    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    private String type;
    private String description;
    private String siteWeb;
    private Integer ordre;
    private Boolean isActif;
}
