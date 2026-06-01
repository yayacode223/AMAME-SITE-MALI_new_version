package com.example.siteamame.dto.lienutile;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LienUtileDto {
    private Long id;
    private String titre;
    private String description;
    private String url;
    private String categorie;
    private Integer ordre;
    private Boolean isActif;
}
