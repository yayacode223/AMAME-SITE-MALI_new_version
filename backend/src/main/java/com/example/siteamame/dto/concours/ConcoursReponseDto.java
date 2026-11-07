package com.example.siteamame.dto.concours;

import com.example.siteamame.enumeration.NiveauType;
import com.example.siteamame.enumeration.StatusType;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

@Setter
@Getter
@NoArgsConstructor
public class ConcoursReponseDto {
    private Long id;
    private String nom;
    private String description;
    private String pays;
    private NiveauType niveau;// exemple : Licence, Master
    private StatusType status;
    private boolean isAvalable;
    private LocalDateTime dateOuverture;
    private LocalDateTime dateLimite;
    private String lienOfficiel;
    private String filePath;
    /** URL d'affichage, calculée par le backend à partir de la clé : à utiliser à la place de filePath. */
    private String fileUrl;

    /** Constructeur des requêtes JPQL de ConcoursRepository : fileUrl est calculé ensuite, hors de la base. */
    public ConcoursReponseDto(Long id, String nom, String description, String pays, NiveauType niveau,
                              StatusType status, boolean isAvalable, LocalDateTime dateOuverture,
                              LocalDateTime dateLimite, String lienOfficiel, String filePath) {
        this.id = id;
        this.nom = nom;
        this.description = description;
        this.pays = pays;
        this.niveau = niveau;
        this.status = status;
        this.isAvalable = isAvalable;
        this.dateOuverture = dateOuverture;
        this.dateLimite = dateLimite;
        this.lienOfficiel = lienOfficiel;
        this.filePath = filePath;
    }
}
