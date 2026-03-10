package com.example.siteamame.mapper;

import com.example.siteamame.dto.filiere.FiliereDto;
import com.example.siteamame.dto.filiere.FiliereSummaryDto;
import com.example.siteamame.model.Filiere;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@AllArgsConstructor
@Component
public class FiliereMapper {

    public FiliereSummaryDto convertToSummaryDTO(Filiere filiere) {
        if (filiere == null) return null;

        String filePath = filiere.getFile() != null
                ? filiere.getFile().getFilePath()
                : null;

        //Vérification null-safe pour les débouchés
        Set<String> debouches = filiere.getDebouches();
        Set<String> premiersDebouches = debouches != null
                ? debouches.stream().limit(3).collect(Collectors.toSet())
                : new HashSet<>();

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
                premiersDebouches
        );
    }

    public FiliereDto convertToDTO(Filiere filiere) {
        if (filiere == null) return null;

        String filePath = filiere.getFile() != null
                ? filiere.getFile().getFilePath()
                : null;

        // Vérifications null-safe pour toutes les collections
        Set<String> debouches = filiere.getDebouches() != null
                ? new HashSet<>(filiere.getDebouches())
                : new HashSet<>();

        Set<String> competences = filiere.getCompetences() != null
                ? new HashSet<>(filiere.getCompetences())
                : new HashSet<>();

        Set<String> universites = filiere.getUniversites() != null
                ? new HashSet<>(filiere.getUniversites())
                : new HashSet<>();

        Set<String> prerequis = filiere.getPrerequis() != null
                ? new HashSet<>(filiere.getPrerequis())
                : new HashSet<>();

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
                debouches,
                competences,
                universites,
                prerequis
        );
    }
}