package com.example.siteamame.service;

import com.example.siteamame.dto.file.FileDto;
import com.example.siteamame.dto.common.PageResponse;
import com.example.siteamame.dto.galerie.GalerieCreationRequest;
import com.example.siteamame.dto.galerie.GalerieDto;
import com.example.siteamame.dto.galerie.GalerieSummaryDto;
import com.example.siteamame.enumeration.FileType;
import com.example.siteamame.mapper.FileMapper;
import com.example.siteamame.mapper.GalerieMapper;
import com.example.siteamame.model.File;
import com.example.siteamame.model.Galerie;
import com.example.siteamame.repository.FileRepository;
import com.example.siteamame.repository.GalerieRepository;
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
public class GalerieService {

    private final GalerieRepository galerieRepository;
    private final GalerieMapper galerieMapper;
    private final FileStorageServiceImpl fileStorageService;
    private final FileRepository fileRepository;
    private final FileMapper fileMapper;

    @Transactional(readOnly = true)
    public List<GalerieSummaryDto> getAllGaleries() {
        return galerieRepository.findByEstPublieTrueOrderByDateCreationDesc()
                .stream()
                .map(galerieMapper::toSummary)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GalerieSummaryDto> getAllGaleriesAdmin() {
        return galerieRepository.findAllByOrderByDateCreationDesc()
                .stream()
                .map(galerieMapper::toSummary)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<GalerieSummaryDto> getGaleriesPage(
            int page, int size, String sortBy, String sortDirection) {
        Sort sort = "ASC".equalsIgnoreCase(sortDirection)
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        return new PageResponse<>(
                galerieRepository.findByEstPublieTrue(PageRequest.of(page, size, sort))
                        .map(galerieMapper::toSummary));
    }

    @Transactional(readOnly = true)
    public PageResponse<GalerieSummaryDto> getGaleriesAdminPage(
            int page, int size, String sortBy, String sortDirection) {
        Sort sort = "ASC".equalsIgnoreCase(sortDirection)
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        return new PageResponse<>(
                galerieRepository.findAll(PageRequest.of(page, size, sort))
                        .map(galerieMapper::toSummary));
    }

    @Transactional(readOnly = true)
    public GalerieDto getGalerieById(Long id) {
        Galerie galerie = galerieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Galerie non trouvée avec l'id: " + id));
        return galerieMapper.toDto(galerie);
    }

    @Transactional
    public GalerieDto createGalerie(GalerieCreationRequest request, MultipartFile file) throws IOException {
        Galerie galerie = new Galerie();
        galerie.setTitre(request.getTitre());
        galerie.setDescription(request.getDescription());
        galerie.setLieu(request.getLieu());
        galerie.setDateEvenement(request.getDateEvenement());
        galerie.setEstPublie(false);

        if (file != null && !file.isEmpty()) {
            FileDto fileDto = fileStorageService.storeFile(file, "galerie", FileType.IMAGE);
            File fileToSave = fileMapper.convertDtoToFile(fileDto);
            File savedFile = fileRepository.save(fileToSave);
            galerie.setCoverImage(savedFile);
        }

        Galerie saved = galerieRepository.save(galerie);
        return galerieMapper.toDto(saved);
    }

    @Transactional
    public GalerieDto updateGalerie(Long id, GalerieDto galerieDto, MultipartFile file) throws IOException {
        Galerie galerie = galerieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Galerie non trouvée avec l'id: " + id));

        if (galerieDto.getTitre() != null && !galerieDto.getTitre().isBlank()) {
            galerie.setTitre(galerieDto.getTitre());
        }
        if (galerieDto.getDescription() != null) {
            galerie.setDescription(galerieDto.getDescription());
        }
        if (galerieDto.getLieu() != null) {
            galerie.setLieu(galerieDto.getLieu());
        }
        if (galerieDto.getDateEvenement() != null) {
            galerie.setDateEvenement(galerieDto.getDateEvenement());
        }
        if (galerieDto.getEstPublie() != null) {
            galerie.setEstPublie(galerieDto.getEstPublie());
        }

        if (file != null && !file.isEmpty()) {
            if (galerie.getCoverImage() != null) {
                fileStorageService.deleteFile(galerie.getCoverImage().getFileName(), "galerie");
            }
            FileDto fileDto = fileStorageService.storeFile(file, "galerie", FileType.IMAGE);
            File fileToSave = fileMapper.convertDtoToFile(fileDto);
            File savedFile = fileRepository.save(fileToSave);
            galerie.setCoverImage(savedFile);
        }

        Galerie saved = galerieRepository.save(galerie);
        return galerieMapper.toDto(saved);
    }

    @Transactional
    public void deleteGalerie(Long id) {
        if (!galerieRepository.existsById(id)) {
            throw new RuntimeException("Galerie non trouvée avec l'id: " + id);
        }
        galerieRepository.deleteById(id);
    }
}
