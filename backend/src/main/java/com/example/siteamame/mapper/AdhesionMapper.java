package com.example.siteamame.mapper;

import com.example.siteamame.dto.adhesion.AdhesionDto;
import com.example.siteamame.model.Adhesion;
import org.springframework.stereotype.Component;

@Component
public class AdhesionMapper {

    public AdhesionDto toDto(Adhesion adhesion) {
        AdhesionDto dto = new AdhesionDto();
        dto.setId(adhesion.getId());
        dto.setUserId(adhesion.getUser().getId());
        dto.setUserNom(adhesion.getUser().getNom());
        dto.setUserPrenom(adhesion.getUser().getPrenom());
        dto.setUserEmail(adhesion.getUser().getEmail());
        dto.setMotivation(adhesion.getMotivation());
        dto.setStatus(adhesion.getStatus());
        dto.setRejectionReason(adhesion.getRejectionReason());
        dto.setCreatedAt(adhesion.getCreatedAt());
        dto.setUpdatedAt(adhesion.getUpdatedAt());
        dto.setAdhesionDate(adhesion.getAdhesionDate());
        return dto;
    }
}
