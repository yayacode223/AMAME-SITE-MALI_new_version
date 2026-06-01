package com.example.siteamame.dto.lienutile;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LienUtileRequestDto {

    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    private String description;

    @NotBlank(message = "L'URL est obligatoire")
    private String url;

    private String categorie;
    private Integer ordre;
    private Boolean isActif;
}
