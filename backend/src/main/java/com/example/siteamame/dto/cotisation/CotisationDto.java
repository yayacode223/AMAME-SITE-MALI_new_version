package com.example.siteamame.dto.cotisation;

import com.example.siteamame.enumeration.CotisationStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CotisationDto {
    private Long id;
    private Integer annee;
    private BigDecimal montant;
    private CotisationStatus status;
    private String statusLabel;
    private LocalDate datePaiement;
    private String referencePaiement;
    private String notes;
    private LocalDateTime createdAt;
}
