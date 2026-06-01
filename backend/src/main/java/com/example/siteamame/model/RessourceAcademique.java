package com.example.siteamame.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "ressource_academique")
public class RessourceAcademique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 300)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 100)
    private String type;

    @Column(length = 100)
    private String niveau;

    @Column(name = "ordre")
    private Integer ordre = 0;

    @Column(name = "is_actif")
    private Boolean isActif = true;

    @OneToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private File file;
}
