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
@Table(name = "membre")
public class Membre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String prenom;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(nullable = false, length = 200)
    private String poste;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(length = 200)
    private String email;

    @Column(name = "ordre")
    private Integer ordre = 0;

    @Column(name = "is_actif")
    private Boolean isActif = true;

    @OneToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private File file;
}
