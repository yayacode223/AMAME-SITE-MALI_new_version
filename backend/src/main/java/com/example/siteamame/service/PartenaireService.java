package com.example.siteamame.service;

import com.example.siteamame.dto.file.FileDto;
import com.example.siteamame.dto.common.PageResponse;
import com.example.siteamame.dto.partenaire.PartenaireDto;
import com.example.siteamame.dto.partenaire.PartenaireRequestDto;
import com.example.siteamame.enumeration.FileType;
import com.example.siteamame.exception.concours.RessourceNotFoundException;
import com.example.siteamame.mapper.FileMapper;
import com.example.siteamame.model.File;
import com.example.siteamame.model.Partenaire;
import com.example.siteamame.repository.FileRepository;
import com.example.siteamame.repository.PartenaireRepository;
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
public class PartenaireService {

    private final PartenaireRepository partenaireRepository;
    private final FileStorageServiceImpl fileStorageService;
    private final FileMapper fileMapper;
    private final FileRepository fileRepository;

    @Transactional(readOnly = true)
    public List<PartenaireDto> getAllPartenairesActifs() {
        return partenaireRepository.findByIsActifTrueOrderByOrdreAscNomAsc()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PartenaireDto> getAllPartenaires() {
        return partenaireRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<PartenaireDto> getAllPartenairesPage(
            int page, int size, String sortBy, String sortDirection) {
        Sort sort = "DESC".equalsIgnoreCase(sortDirection)
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        return new PageResponse<>(
                partenaireRepository.findAll(PageRequest.of(page, size, sort)).map(this::toDto));
    }

    @Transactional(readOnly = true)
    public PartenaireDto getPartenaireById(Long id) {
        Partenaire partenaire = partenaireRepository.findById(id)
                .orElseThrow(() -> new RessourceNotFoundException("Partenaire non trouvé avec l'id: " + id));
        return toDto(partenaire);
    }

    @Transactional
    public PartenaireDto createPartenaire(PartenaireRequestDto request, MultipartFile file) throws IOException {
        Partenaire partenaire = new Partenaire();
        if (file != null && !file.isEmpty()) {
            FileDto fileDto = fileStorageService.storeFile(file, "partenaire", FileType.IMAGE);
            File savedFile = fileRepository.save(fileMapper.convertDtoToFile(fileDto));
            partenaire.setFile(savedFile);
        }
        mapRequestToPartenaire(request, partenaire);
        return toDto(partenaireRepository.save(partenaire));
    }

    @Transactional
    public PartenaireDto updatePartenaire(Long id, PartenaireRequestDto request, MultipartFile file) throws IOException {
        Partenaire partenaire = partenaireRepository.findById(id)
                .orElseThrow(() -> new RessourceNotFoundException("Partenaire non trouvé avec l'id: " + id));
        if (file != null && !file.isEmpty()) {
            FileDto fileDto = fileStorageService.storeFile(file, "partenaire", FileType.IMAGE);
            File savedFile = fileRepository.save(fileMapper.convertDtoToFile(fileDto));
            partenaire.setFile(savedFile);
        }
        mapRequestToPartenaire(request, partenaire);
        return toDto(partenaireRepository.save(partenaire));
    }

    @Transactional
    public void deletePartenaire(Long id) {
        if (!partenaireRepository.existsById(id)) {
            throw new RessourceNotFoundException("Partenaire non trouvé avec l'id: " + id);
        }
        partenaireRepository.deleteById(id);
    }

    private void mapRequestToPartenaire(PartenaireRequestDto request, Partenaire partenaire) {
        partenaire.setNom(request.getNom());
        partenaire.setType(request.getType());
        partenaire.setDescription(request.getDescription());
        partenaire.setSiteWeb(request.getSiteWeb());
        partenaire.setOrdre(request.getOrdre() != null ? request.getOrdre() : 0);
        partenaire.setIsActif(request.getIsActif() != null ? request.getIsActif() : true);
    }

    private PartenaireDto toDto(Partenaire partenaire) {
        String filePath = (partenaire.getFile() != null) ? partenaire.getFile().getFilePath() : null;
        return new PartenaireDto(
                partenaire.getId(),
                partenaire.getNom(),
                partenaire.getType(),
                partenaire.getDescription(),
                partenaire.getSiteWeb(),
                partenaire.getOrdre(),
                partenaire.getIsActif(),
                filePath
        );
    }
}
