package com.example.siteamame.dto.galerie;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GalerieDto {

    private Long id;
    private String titre;
    private String description;
    private String lieu;
    private LocalDate dateEvenement;
    private Boolean estPublie;
    private LocalDateTime dateCreation;
    private LocalDateTime dateModification;
    private String coverImagePath;
}
