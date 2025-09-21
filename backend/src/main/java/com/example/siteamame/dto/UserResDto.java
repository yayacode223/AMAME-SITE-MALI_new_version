package com.example.siteamame.dto;

import com.example.siteamame.model.enumeration.RoleType;
import com.example.siteamame.model.enumeration.SexeType;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;


@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserResDto {
    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String etablissement;
    private String filiere_serie;
    private LocalDate birthDate;
    private String ville;
    @Enumerated(EnumType.STRING)
    private SexeType sexe;
    private String adresse;
    private String imagePath;
    private String phone;
    private String cvPath;
    private RoleType role;
    private String pays;
    private String niveauEtude;
    private Integer codePostal;
}
