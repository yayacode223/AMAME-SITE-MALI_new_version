package com.example.siteamame.dto.user;


import com.example.siteamame.enumeration.NiveauType;
import com.example.siteamame.enumeration.RoleType;
import com.example.siteamame.enumeration.SexeType;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserRequestDto {
    @NotBlank(message = "Veillez mettre votre nom")
    private String nom;
    @NotBlank(message = "Veillez mettre votre prenom")
    private String prenom;
    @Email(message = "Veuillez mettre votre email")
    private String email;
    private String password;
    private LocalDate birthDate;
    private String ville;
    @Enumerated(EnumType.STRING)
    private SexeType sexe;
    @Enumerated(EnumType.STRING)
    private RoleType role;
    private String adresse;
    private String phone;
    private String pays;
    @Enumerated(EnumType.STRING)
    private NiveauType niveauEtude;
    private Integer codePostal;
}
