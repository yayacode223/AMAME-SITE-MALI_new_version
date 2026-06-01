package com.example.siteamame.dto.user;

import com.example.siteamame.enumeration.NiveauType;
import com.example.siteamame.enumeration.SexeType;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class UpdateProfileRequest {

    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    private String prenom;

    private String phone;
    private String ville;
    private String adresse;
    private String pays;
    private LocalDate birthDate;
    private SexeType sexe;
    private NiveauType niveauEtude;
    private Integer codePostal;
}
