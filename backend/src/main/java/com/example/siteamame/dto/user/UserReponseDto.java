package com.example.siteamame.dto.user;

import com.example.siteamame.enumeration.NiveauType;
import com.example.siteamame.enumeration.RoleType;
import com.example.siteamame.enumeration.SexeType;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;


@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserReponseDto {
    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private LocalDate birthDate;
    private String ville;
    @Enumerated(EnumType.STRING)
    private SexeType sexe;
    private String adresse;
    private String imagePath;
    private String phone;
    private String cvPath;
    @Enumerated(EnumType.STRING)
    private RoleType role;
    private String pays;
    @Enumerated(EnumType.STRING)
    private NiveauType niveauEtude;
    private Integer codePostal;
}
