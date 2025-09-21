//package com.example.siteamame.service;
//
//import com.example.siteamame.dto.ConcoursReqDto;
//import com.example.siteamame.dto.ConcoursResDto;
//import com.example.siteamame.exception.concours.RessourceNotFoundException;
//import com.example.siteamame.exception.user.UserAlreadyExistsException;
//import com.example.siteamame.mapper.ConcoursMapper;
//import com.example.siteamame.mapper.ConcoursReqToConcours;
//import com.example.siteamame.model.Concours;
//import com.example.siteamame.model.Filiere;
//import com.example.siteamame.repository.ConcoursRepo;
//import com.example.siteamame.repository.FiliereRepo;
//
//import lombok.AllArgsConstructor;
//import org.springframework.stereotype.Service;
//
//import java.util.HashSet;
//import java.util.List;
//import java.util.Optional;
//import java.util.Set;
//import java.util.stream.Collectors;
//
//@AllArgsConstructor
//@Service
//public class ConcoursSer {
//    private final ConcoursRepo concoursRepo;
//    private final FiliereRepo filiereRepo;
//    private final ConcoursMapper concoursMapper;
//    private final ConcoursReqToConcours concoursReqToConcours;
//
//    //GET All Concours
//    public List<ConcoursResDto> getAllConcours() {
//        List<Concours> listConcours = concoursRepo.findAll();
//        if (listConcours.isEmpty()) {
//            throw new RessourceNotFoundException("Pas de Concours disponibles");
//        }
//        return listConcours.stream()
//                .map(ConcoursMapper.INSTANCE::concoursToConcoursResDto).collect(Collectors.toList());
//    }
//
//    //Get A Specific Concours
//    public ConcoursResDto getSpecificConcours(Long id) {
//        Optional<Concours> concours = concoursRepo.findById(id);
//        if (concours.isPresent()) {
//            return ConcoursMapper.INSTANCE.concoursToConcoursResDto(concours.get());
//        } else {
//            throw new RessourceNotFoundException("Le Concours avec cet Id n'existe pas" + id);
//        }
//    }
//
//    //Create or Add Concours
//    public ConcoursResDto addConcours(ConcoursReqDto concoursReqDto) {
//        Optional<Concours> optionalConcours = concoursRepo.findByNom(concoursReqDto.getNom());
//        if (optionalConcours.isPresent()) {
//            throw new UserAlreadyExistsException("Le concours existe deja " + optionalConcours.get().getNom());
//        }
//
//        Concours concours = ConcoursReqToConcours.INSTANCE.concoursReqToConcours(concoursReqDto);
//        // Recuperation des Filieres avec leurs Id, pour etablir la liason avec table concours
//
//        // Injecte les objets depuis les IDs
//        Set<Filiere> filieres = concoursReqDto.getFilieresId().stream()
//                .map(id -> filiereRepo.findById(id).orElseThrow(() -> new RuntimeException("Filiere non trouvée")))
//                .collect(Collectors.toSet());
//
//        Concours saved = concoursRepo.save(concours);
//        return ConcoursMapper.INSTANCE.concoursToConcoursResDto(saved);
//    }
//
//    //Update Concours
//    public ConcoursResDto UpdateConcours(ConcoursReqDto concoursReqDto, Long id) {
//        Optional<Concours> optionalConcours = concoursRepo.findById(id);
//        if (optionalConcours.isEmpty()) {
//            throw new RessourceNotFoundException("Ce concours avec " + id + "n'existe pas");
//        }
//
//        if (concoursReqDto.getNom() != null && !concoursReqDto.getNom().isEmpty())
//            optionalConcours.get().setNom(concoursReqDto.getNom());
//        if (concoursReqDto.getDescription() != null && !concoursReqDto.getDescription().isEmpty())
//            optionalConcours.get().setDescription(concoursReqDto.getDescription());
//        if (concoursReqDto.getNiveau() != null && concoursReqDto.getNiveau().describeConstable().isPresent())
//            optionalConcours.get().setNiveau(concoursReqDto.getNiveau());
//        if (concoursReqDto.getStatus() != null && concoursReqDto.getStatus().describeConstable().isPresent())
//            optionalConcours.get().setStatus(concoursReqDto.getStatus());
//        if (concoursReqDto.getDateOuverture() != null)
//            optionalConcours.get().setDateOuverture(concoursReqDto.getDateOuverture().atStartOfDay());
//        if (concoursReqDto.getDateLimite() != null)
//            optionalConcours.get().setDateLimite(concoursReqDto.getDateLimite().atStartOfDay());
//        if (concoursReqDto.getLienOfficiel() != null && !concoursReqDto.getLienOfficiel().isEmpty())
//            optionalConcours.get().setLienOfficiel(concoursReqDto.getLienOfficiel());
//
//        if (concoursReqDto.getFilieresId() != null) {
//            Set<Filiere> filieres = new HashSet<>(filiereRepo.findAllById(concoursReqDto.getFilieresId()));
//            optionalConcours.get().setFilieres(filieres);
//        }
//
//
//        optionalConcours.get().setAvalable(true);
//
//        Concours update = concoursRepo.save(optionalConcours.get());
//
//        return ConcoursMapper.INSTANCE.concoursToConcoursResDto(update);
//    }
//
//    // Delete A Specific Concours
//    public void deleteConcours(Long id) {
//        Optional<Concours> concours = concoursRepo.findById(id);
//        if (concours.isEmpty()) {
//            throw new RessourceNotFoundException("Ce concours avec" + id + "n'existe pas");
//        } else {
//            concoursRepo.delete(concours.get());
//        }
//    }
//}
//
