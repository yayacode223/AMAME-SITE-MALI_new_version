package com.example.siteamame.mapper;

import com.example.siteamame.dto.adhesion.AdhesionDto;
import com.example.siteamame.model.Adhesion;
import org.springframework.stereotype.Component;

@Component
public class AdhesionMapper {

    /** Libellé affiché à la place du nom quand le compte lié a été supprimé (migration V4). */
    static final String DELETED_ACCOUNT_LABEL = "(compte supprimé)";

    public AdhesionDto toDto(Adhesion adhesion) {
        AdhesionDto dto = new AdhesionDto();
        dto.setId(adhesion.getId());
        if (adhesion.getUser() != null) {
            dto.setUserId(adhesion.getUser().getId());
            dto.setUserNom(adhesion.getUser().getNom());
            dto.setUserPrenom(adhesion.getUser().getPrenom());
            dto.setUserEmail(adhesion.getUser().getEmail());
        } else {
            // Compte supprimé : l'adhésion reste dans l'historique, détachée. Chaînes vides plutôt
            // que null, pour que l'écran d'administration n'affiche pas « null ».
            dto.setUserNom(DELETED_ACCOUNT_LABEL);
            dto.setUserPrenom("");
            dto.setUserEmail("");
        }
        dto.setMotivation(adhesion.getMotivation());
        dto.setStatus(adhesion.getStatus());
        dto.setRejectionReason(adhesion.getRejectionReason());
        dto.setCreatedAt(adhesion.getCreatedAt());
        dto.setUpdatedAt(adhesion.getUpdatedAt());
        dto.setAdhesionDate(adhesion.getAdhesionDate());
        return dto;
    }
}
