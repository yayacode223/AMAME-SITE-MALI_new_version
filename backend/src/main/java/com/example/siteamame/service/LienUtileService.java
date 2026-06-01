package com.example.siteamame.service;

import com.example.siteamame.dto.common.PageResponse;
import com.example.siteamame.dto.lienutile.LienUtileDto;
import com.example.siteamame.dto.lienutile.LienUtileRequestDto;
import com.example.siteamame.exception.concours.RessourceNotFoundException;
import com.example.siteamame.model.LienUtile;
import com.example.siteamame.repository.LienUtileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LienUtileService {

    private final LienUtileRepository lienUtileRepository;

    @Transactional(readOnly = true)
    public List<LienUtileDto> getAllLiensActifs() {
        return lienUtileRepository.findByIsActifTrueOrderByOrdreAscTitreAsc()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LienUtileDto> getAllLiens() {
        return lienUtileRepository.findAll()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<LienUtileDto> getAllLiensPage(
            int page, int size, String sortBy, String sortDirection) {
        Sort sort = "DESC".equalsIgnoreCase(sortDirection)
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        return new PageResponse<>(
                lienUtileRepository.findAll(PageRequest.of(page, size, sort))
                        .map(this::toDto));
    }

    @Transactional(readOnly = true)
    public LienUtileDto getLienById(Long id) {
        return toDto(lienUtileRepository.findById(id)
                .orElseThrow(() -> new RessourceNotFoundException("Lien utile non trouvé avec l'id: " + id)));
    }

    @Transactional
    public LienUtileDto createLien(LienUtileRequestDto request) {
        LienUtile lien = new LienUtile();
        mapRequest(request, lien);
        return toDto(lienUtileRepository.save(lien));
    }

    @Transactional
    public LienUtileDto updateLien(Long id, LienUtileRequestDto request) {
        LienUtile lien = lienUtileRepository.findById(id)
                .orElseThrow(() -> new RessourceNotFoundException("Lien utile non trouvé avec l'id: " + id));
        mapRequest(request, lien);
        return toDto(lienUtileRepository.save(lien));
    }

    @Transactional
    public void deleteLien(Long id) {
        if (!lienUtileRepository.existsById(id)) {
            throw new RessourceNotFoundException("Lien utile non trouvé avec l'id: " + id);
        }
        lienUtileRepository.deleteById(id);
    }

    private void mapRequest(LienUtileRequestDto req, LienUtile lien) {
        lien.setTitre(req.getTitre());
        lien.setDescription(req.getDescription());
        lien.setUrl(req.getUrl());
        lien.setCategorie(req.getCategorie());
        lien.setOrdre(req.getOrdre() != null ? req.getOrdre() : 0);
        lien.setIsActif(req.getIsActif() != null ? req.getIsActif() : true);
    }

    private LienUtileDto toDto(LienUtile lien) {
        return new LienUtileDto(
                lien.getId(), lien.getTitre(), lien.getDescription(),
                lien.getUrl(), lien.getCategorie(), lien.getOrdre(), lien.getIsActif()
        );
    }
}
