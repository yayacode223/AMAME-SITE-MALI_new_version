package com.example.siteamame.service;

import com.example.siteamame.dto.concours.ConcoursPageResponse;
import com.example.siteamame.dto.concours.ConcoursReponseDto;
import com.example.siteamame.dto.concours.ConcoursRequestDto;
import com.example.siteamame.dto.file.FileDto;
import com.example.siteamame.enumeration.FileType;
import com.example.siteamame.enumeration.NiveauType;
import com.example.siteamame.enumeration.StatusType;
import com.example.siteamame.mapper.ConcoursMapper;
import com.example.siteamame.mapper.FileMapper;
import com.example.siteamame.model.Concours;
import com.example.siteamame.model.File;
import com.example.siteamame.repository.ConcoursRepository;
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
import java.time.LocalDateTime;


@AllArgsConstructor
@Service
public class ConcoursService {
    private final ConcoursRepository concoursRepository;
    private final ConcoursMapper concoursMapper;
    private final FileStorageServiceImpl fileStorageService;
    private final FileRepository fileRepository;
    private final FileMapper fileMapper;

    //La liste de concours avec pagination
    public ConcoursPageResponse getAllConcours(int page, int size, String sortBy, String sortDirection) {
        Sort sort = sortDirection.equalsIgnoreCase(Sort.Direction.DESC.name())
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<ConcoursReponseDto> concoursReponseDtoPage=  concoursRepository.findValideConcoursAvecPagination(
                LocalDateTime.now(), pageable
        );
        return new ConcoursPageResponse(concoursReponseDtoPage);
    }

    //La liste de concours par niveau d'etude ou par status
    public ConcoursPageResponse getConcoursByNiveauOrByStatus(
            int page, int size,
            String sortBy,
            String sortDirection,
            NiveauType niveau,
            StatusType status
    ) {
        Sort sort = sortDirection.equalsIgnoreCase(Sort.Direction.DESC.name())
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<ConcoursReponseDto> concoursReponseDtoPage=  concoursRepository.findValideConcoursByNiveauOrByStatus(
                LocalDateTime.now(),
                niveau,
                status,
                pageable
        );
        return new ConcoursPageResponse(concoursReponseDtoPage);
    }

    //La liste de concours par recherche
    public ConcoursPageResponse getConcoursBySearch(int page, int size,
                                                    String sortBy, String sortDirection,
                                                    String search
    ) {
        Sort sort = sortDirection.equalsIgnoreCase(Sort.Direction.DESC.name())
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<ConcoursReponseDto> concoursReponseDtoPage=  concoursRepository.findValideConcoursBySearch(
                LocalDateTime.now(), search,
                pageable
        );
        return new ConcoursPageResponse(concoursReponseDtoPage);
    }

    //Recuperer un concours
    public ConcoursReponseDto recupererConcours(Long id) {
        Concours concours = concoursRepository.findById(id).
                orElseThrow(()-> new RuntimeException("Ce concours avec Id :"+ id + "n'existe pas"));
        return concoursMapper.convertToDTO(concours);
    }

    //Ajouter un concours
    @Transactional
    public ConcoursReponseDto ajouterConcours(
            ConcoursRequestDto concoursRequestDto, MultipartFile file
    ) {
        Concours concours = new  Concours();
        if(file != null){
            try {
                FileDto fileDto = fileStorageService.storeFile(file, "concours", FileType.DOCUMENT);
                File fileToSave = fileMapper.convertDtoToFile(fileDto);
                File savedFile = fileRepository.save(fileToSave);
                concours.setFile(savedFile);
            }catch (Exception e){
                throw new RuntimeException("Impossible de stocker ce fichier: "+e.getMessage());
            }
        }
        concours.setNom(concoursRequestDto.getNom());
        concours.setDescription(concoursRequestDto.getDescription());
        concours.setNiveau(concoursRequestDto.getNiveau());
        concours.setPays(concoursRequestDto.getPays());
        concours.setAvalable(true);
        concours.setDateLimite(concoursRequestDto.getDateLimite());
        concours.setDateOuverture(concoursRequestDto.getDateOuverture());
        concours.setLienOfficiel(concoursRequestDto.getLienOfficiel());
        concours.setStatus(concoursRequestDto.getStatus());

        Concours savedConcours = concoursRepository.save(concours);
        return concoursMapper.convertToDTO(savedConcours);
    }

    //Mettre a jour un Concours
    @Transactional
    public ConcoursReponseDto modifierConcours(Long id, ConcoursRequestDto concoursRequestDto, MultipartFile file) {
        Concours concours = concoursRepository.findById(id)
                .orElseThrow(
                        ()-> new RuntimeException("Ce concours avec cet id" +id + "n'existe pas")
                );

        if (!concoursRequestDto.getNom().isEmpty()) concours.setNom(concoursRequestDto.getNom());
        if (!concoursRequestDto.getDescription().isEmpty()) concours.setDescription(concoursRequestDto.getDescription());
        if (concoursRequestDto.getNiveau() != null) concours.setNiveau(concoursRequestDto.getNiveau());
        if (concoursRequestDto.getStatus() != null) concours.setStatus(concoursRequestDto.getStatus());
        if (!concoursRequestDto.getLienOfficiel().isEmpty()) concours.setLienOfficiel(concoursRequestDto.getLienOfficiel());
        if (!concoursRequestDto.getPays().isEmpty()) concours.setPays(concoursRequestDto.getPays());
        if (concoursRequestDto.getDateLimite()!=null) concours.setDateLimite(concoursRequestDto.getDateLimite());
        if (concoursRequestDto.getDateOuverture()!=null) concours.setDateOuverture(concoursRequestDto.getDateOuverture());
        concours.setAvalable(true);

        if(file !=null){
            if(concours.getFile() != null){
                try{
                    fileStorageService.deleteFile(concours.getFile().getFileName(), "concours");
                }catch (Exception e){
                    throw new RuntimeException("Impossible de supprimer le fichier existant", e);
                }
            }
            try {
                FileDto fileDto = fileStorageService.storeFile(file, "concours", FileType.DOCUMENT);
                File fileToSave = fileMapper.convertDtoToFile(fileDto);
                File savedFile = fileRepository.save(fileToSave);
                concours.setFile(savedFile);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }

        Concours updated = concoursRepository.save(concours);

        return concoursMapper.convertToDTO(updated);
    }

    // Supprimer un concours
    @Transactional
    public void deleteConcours(Long id) {
        if(concoursRepository.existsById(id)){
            concoursRepository.deleteById(id);
        }else {
            throw new RuntimeException("Impossible de supprimer ce concours avec Id" +id);
        }
    }
}

