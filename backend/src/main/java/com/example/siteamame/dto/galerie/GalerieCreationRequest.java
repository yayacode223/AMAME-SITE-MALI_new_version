package com.example.siteamame.dto.galerie;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GalerieCreationRequest {

    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    private String description;

    private String lieu;

    private LocalDate dateEvenement;
}
