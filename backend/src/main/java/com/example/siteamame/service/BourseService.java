package com.example.siteamame.service;

import com.example.siteamame.dto.bourse.BourseCreationRequest;
import com.example.siteamame.dto.bourse.BourseDetailDto;
import com.example.siteamame.dto.bourse.BoursePageResponse;
import com.example.siteamame.dto.bourse.BourseSummaryDto;
import com.example.siteamame.dto.file.FileDto;
import com.example.siteamame.enumeration.FileType;
import com.example.siteamame.mapper.BourseMapper;
import com.example.siteamame.mapper.FileMapper;
import com.example.siteamame.model.Bourse;
import com.example.siteamame.model.File;
import com.example.siteamame.repository.BourseRepository;
import com.example.siteamame.repository.FileRepository;
import com.example.siteamame.service.file.FileStorageServiceImpl;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@AllArgsConstructor
public class BourseService {
    private final BourseRepository bourseRepository;
    private final BourseMapper bourseMapper;
    private final FileStorageServiceImpl fileStorageService;
    private final FileMapper fileMapper;
    private final FileRepository fileRepository;

    // Méthodes GET existantes
    public BoursePageResponse getBoursesValides(int page, int size, String sortBy, String sortDirection){
        Sort sort = sortDirection.equalsIgnoreCase(Sort.Direction.DESC.name())
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<BourseSummaryDto> bourseSummaryDtos = bourseRepository.findValideBoursesAvecPagination(LocalDate.now(), pageable);
        return new BoursePageResponse(bourseSummaryDtos);
    }

    public BoursePageResponse getBoursesValidesAndFiltere(
            int page, int size, String sortBy, String sortDirection,
            String categorie, String niveau, String pays
    ){
        Sort sort = sortDirection.equalsIgnoreCase(Sort.Direction.DESC.name())
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<BourseSummaryDto> bourseSummaryDtos = bourseRepository.findValideAndFilteredBourse(LocalDate.now(), categorie, niveau, pays, pageable);
        return new BoursePageResponse(bourseSummaryDtos);
    }

    public BoursePageResponse getBySearchBourses(
            int page, int size, String sortBy, String sortDirection,
            String titre, String description, String pays
    ){
        Sort sort = sortDirection.equalsIgnoreCase(Sort.Direction.DESC.name())
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        String titreSearch = titre != null ? titre.trim() : null;
        String descriptionSearch = description != null ? description.trim() : null;
        String paysSearch = pays != null ? pays.trim() : null;
        Page<BourseSummaryDto> bourseSummaryDtos = bourseRepository.findBySearchBourses(LocalDate.now(), titreSearch, descriptionSearch, paysSearch, pageable);
        return new BoursePageResponse(bourseSummaryDtos);
    }

    public BourseDetailDto getBourseById(Long id){
        Bourse bourse = bourseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bourse non trouvée avec Id:" + id));
        return bourseMapper.BourseToDetailDto(bourse);
    }

    // NOUVELLES MÉTHODES CRUD
    @Transactional
    public BourseDetailDto createBourse(BourseCreationRequest request, MultipartFile file) {
        Bourse bourse = new Bourse();

        // Gestion du fichier
        if (file != null && !file.isEmpty()) {
            try {
                FileDto fileDto = fileStorageService.storeFile(file, "bourses", FileType.DOCUMENT);
                File fileToSave = fileMapper.convertDtoToFile(fileDto);
                File savedFile = fileRepository.save(fileToSave);
                bourse.setFile(savedFile);
            } catch (IOException e) {
                throw new RuntimeException("Erreur lors du stockage du fichier: " + e.getMessage());
            }
        }

        // Mapping des champs
        bourse.setTitre(request.getTitre());
        bourse.setDescriptionCourte(request.getDescriptionCourte());
        bourse.setDescriptionLongue(request.getDescriptionLongue());
        bourse.setBailleur(request.getBailleur());
        bourse.setPaysHote(request.getPaysHote());
        bourse.setNiveau(request.getNiveau());
        bourse.setCategorie(request.getCategorie());
        bourse.setFinancementStatut(request.getFinancementStatut());
        bourse.setOrganisation(request.getOrganisation());
        bourse.setDateLimite(request.getDateLimite());
        bourse.setFinancement(request.getFinancement());
        bourse.setPaysEligible(request.getPaysEligible());
        bourse.setRegionEligible(request.getRegionEligible());
        bourse.setLienSiteOfficiel(request.getLienSiteOfficiel());
        bourse.setUrlSource(request.getUrlSource());
        bourse.setDatePublication(LocalDate.now());
        bourse.setNombresVues(0);


        Bourse savedBourse = bourseRepository.save(bourse);
        return bourseMapper.BourseToDetailDto(savedBourse);
    }

    @Transactional
    public BourseDetailDto updateBourse(Long id, BourseCreationRequest request, MultipartFile file) {
        Bourse bourse = bourseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bourse non trouvée avec Id: " + id));

        // Gestion du fichier
        if (file != null && !file.isEmpty()) {
            // Supprimer l'ancien fichier s'il existe
            if (bourse.getFile() != null) {
                try {
                    fileStorageService.deleteFile(bourse.getFile().getFileName(), "bourses");
                    fileRepository.delete(bourse.getFile());
                } catch (IOException e) {
                    throw new RuntimeException("Erreur lors de la suppression de l'ancien fichier: " + e.getMessage());
                }
            }

            // Ajouter le nouveau fichier
            try {
                FileDto fileDto = fileStorageService.storeFile(file, "bourses", FileType.DOCUMENT);
                File fileToSave = fileMapper.convertDtoToFile(fileDto);
                File savedFile = fileRepository.save(fileToSave);
                bourse.setFile(savedFile);
            } catch (IOException e) {
                throw new RuntimeException("Erreur lors du stockage du nouveau fichier: " + e.getMessage());
            }
        }

        // Mise à jour des champs
        if (request.getTitre() != null && !request.getTitre().trim().isEmpty()) {
            bourse.setTitre(request.getTitre());
        }
        if (request.getDescriptionCourte() != null) {
            bourse.setDescriptionCourte(request.getDescriptionCourte());
        }
        if (request.getDescriptionLongue() != null) {
            bourse.setDescriptionLongue(request.getDescriptionLongue());
        }
        if (request.getBailleur() != null) {
            bourse.setBailleur(request.getBailleur());
        }
        if (request.getPaysHote() != null) {
            bourse.setPaysHote(request.getPaysHote());
        }
        if (request.getNiveau() != null) {
            bourse.setNiveau(request.getNiveau());
        }
        if (request.getCategorie() != null) {
            bourse.setCategorie(request.getCategorie());
        }
        if (request.getFinancementStatut() != null) {
            bourse.setFinancementStatut(request.getFinancementStatut());
        }
        if (request.getOrganisation() != null) {
            bourse.setOrganisation(request.getOrganisation());
        }
        if (request.getDateLimite() != null) {
            bourse.setDateLimite(request.getDateLimite());
        }
        if (request.getFinancement() != null) {
            bourse.setFinancement(request.getFinancement());
        }
        if (request.getPaysEligible() != null) {
            bourse.setPaysEligible(request.getPaysEligible());
        }
        if (request.getRegionEligible() != null) {
            bourse.setRegionEligible(request.getRegionEligible());
        }
        if (request.getLienSiteOfficiel() != null) {
            bourse.setLienSiteOfficiel(request.getLienSiteOfficiel());
        }
        if (request.getUrlSource() != null) {
            bourse.setUrlSource(request.getUrlSource());
        }

        Bourse updatedBourse = bourseRepository.save(bourse);
        return bourseMapper.BourseToDetailDto(updatedBourse);
    }

    @Transactional
    public void deleteBourse(Long id) {
        Bourse bourse = bourseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bourse non trouvée avec Id: " + id));

        // Supprimer le fichier associé s'il existe
        if (bourse.getFile() != null) {
            try {
                fileStorageService.deleteFile(bourse.getFile().getFileName(), "bourses");
                fileRepository.delete(bourse.getFile());
            } catch (IOException e) {
                throw new RuntimeException("Erreur lors de la suppression du fichier: " + e.getMessage());
            }
        }

        bourseRepository.delete(bourse);
    }

}