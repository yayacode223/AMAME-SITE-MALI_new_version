package com.example.siteamame.dto.ressource;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class RessourceAcademiqueRequestDto {

    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    private String description;
    private String type;
    private String niveau;
    private Integer ordre;
    private Boolean isActif;
}
