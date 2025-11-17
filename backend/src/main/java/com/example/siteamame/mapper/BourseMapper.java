package com.example.siteamame.mapper;

import com.example.siteamame.dto.bourse.BourseDetailDto;
import com.example.siteamame.dto.bourse.BourseSummaryDto;
import com.example.siteamame.model.Bourse;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;


@AllArgsConstructor
@Component
public class BourseMapper {

    public BourseSummaryDto BourseToSummaryDto(Bourse bourse){
        BourseSummaryDto bourseSummaryDto = new BourseSummaryDto();
        bourseSummaryDto.setId(bourse.getId());
        bourseSummaryDto.setTitre(bourse.getTitre());
        bourseSummaryDto.setDescriptionCourte(bourse.getDescriptionCourte());
        bourseSummaryDto.setBailleur(bourse.getBailleur());
        bourseSummaryDto.setNiveau(bourse.getNiveau());
        bourseSummaryDto.setPaysHote(bourse.getPaysHote());
        bourseSummaryDto.setCategorie(bourse.getCategorie());
        bourseSummaryDto.setOrganisation(bourse.getOrganisation());
        bourseSummaryDto.setFinancementStatut(bourse.getFinancementStatut());
        bourseSummaryDto.setDateLimite(bourse.getDateLimite());
        return bourseSummaryDto;
    }

    public BourseDetailDto BourseToDetailDto(Bourse bourse){
        BourseDetailDto bourseDetailDto = new BourseDetailDto();
        bourseDetailDto.setId(bourse.getId());
        bourseDetailDto.setTitre(bourse.getTitre());
        bourseDetailDto.setDescriptionCourte(bourse.getDescriptionCourte());
        bourseDetailDto.setDescriptionLongue(bourse.getDescriptionLongue());
        bourseDetailDto.setBailleur(bourse.getBailleur());
        bourseDetailDto.setDateLimite(bourse.getDateLimite());
        bourseDetailDto.setCategorie(bourse.getCategorie());
        bourseDetailDto.setNiveau(bourse.getNiveau());
        bourseDetailDto.setPaysHote(bourse.getPaysHote());
        bourseDetailDto.setPaysEligible(bourse.getPaysEligible());
        bourseDetailDto.setFinancement(bourse.getFinancement());
        bourseDetailDto.setFinancementStatut(bourse.getFinancementStatut());
        bourseDetailDto.setNombresVues(bourse.getNombresVues());
        bourseDetailDto.setRegionEligible(bourse.getRegionEligible());
        bourseDetailDto.setUrlSource(bourse.getUrlSource());
        bourseDetailDto.setDatePublication(bourse.getDatePublication());
        bourseDetailDto.setDateScraping(bourse.getDateScraping());
        bourseDetailDto.setOrganisation(bourse.getOrganisation());
        bourseDetailDto.setLienSiteOfficiel(bourse.getLienSiteOfficiel());
        return bourseDetailDto;
    }

}
