package com.example.siteamame.service;


import com.example.siteamame.dto.OpportunitesDto;
import com.example.siteamame.model.Opportunites;
import com.example.siteamame.repository.OpportunitesRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Calendar;
import java.util.Date;
import java.util.List;

@AllArgsConstructor
@Service
public class OpportunitesService {

    private final OpportunitesRepository opportunitesRepository;

    public List<OpportunitesDto> getActiveOpportunites() {
        // Obtenir l'année actuelle
        int currentYear = Calendar.getInstance().get(Calendar.YEAR);

        // Définir la date seuil (ex: les 30 derniers jours)
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.DAY_OF_MONTH, -30);
        Date ninetyDaysAgo = cal.getTime();

        // Appeler la méthode corrigée du repository
        return opportunitesRepository.findActiveOpportunites(currentYear, ninetyDaysAgo);
    }

}