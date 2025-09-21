package com.example.siteamame.mapper;

import com.example.siteamame.dto.UserReqDto;
import com.example.siteamame.dto.UserResDto;
import com.example.siteamame.model.Filiere;
import com.example.siteamame.model.User;
import com.example.siteamame.model.enumeration.FileType;
import com.example.siteamame.model.enumeration.RoleType;
import com.example.siteamame.repository.FiliereRepo;
import lombok.AllArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;


import java.util.Optional;

@AllArgsConstructor

@Component
public class UserMapperDto {
    private final PasswordEncoder passwordEncoder;
    private final FiliereRepo filiereRepo;

    public UserResDto UserToDto(User user) {
        UserResDto userResDto = new UserResDto();
        userResDto.setId(user.getId());
        userResDto.setNom(user.getNom());
        userResDto.setPrenom(user.getPrenom());
        userResDto.setEmail(user.getEmail());
        userResDto.setEtablissement(user.getEtablissement());

        if (user.getFiliere() != null) {
            userResDto.setFiliere_serie(user.getFiliere().getNom());
        }

        userResDto.setBirthDate(user.getBirthDate());
        userResDto.setVille(user.getVille());
        userResDto.setSexe(user.getSexe());
        userResDto.setAdresse(user.getAdresse());
        userResDto.setPhone(user.getPhone());
        userResDto.setPays(user.getPays());
        userResDto.setNiveauEtude(user.getNiveauEtude());
        userResDto.setCodePostal(user.getCodePostal());

        // Mapping des rôles
        userResDto.setRole(RoleType.USER);

        //Filtrage des fichiers
        if (user.getFiles() != null) {
            user.getFiles().forEach(file -> {
                if (file.getFileType() == FileType.IMAGE) {
                    userResDto.setImagePath(file.getFilePath());
                } else if (file.getFileType() == FileType.DOCUMENT) {
                    userResDto.setCvPath(file.getFilePath());
                }
            });
        }
        return userResDto;
    }

    public User DtoToUser(UserReqDto userReqDto) {
        User user = new User();

        user.setNom(userReqDto.getNom());
        user.setPrenom(userReqDto.getPrenom());
        user.setEmail((userReqDto.getEmail()));
        user.setPassword(passwordEncoder.encode(userReqDto.getPassword()));
        user.setEtablissement(userReqDto.getEtablissement());
        user.setBirthDate(userReqDto.getBirthDate());
        user.setVille(userReqDto.getVille());
        user.setAdresse(userReqDto.getAdresse());
        user.setPhone(userReqDto.getPhone());
        user.setSexe(userReqDto.getSexe());
        user.setRole(RoleType.USER);
        user.setPays(userReqDto.getPays());
        user.setNiveauEtude(userReqDto.getNiveauEtude());
        user.setCodePostal(userReqDto.getCodePostal());

        if(userReqDto.getFiliereId()!= null) {
            Optional<Filiere> filiere = filiereRepo.findById(userReqDto.getFiliereId());
            filiere.ifPresent(user::setFiliere);
        }
        return user;
    }

}
