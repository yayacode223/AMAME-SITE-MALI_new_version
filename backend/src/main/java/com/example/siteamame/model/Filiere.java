package com.example.siteamame.model;

import com.example.siteamame.enumeration.DomaineFiliereSerieType;
import com.example.siteamame.enumeration.DifficulteType;
import com.example.siteamame.enumeration.DemandeType;
import com.example.siteamame.enumeration.SalaireType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "filiere")
public class Filiere {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(length = 500)
    private String descriptionCourte;

    @Column(columnDefinition = "TEXT")
    private String descriptionLongue;

    @Enumerated(EnumType.STRING)
    private DomaineFiliereSerieType domaine;

    @Enumerated(EnumType.STRING)
    private DifficulteType difficulte;

    @Enumerated(EnumType.STRING)
    private DemandeType demande;

    @Enumerated(EnumType.STRING)
    private SalaireType salaire;
    private String dureeEtudes;
    private String tauxEmploi;
    private String salaireDebut;
    private String salaireExperience;

    @Column(columnDefinition = "TEXT")
    private String perspectives;

    // Collections
    @ElementCollection
    @CollectionTable(name = "filiere_debouches", joinColumns = @JoinColumn(name = "filiere_id"))
    private Set<String> debouches = new HashSet<>();

    @ElementCollection
    @CollectionTable(name = "filiere_competences", joinColumns = @JoinColumn(name = "filiere_id"))
    private Set<String> competences = new HashSet<>();

    @ElementCollection
    @CollectionTable(name = "filiere_universites", joinColumns = @JoinColumn(name = "filiere_id"))
    private Set<String> universites = new HashSet<>();

    @ElementCollection
    @CollectionTable(name = "filiere_prerequis", joinColumns = @JoinColumn(name = "filiere_id"))
    private Set<String> prerequis = new HashSet<>();

    @OneToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private File file;

}