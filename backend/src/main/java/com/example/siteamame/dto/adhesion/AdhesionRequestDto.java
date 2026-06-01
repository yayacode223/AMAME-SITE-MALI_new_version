package com.example.siteamame.dto.adhesion;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdhesionRequestDto {

    @NotBlank(message = "La motivation est obligatoire")
    @Size(min = 50, max = 2000, message = "La motivation doit contenir entre 50 et 2000 caractères")
    private String motivation;
}
