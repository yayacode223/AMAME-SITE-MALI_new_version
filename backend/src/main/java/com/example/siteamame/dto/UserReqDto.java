package com.example.siteamame.dto;


import com.example.siteamame.model.enumeration.SexeType;
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
public class UserReqDto {
    @NotBlank(message = "Veillez mettre votre nom")
    private String nom;
    @NotBlank(message = "Veillez mettre votre prenom")
    private String prenom;
    @Email(message = "Veuillez mettre votre email")
    private String email;
    @Size(min = 8, message = "Le mot de pass doit etre au minimun 8 carateres")
    @NotBlank(message = "Ce champ ne peut pas etre vide")
    private String password;
    private String etablissement;
    private Long  filiereId;
    private LocalDate birthDate;
    @NotBlank(message = "Ce champ doit etre rempli")
    private String ville;
    private SexeType sexe; //HOMME OU FEMME
    private String adresse;
    private String phone; // numero de telephone
    private String pays;
    private String niveauEtude;
    private Integer codePostal;
}
