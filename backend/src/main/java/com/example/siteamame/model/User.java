package com.example.siteamame.model;

import com.example.siteamame.enumeration.NiveauType;
import com.example.siteamame.enumeration.RoleType;
import com.example.siteamame.enumeration.SexeType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;


@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name="users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nom;
    private String prenom;
    @Column(name = "email")
    @NotBlank(message = "Email Obligatoire")
    private String email;
    private String password;
    private LocalDate birthDate;
    private String ville;
    @Enumerated(EnumType.STRING)
    private SexeType sexe;
    private String adresse;
    private String phone;
    private String pays;
    private Integer codePostal;
    @Enumerated(EnumType.STRING)
    private NiveauType niveauEtude;
    @Enumerated(EnumType.STRING)
    private RoleType role;

    @OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<File> files = new ArrayList<>();

}

