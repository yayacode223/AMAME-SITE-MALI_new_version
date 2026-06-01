package com.example.siteamame.dto.ressource;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class RessourceAcademiqueDto {
    private Long id;
    private String titre;
    private String description;
    private String type;
    private String niveau;
    private Integer ordre;
    private Boolean isActif;
    private String filePath;
}
