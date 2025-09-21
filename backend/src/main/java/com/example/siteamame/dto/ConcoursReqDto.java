package com.example.siteamame.dto;

import com.example.siteamame.model.enumeration.NiveauType;
import com.example.siteamame.model.enumeration.StatusType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


import java.time.LocalDate;
import java.util.Set;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class ConcoursReqDto {

    private String nom;
    private String description;
    private String pays;
    private NiveauType niveau;
    private StatusType status;
    private boolean isAvalable;
    private LocalDate dateOuverture;
    private LocalDate dateLimite;
    private String lienOfficiel;

    private Set<Long> filieresId;
    private Set<Long> seriesId;

}
