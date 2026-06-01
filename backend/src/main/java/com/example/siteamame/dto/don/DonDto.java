package com.example.siteamame.dto.don;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DonDto {
    private Long id;
    private BigDecimal montant;
    private String message;
    private LocalDateTime dateDon;
}
