package com.example.siteamame.dto.adhesion;

import com.example.siteamame.enumeration.AdhesionStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdhesionDto {
    private Long id;
    private Long userId;
    private String userNom;
    private String userPrenom;
    private String userEmail;
    private String motivation;
    private AdhesionStatus status;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDate adhesionDate;
}
