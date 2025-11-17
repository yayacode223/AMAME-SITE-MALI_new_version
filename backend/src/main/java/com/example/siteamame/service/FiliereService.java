package com.example.siteamame.service;

import com.example.siteamame.dto.file.FileDto;
import com.example.siteamame.dto.filiere.FiliereDto;
import com.example.siteamame.dto.filiere.FiliereRequestDto;
import com.example.siteamame.dto.filiere.FiliereSummaryDto;
import com.example.siteamame.enumeration.FileType;
import com.example.siteamame.mapper.FileMapper;
import com.example.siteamame.mapper.FiliereMapper;
import com.example.siteamame.model.File;
import com.example.siteamame.model.Filiere;
import com.example.siteamame.enumeration.DomaineFiliereSerieType;
import com.example.siteamame.repository.FileRepository;
import com.example.siteamame.repository.FiliereRepository;
import com.example.siteamame.service.file.FileStorageServiceImpl;
import lombok.AllArgsConstructor;


import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service

@AllArgsConstructor
public class FiliereService {

    private final FiliereRepository filiereRepository;
    private final FiliereMapper filiereMapper;
    private final FileStorageServiceImpl fileStorageService;
    private final FileMapper fileMapper;
    private final FileRepository fileRepository;

    public List<FiliereSummaryDto> getAllFilieres() {
        return filiereRepository.findAllByOrderByNomAsc()
                .stream()
                .map(filiereMapper::convertToSummaryDTO)
                .collect(Collectors.toList());
    }

    public FiliereDto getFiliereById(Long id) {
        Filiere filiere = filiereRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Filière non trouvée avec l'id: " + id));
        return filiereMapper.convertToDTO(filiere);
    }

    public List<FiliereSummaryDto> getFiliereBySearchTerm(String query){
        return filiereRepository.findBySearchTerm(query)
                .stream()
                .map(filiereMapper::convertToSummaryDTO)
                .collect(Collectors.toList());
    }

    public List<FiliereSummaryDto> getFilieresByDomaine(DomaineFiliereSerieType domaine) {
        return filiereRepository.findByDomaine(domaine)
                .stream()
                .map(filiereMapper::convertToSummaryDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public FiliereDto ajouterFiliere(FiliereRequestDto filiereRequestDto, MultipartFile file) throws IOException {
        Filiere filiere = new Filiere();
        if(file != null){
            FileDto fileDto = fileStorageService.storeFile(file, "filiere", FileType.IMAGE);
            File fileToSave = fileMapper.convertDtoToFile(fileDto);
            File savedFile = fileRepository.save(fileToSave);
            filiere.setFile(savedFile);
        }

        filiere.setNom(filiereRequestDto.getNom());
        filiere.setDemande(filiereRequestDto.getDemande());
        filiere.setSalaire(filiereRequestDto.getSalaire());
        filiere.setDifficulte(filiereRequestDto.getDifficulte());
        filiere.setDescriptionCourte(filiereRequestDto.getDescriptionCourte());
        filiereRequestDto.setDescriptionLongue(filiereRequestDto.getDescriptionLongue());
        filiere.setDureeEtudes(filiereRequestDto.getDureeEtudes());
        filiere.setTauxEmploi(filiereRequestDto.getTauxEmploi());
        filiere.setPerspectives(filiereRequestDto.getPerspectives());
        filiere.setCompetences(filiereRequestDto.getCompetences());
        filiere.setSalaireDebut(filiereRequestDto.getSalaireDebut());
        filiere.setSalaireExperience(filiereRequestDto.getSalaireExperience());
        filiere.setPrerequis(filiereRequestDto.getPrerequis());
        filiere.setDebouches(filiereRequestDto.getDebouches());
        filiere.setUniversites(filiereRequestDto.getUniversites());
        Filiere savedFiliere  = filiereRepository.save(filiere);
        return filiereMapper.convertToDTO(savedFiliere);
    }

    @Transactional
    public FiliereDto modifierFiliere(Long id, FiliereRequestDto filiereRequestDto, MultipartFile file) throws IOException {
        Filiere filiere = filiereRepository.findById(id)
                .orElseThrow(()-> new RuntimeException("Ce filiere avec Id"+ id + "n'existe pas"));

        if(file != null){
            if(filiere.getFile()!=null){
                fileStorageService.deleteFile(filiere.getFile().getFileName(), "filiere");
            }

            FileDto fileDto = fileStorageService.storeFile(file, "filiere", FileType.IMAGE);
            File fileToSave = fileMapper.convertDtoToFile(fileDto);
            File savedFile = fileRepository.save(fileToSave);
            filiere.setFile(savedFile);
        }

        if(!filiereRequestDto.getNom().isEmpty()) filiere.setNom(filiereRequestDto.getNom());
        if(filiereRequestDto.getDemande() != null) filiere.setDemande(filiereRequestDto.getDemande());
        if(filiereRequestDto.getSalaire() != null) filiere.setSalaire(filiereRequestDto.getSalaire());
        if(filiereRequestDto.getDifficulte() != null) filiere.setDifficulte(filiereRequestDto.getDifficulte());
        if(!filiereRequestDto.getDescriptionCourte().isEmpty()) filiere.setDescriptionCourte(filiereRequestDto.getDescriptionCourte());
        if(!filiereRequestDto.getDescriptionLongue().isEmpty()) filiereRequestDto.setDescriptionLongue(filiereRequestDto.getDescriptionLongue());
        if(!filiereRequestDto.getDureeEtudes().isEmpty()) filiere.setDureeEtudes(filiereRequestDto.getDureeEtudes());
        if(!filiereRequestDto.getTauxEmploi().isEmpty()) filiere.setTauxEmploi(filiereRequestDto.getTauxEmploi());
        if(!filiereRequestDto.getPerspectives().isEmpty()) filiere.setPerspectives(filiereRequestDto.getPerspectives());
        if(!filiereRequestDto.getCompetences().isEmpty()) filiere.setCompetences(filiereRequestDto.getCompetences());
        if(!filiereRequestDto.getSalaireDebut().isEmpty()) filiere.setSalaireDebut(filiereRequestDto.getSalaireDebut());
        if(!filiereRequestDto.getSalaireExperience().isEmpty()) filiere.setSalaireExperience(filiereRequestDto.getSalaireExperience());
        if(!filiereRequestDto.getPrerequis().isEmpty()) filiere.setPrerequis(filiereRequestDto.getPrerequis());
        if(!filiereRequestDto.getDebouches().isEmpty()) filiere.setDebouches(filiereRequestDto.getDebouches());
        if(!filiereRequestDto.getUniversites().isEmpty()) filiere.setUniversites(filiereRequestDto.getUniversites());
        Filiere savedFiliere  = filiereRepository.save(filiere);
        return filiereMapper.convertToDTO(savedFiliere);
    }

    public void deleteFiliere(Long id){
        if(filiereRepository.existsById(id)){
            filiereRepository.deleteById(id);
        }else{
            throw new RuntimeException("Impossible de supprimer cette filiere avec Id:"+id);
        }
    }
}