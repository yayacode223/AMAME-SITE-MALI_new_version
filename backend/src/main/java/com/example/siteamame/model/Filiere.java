package com.example.siteamame.model;

import com.example.siteamame.model.enumeration.DomaineFiliereSerieType;
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

    @Column(name = "nom_filiere")
    private String nom;

    @Column(name = "description_filiere")
    private String description;

    @Column(name = "domaine_filiere")
    @Enumerated(EnumType.STRING)
    private DomaineFiliereSerieType domaine;

    @Column(name = "etablissement_filiere")
    private String etablissement;

    @ElementCollection
    private List<String> modules = new ArrayList<>();

    @ManyToMany(mappedBy = "filieres", cascade = CascadeType.ALL)
    private List<Concours> concours = new ArrayList<>();

    @OneToMany(mappedBy = "filiere")
    private List<User> users = new ArrayList<>();
    
}
