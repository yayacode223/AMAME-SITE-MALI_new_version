package com.example.siteamame.mapper;

import com.example.siteamame.dto.filiere.FiliereDto;
import com.example.siteamame.dto.filiere.FiliereSummaryDto;
import com.example.siteamame.model.Filiere;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@AllArgsConstructor
@Component
public class FiliereMapper {

    // Méthodes de conversion
    public FiliereSummaryDto convertToSummaryDTO(Filiere filiere) {
        String filePath = filiere.getFile()!= null
                ? filiere.getFile().getFilePath()
                : null;
        return new FiliereSummaryDto(
                filiere.getId(),
                filiere.getNom(),
                filiere.getDescriptionCourte(),
                filePath,
                filiere.getDomaine(),
                filiere.getDifficulte(),
                filiere.getDemande(),
                filiere.getSalaire(),
                filiere.getDureeEtudes(),
                filiere.getDebouches().stream().limit(3).collect(Collectors.toList()) // Only first 3 for summary
        );
    }

    public FiliereDto convertToDTO(Filiere filiere) {
        String filePath = filiere.getFile()!= null
                ? filiere.getFile().getFilePath()
                : null;
        return new FiliereDto(
                filiere.getId(),
                filiere.getNom(),
                filiere.getDescriptionCourte(),
                filiere.getDescriptionLongue(),
                filePath,
                filiere.getDomaine(),
                filiere.getDifficulte(),
                filiere.getDemande(),
                filiere.getSalaire(),
                filiere.getDureeEtudes(),
                filiere.getTauxEmploi(),
                filiere.getSalaireDebut(),
                filiere.getSalaireExperience(),
                filiere.getPerspectives(),
                filiere.getDebouches(),
                filiere.getCompetences(),
                filiere.getUniversites(),
                filiere.getPrerequis()
        );
    }
}
