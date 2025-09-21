package com.example.siteamame.model;

import com.example.siteamame.model.enumeration.NiveauType;
import com.example.siteamame.model.enumeration.StatusType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;


import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table
@AllArgsConstructor
public class Bourse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "titre_bourse")
    private String titre;
    @Column(name = "description_bourse")
    private String description;
    @Column(name = "pays_bourse")
    private String pays;
    @Column(name = "niveau_bourse")
    @Enumerated(EnumType.STRING)
    private NiveauType niveau;// exemple : Licence, Master, Doctorat
    @Column(name = "status_bourse")
    @Enumerated(EnumType.STRING)
    private StatusType status;
    @Column(name = "is_avalable_bourse")
    private boolean isAvalable;
    @Column(name = "date_limite_bourse")
    private LocalDateTime dateLimite;
    @Column(name = "lien_officiel_bourse")
    private String lienOfficiel;
}
