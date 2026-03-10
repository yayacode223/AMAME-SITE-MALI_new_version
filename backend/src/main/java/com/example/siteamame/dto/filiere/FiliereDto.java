package com.example.siteamame.dto.filiere;

import com.example.siteamame.enumeration.DemandeType;
import com.example.siteamame.enumeration.DifficulteType;
import com.example.siteamame.enumeration.DomaineFiliereSerieType;
import com.example.siteamame.enumeration.SalaireType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FiliereDto {
    private Long id;
    private String nom;
    private String descriptionCourte;
    private String descriptionLongue;
    private String filePath;
    private DomaineFiliereSerieType domaine;
    private DifficulteType difficulte;
    private DemandeType demande;
    private SalaireType salaire;
    private String dureeEtudes;
    private String tauxEmploi;
    private String salaireDebut;
    private String salaireExperience;
    private String perspectives;
    private Set<String> debouches;
    private Set<String> competences;
    private Set<String> universites;
    private Set<String> prerequis;
}