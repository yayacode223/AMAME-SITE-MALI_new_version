package com.example.siteamame.service;

import com.example.siteamame.dto.file.FileDto;
import com.example.siteamame.dto.common.PageResponse;
import com.example.siteamame.dto.ressource.RessourceAcademiqueDto;
import com.example.siteamame.dto.ressource.RessourceAcademiqueRequestDto;
import com.example.siteamame.enumeration.FileType;
import com.example.siteamame.exception.concours.RessourceNotFoundException;
import com.example.siteamame.mapper.FileMapper;
import com.example.siteamame.model.File;
import com.example.siteamame.model.RessourceAcademique;
import com.example.siteamame.repository.FileRepository;
import com.example.siteamame.repository.RessourceAcademiqueRepository;
import com.example.siteamame.service.file.FileStorageServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RessourceAcademiqueService {

    private final RessourceAcademiqueRepository ressourceRepository;
    private final FileStorageServiceImpl fileStorageService;
    private final FileMapper fileMapper;
    private final FileRepository fileRepository;

    @Transactional(readOnly = true)
    public List<RessourceAcademiqueDto> getAllRessourcesActives() {
        return ressourceRepository.findByIsActifTrueOrderByOrdreAscTitreAsc()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RessourceAcademiqueDto> getAllRessources() {
        return ressourceRepository.findAll()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<RessourceAcademiqueDto> getRessourcesActivesPage(
            int page, int size, String sortBy, String sortDirection) {
        Sort sort = "DESC".equalsIgnoreCase(sortDirection)
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        return new PageResponse<>(
                ressourceRepository.findByIsActifTrue(PageRequest.of(page, size, sort))
                        .map(this::toDto));
    }

    @Transactional(readOnly = true)
    public PageResponse<RessourceAcademiqueDto> getRessourcesPage(
            int page, int size, String sortBy, String sortDirection) {
        Sort sort = "DESC".equalsIgnoreCase(sortDirection)
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        return new PageResponse<>(
                ressourceRepository.findAll(PageRequest.of(page, size, sort))
                        .map(this::toDto));
    }

    @Transactional(readOnly = true)
    public RessourceAcademiqueDto getRessourceById(Long id) {
        return toDto(ressourceRepository.findById(id)
                .orElseThrow(() -> new RessourceNotFoundException("Ressource non trouvée avec l'id: " + id)));
    }

    @Transactional
    public RessourceAcademiqueDto createRessource(RessourceAcademiqueRequestDto request,
                                                   MultipartFile file) throws IOException {
        RessourceAcademique ressource = new RessourceAcademique();
        if (file != null && !file.isEmpty()) {
            FileDto fileDto = fileStorageService.storeFile(file, "ressource", FileType.DOCUMENT);
            File saved = fileRepository.save(fileMapper.convertDtoToFile(fileDto));
            ressource.setFile(saved);
        }
        mapRequest(request, ressource);
        return toDto(ressourceRepository.save(ressource));
    }

    @Transactional
    public RessourceAcademiqueDto updateRessource(Long id, RessourceAcademiqueRequestDto request,
                                                   MultipartFile file) throws IOException {
        RessourceAcademique ressource = ressourceRepository.findById(id)
                .orElseThrow(() -> new RessourceNotFoundException("Ressource non trouvée avec l'id: " + id));
        if (file != null && !file.isEmpty()) {
            FileDto fileDto = fileStorageService.storeFile(file, "ressource", FileType.DOCUMENT);
            File saved = fileRepository.save(fileMapper.convertDtoToFile(fileDto));
            ressource.setFile(saved);
        }
        mapRequest(request, ressource);
        return toDto(ressourceRepository.save(ressource));
    }

    @Transactional
    public void deleteRessource(Long id) {
        if (!ressourceRepository.existsById(id)) {
            throw new RessourceNotFoundException("Ressource non trouvée avec l'id: " + id);
        }
        ressourceRepository.deleteById(id);
    }

    private void mapRequest(RessourceAcademiqueRequestDto req, RessourceAcademique r) {
        r.setTitre(req.getTitre());
        r.setDescription(req.getDescription());
        r.setType(req.getType());
        r.setNiveau(req.getNiveau());
        r.setOrdre(req.getOrdre() != null ? req.getOrdre() : 0);
        r.setIsActif(req.getIsActif() != null ? req.getIsActif() : true);
    }

    private RessourceAcademiqueDto toDto(RessourceAcademique r) {
        String filePath = r.getFile() != null ? r.getFile().getFilePath() : null;
        return new RessourceAcademiqueDto(
                r.getId(), r.getTitre(), r.getDescription(),
                r.getType(), r.getNiveau(), r.getOrdre(), r.getIsActif(), filePath
        );
    }
}
