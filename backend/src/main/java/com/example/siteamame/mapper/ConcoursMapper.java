package com.example.siteamame.mapper;

import com.example.siteamame.dto.concours.ConcoursReponseDto;
import com.example.siteamame.model.Concours;
import com.example.siteamame.service.file.MediaUrlResolver;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

@AllArgsConstructor
@Getter
@Setter
@Component
public class ConcoursMapper {

    private final MediaUrlResolver mediaUrlResolver;

    public ConcoursReponseDto convertToDTO(Concours concours) {
        ConcoursReponseDto dto = new ConcoursReponseDto();
        dto.setId(concours.getId());
        dto.setNom(concours.getNom());
        dto.setDescription(concours.getDescription());
        dto.setNiveau(concours.getNiveau());
        dto.setPays(concours.getPays());
        dto.setAvalable(concours.isAvalable());
        dto.setStatus(concours.getStatus());
        dto.setDateLimite(concours.getDateLimite());
        dto.setDateOuverture(concours.getDateOuverture());
        dto.setLienOfficiel(concours.getLienOfficiel());
        // Le fichier d'un concours est facultatif
        if (concours.getFile() != null) {
            dto.setFilePath(concours.getFile().getFilePath());
            dto.setFileUrl(mediaUrlResolver.urlOf(concours.getFile()));
        }
        return dto;
    }

    /** Complète un DTO issu d'une requête JPQL, qui ne connaît que la clé du fichier. */
    public ConcoursReponseDto withFileUrl(ConcoursReponseDto dto) {
        dto.setFileUrl(mediaUrlResolver.publicUrl(dto.getFilePath()));
        return dto;
    }

    public Concours convertToEntity(ConcoursReponseDto dto) {
        Concours concours = new Concours();

        concours.setId(dto.getId());
        concours.setNom(dto.getNom());
        concours.setDescription(dto.getDescription());
        concours.setNiveau(dto.getNiveau());
        concours.setPays(dto.getPays());
        concours.setAvalable(dto.isAvalable());
        concours.setStatus(dto.getStatus());
        concours.setDateLimite(dto.getDateLimite());
        concours.setDateOuverture(dto.getDateOuverture());
        concours.setLienOfficiel(dto.getLienOfficiel());
        // La clé d'un fichier ne se modifie jamais : un remplacement crée un nouveau fichier.
        return concours;

    }

}
