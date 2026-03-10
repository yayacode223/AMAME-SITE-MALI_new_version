package com.example.siteamame.dto.filiere;

import com.example.siteamame.enumeration.DemandeType;
import com.example.siteamame.enumeration.DifficulteType;
import com.example.siteamame.enumeration.DomaineFiliereSerieType;
import com.example.siteamame.enumeration.SalaireType;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Set;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class FiliereRequestDto {
    @NotBlank(message = "Le nom doit etre renseigne")
    private String nom;
    private String descriptionCourte;
    private String descriptionLongue;
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
