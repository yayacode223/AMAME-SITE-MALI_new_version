package com.example.siteamame.service;

import com.example.siteamame.dto.common.PageResponse;
import com.example.siteamame.dto.etablissement.EtablissementDto;
import com.example.siteamame.dto.etablissement.EtablissementRequestDto;
import com.example.siteamame.exception.concours.RessourceNotFoundException;
import com.example.siteamame.model.Etablissement;
import com.example.siteamame.repository.EtablissementRepository;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

@AllArgsConstructor
@Service
public class EtablissementService {

    private final EtablissementRepository etablissementRepository;

    @Transactional(readOnly = true)
    public List<EtablissementDto> getAllEtablissements() {
        return etablissementRepository.findAllEtablissementsAsDTO();
    }

    @Transactional(readOnly = true)
    public PageResponse<EtablissementDto> getEtablissementsPage(
            int page, int size, String sortBy, String sortDirection) {
        Sort sort = "DESC".equalsIgnoreCase(sortDirection)
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        return new PageResponse<>(
                etablissementRepository.findAllEtablissementsPagedAsDTO(PageRequest.of(page, size, sort)));
    }

    @Transactional(readOnly = true)
    public EtablissementDto getEtablissementById(Long id) {
        Etablissement e = etablissementRepository.findById(id)
                .orElseThrow(() -> new RessourceNotFoundException("Établissement non trouvé avec l'id: " + id));
        return toDto(e);
    }

    @Transactional
    public EtablissementDto createEtablissement(EtablissementRequestDto request) {
        Etablissement e = new Etablissement();
        mapRequest(request, e);
        e.setDateScraping(new Date());
        return toDto(etablissementRepository.save(e));
    }

    @Transactional
    public EtablissementDto updateEtablissement(Long id, EtablissementRequestDto request) {
        Etablissement e = etablissementRepository.findById(id)
                .orElseThrow(() -> new RessourceNotFoundException("Établissement non trouvé avec l'id: " + id));
        mapRequest(request, e);
        return toDto(etablissementRepository.save(e));
    }

    @Transactional
    public void deleteEtablissement(Long id) {
        if (!etablissementRepository.existsById(id)) {
            throw new RessourceNotFoundException("Établissement non trouvé avec l'id: " + id);
        }
        etablissementRepository.deleteById(id);
    }

    private void mapRequest(EtablissementRequestDto request, Etablissement e) {
        e.setNom(request.getNom());
        e.setTypeEtablissement(request.getTypeEtablissement());
        e.setLieu(request.getLieu());
        e.setUrlDetailEtablissement(request.getUrlDetailEtablissement());
        e.setUrlLogo(request.getUrlLogo());
        e.setUrlImage(request.getUrlImage());
        e.setSourceSite(request.getSourceSite());
    }

    private EtablissementDto toDto(Etablissement e) {
        return new EtablissementDto(
                e.getId(),
                e.getNom(),
                e.getTypeEtablissement(),
                e.getLieu(),
                e.getUrlDetailEtablissement(),
                e.getUrlLogo(),
                e.getUrlImage()
        );
    }
}
