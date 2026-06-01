package com.example.siteamame.dto.partenaire;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PartenaireDto {
    private Long id;
    private String nom;
    private String type;
    private String description;
    private String siteWeb;
    private Integer ordre;
    private Boolean isActif;
    private String filePath;
}
