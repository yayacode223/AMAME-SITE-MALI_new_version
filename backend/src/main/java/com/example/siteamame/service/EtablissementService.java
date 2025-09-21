package com.example.siteamame.service;

import com.example.siteamame.dto.EtablissementDto;
import com.example.siteamame.repository.EtablissementRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@AllArgsConstructor
@Service
public class EtablissementService {
    private final EtablissementRepository etablissementRepository;

    public List<EtablissementDto> getAllEtablissements() {
        return etablissementRepository.findAllEtablissementsAsDTO();
    }
}
