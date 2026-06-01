package com.example.siteamame.mapper;

import com.example.siteamame.dto.galerie.GalerieDto;
import com.example.siteamame.dto.galerie.GalerieSummaryDto;
import com.example.siteamame.model.Galerie;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

@AllArgsConstructor
@Component
public class GalerieMapper {

    public GalerieSummaryDto toSummary(Galerie galerie) {
        String descriptionCourte = galerie.getDescription() != null && galerie.getDescription().length() > 150
                ? galerie.getDescription().substring(0, 150) + "..."
                : galerie.getDescription();

        String coverPath = galerie.getCoverImage() != null
                ? galerie.getCoverImage().getFilePath()
                : null;

        return new GalerieSummaryDto(
                galerie.getId(),
                galerie.getTitre(),
                descriptionCourte,
                galerie.getLieu(),
                galerie.getDateEvenement(),
                galerie.getEstPublie(),
                galerie.getDateCreation(),
                coverPath
        );
    }

    public GalerieDto toDto(Galerie galerie) {
        String coverPath = galerie.getCoverImage() != null
                ? galerie.getCoverImage().getFilePath()
                : null;

        return new GalerieDto(
                galerie.getId(),
                galerie.getTitre(),
                galerie.getDescription(),
                galerie.getLieu(),
                galerie.getDateEvenement(),
                galerie.getEstPublie(),
                galerie.getDateCreation(),
                galerie.getDateModification(),
                coverPath
        );
    }
}
