package com.example.siteamame.dto.membre;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class MembreDto {
    private Long id;
    private String prenom;
    private String nom;
    private String poste;
    private String bio;
    private String email;
    private Integer ordre;
    private Boolean isActif;
    private String filePath;
}
