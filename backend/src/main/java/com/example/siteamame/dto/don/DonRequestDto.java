package com.example.siteamame.dto.don;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class DonRequestDto {

    @NotNull(message = "Le montant est obligatoire")
    @DecimalMin(value = "500.00", message = "Le don minimum est de 500 FCFA")
    private BigDecimal montant;

    private String message;
}
