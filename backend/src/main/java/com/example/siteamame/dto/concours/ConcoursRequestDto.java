package com.example.siteamame.dto.concours;

import com.example.siteamame.enumeration.NiveauType;
import com.example.siteamame.enumeration.StatusType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;



import java.time.LocalDateTime;


@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class ConcoursRequestDto {

    private String nom;
    private String description;
    private String pays;
    private NiveauType niveau;
    private StatusType status;
    private LocalDateTime dateOuverture;
    private LocalDateTime dateLimite;
    private String lienOfficiel;
}
