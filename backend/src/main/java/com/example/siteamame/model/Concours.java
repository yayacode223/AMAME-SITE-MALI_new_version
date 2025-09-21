package com.example.siteamame.model;

import com.example.siteamame.model.enumeration.NiveauType;
import com.example.siteamame.model.enumeration.StatusType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@Table(name = "concours")
@Entity
@AllArgsConstructor
@NoArgsConstructor
public class Concours {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nom_concours")
    private String nom;

    @Column(name = "description_concours")
    private String description;

    @Column(name = "pays_concours")
    private String pays;

    @Column(name = "niveau_concours")
    @Enumerated(EnumType.STRING)
    private NiveauType niveau;// exemple : Licence, Master

    @Column(name = "status_concours")
    @Enumerated(EnumType.STRING)
    private StatusType status;

    @Column(name = "is_avalable_concours")
    private boolean isAvalable;

    @Column(name = "date_ouverture_concours")
    private LocalDateTime dateOuverture;

    @Column(name = "date_limite_concours")
    private LocalDateTime dateLimite;

    @Column(name = "lien_officile_concours")
    private String lienOfficiel;

    // Relation ManyToMany entre Concours et Filiere
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "concours_filiere",
            joinColumns = @JoinColumn(name = "concours_id"),
            inverseJoinColumns = @JoinColumn(name = "filiere_id")
    )
    private List<Filiere> filieres = new ArrayList<>();

}
