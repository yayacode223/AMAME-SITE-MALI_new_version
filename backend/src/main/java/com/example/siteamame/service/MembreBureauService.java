package com.example.siteamame.service;

import com.example.siteamame.dto.common.PageResponse;
import com.example.siteamame.dto.file.FileDto;
import com.example.siteamame.dto.membre.MembreDto;
import com.example.siteamame.dto.membre.MembreRequestDto;
import com.example.siteamame.enumeration.FileType;
import com.example.siteamame.exception.concours.RessourceNotFoundException;
import com.example.siteamame.mapper.FileMapper;
import com.example.siteamame.model.File;
import com.example.siteamame.model.Membre;
import com.example.siteamame.repository.FileRepository;
import com.example.siteamame.repository.MembreRepository;
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
public class MembreBureauService {

    private final MembreRepository membreRepository;
    private final FileStorageServiceImpl fileStorageService;
    private final FileMapper fileMapper;
    private final FileRepository fileRepository;

    @Transactional(readOnly = true)
    public List<MembreDto> getAllMembresActifs() {
        return membreRepository.findByIsActifTrueOrderByOrdreAscNomAsc()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<MembreDto> getAllMembresPage(int page, int size, String sortBy, String sortDirection) {
        Sort sort = "DESC".equalsIgnoreCase(sortDirection)
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        return new PageResponse<>(
                membreRepository.findAll(PageRequest.of(page, size, sort)).map(this::toDto));
    }

    @Transactional(readOnly = true)
    public MembreDto getMembreById(Long id) {
        return toDto(membreRepository.findById(id)
                .orElseThrow(() -> new RessourceNotFoundException("Membre non trouvé avec l'id: " + id)));
    }

    @Transactional
    public MembreDto createMembre(MembreRequestDto request, MultipartFile file) throws IOException {
        Membre membre = new Membre();
        if (file != null && !file.isEmpty()) {
            FileDto fileDto = fileStorageService.storeFile(file, "membre", FileType.IMAGE);
            File savedFile = fileRepository.save(fileMapper.convertDtoToFile(fileDto));
            membre.setFile(savedFile);
        }
        mapRequest(request, membre);
        return toDto(membreRepository.save(membre));
    }

    @Transactional
    public MembreDto updateMembre(Long id, MembreRequestDto request, MultipartFile file) throws IOException {
        Membre membre = membreRepository.findById(id)
                .orElseThrow(() -> new RessourceNotFoundException("Membre non trouvé avec l'id: " + id));
        if (file != null && !file.isEmpty()) {
            FileDto fileDto = fileStorageService.storeFile(file, "membre", FileType.IMAGE);
            File savedFile = fileRepository.save(fileMapper.convertDtoToFile(fileDto));
            membre.setFile(savedFile);
        }
        mapRequest(request, membre);
        return toDto(membreRepository.save(membre));
    }

    @Transactional
    public void deleteMembre(Long id) {
        if (!membreRepository.existsById(id)) {
            throw new RessourceNotFoundException("Membre non trouvé avec l'id: " + id);
        }
        membreRepository.deleteById(id);
    }

    private void mapRequest(MembreRequestDto request, Membre membre) {
        membre.setPrenom(request.getPrenom());
        membre.setNom(request.getNom());
        membre.setPoste(request.getPoste());
        membre.setBio(request.getBio());
        membre.setEmail(request.getEmail());
        membre.setOrdre(request.getOrdre() != null ? request.getOrdre() : 0);
        membre.setIsActif(request.getIsActif() != null ? request.getIsActif() : true);
    }

    private MembreDto toDto(Membre membre) {
        String filePath = (membre.getFile() != null) ? membre.getFile().getFilePath() : null;
        return new MembreDto(
                membre.getId(),
                membre.getPrenom(),
                membre.getNom(),
                membre.getPoste(),
                membre.getBio(),
                membre.getEmail(),
                membre.getOrdre(),
                membre.getIsActif(),
                filePath
        );
    }
}
