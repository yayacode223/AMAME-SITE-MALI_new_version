package com.example.siteamame.mapper;

import com.example.siteamame.dto.concours.ConcoursReponseDto;
import com.example.siteamame.model.Concours;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

@AllArgsConstructor
@Getter
@Setter
@Component
public class ConcoursMapper {

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
        dto.setFilePath(concours.getFile().getFilePath());
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
        if(concours.getFile()!=null && concours.getFile().getFilePath()!=null) {
            concours.getFile().setFilePath(dto.getFilePath());
        }
        return concours;

    }

}
