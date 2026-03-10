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
public class FiliereSummaryDto {
    private Long id;
    private String nom;
    private String descriptionCourte;
    private String filePath;
    private DomaineFiliereSerieType domaine;
    private DifficulteType difficulte;
    private DemandeType demande;
    private SalaireType salaire;
    private String dureeEtudes;
    private Set<String> debouches;
}