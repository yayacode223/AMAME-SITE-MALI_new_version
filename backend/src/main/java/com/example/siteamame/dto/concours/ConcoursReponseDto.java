package com.example.siteamame.dto.concours;

import com.example.siteamame.enumeration.NiveauType;
import com.example.siteamame.enumeration.StatusType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

@Setter
@Getter
@AllArgsConstructor
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

}
