package com.example.siteamame.model;

import com.example.siteamame.enumeration.NiveauType;
import com.example.siteamame.enumeration.StatusType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    private String nom;

    private String description;

    private String pays;

    @Enumerated(EnumType.STRING)
    private NiveauType niveau;// exemple : Licence, Master

    @Enumerated(EnumType.STRING)
    private StatusType status;

    private boolean isAvalable;

    private LocalDateTime dateOuverture;

    private LocalDateTime dateLimite;

    private String lienOfficiel;

    @OneToOne(cascade = CascadeType.ALL)
    private File file;
}
