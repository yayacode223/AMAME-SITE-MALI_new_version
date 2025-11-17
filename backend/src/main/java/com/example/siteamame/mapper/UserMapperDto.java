package com.example.siteamame.mapper;

import com.example.siteamame.dto.user.UserRequestDto;
import com.example.siteamame.dto.user.UserReponseDto;
import com.example.siteamame.model.Filiere;
import com.example.siteamame.model.User;
import com.example.siteamame.enumeration.FileType;
import com.example.siteamame.enumeration.RoleType;
import com.example.siteamame.repository.FiliereRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;


import java.util.Optional;

@AllArgsConstructor

@Component
public class UserMapperDto {
    private final PasswordEncoder passwordEncoder;
    private final FiliereRepository filiereRepo;

    public UserReponseDto UserToDto(User user) {
        UserReponseDto userReponseDto = new UserReponseDto();
        userReponseDto.setId(user.getId());
        userReponseDto.setNom(user.getNom());
        userReponseDto.setPrenom(user.getPrenom());
        userReponseDto.setEmail(user.getEmail());

        userReponseDto.setBirthDate(user.getBirthDate());
        userReponseDto.setVille(user.getVille());
        userReponseDto.setSexe(user.getSexe());
        userReponseDto.setAdresse(user.getAdresse());
        userReponseDto.setPhone(user.getPhone());
        userReponseDto.setPays(user.getPays());
        userReponseDto.setNiveauEtude(user.getNiveauEtude());
        userReponseDto.setCodePostal(user.getCodePostal());
        userReponseDto.setRole(user.getRole());

        //Filtrage des fichiers
        if (user.getFiles() != null) {
            user.getFiles().forEach(file -> {
                if (file.getFileType() == FileType.IMAGE) {
                    userReponseDto.setImagePath(file.getFilePath());
                } else if (file.getFileType() == FileType.DOCUMENT) {
                    userReponseDto.setCvPath(file.getFilePath());
                }
            });
        }
        return userReponseDto;
    }

    public User DtoToUser(UserRequestDto userRequestDto) {
        User user = new User();

        user.setNom(userRequestDto.getNom());
        user.setPrenom(userRequestDto.getPrenom());
        user.setEmail((userRequestDto.getEmail()));
        user.setPassword(passwordEncoder.encode(userRequestDto.getPassword()));
        user.setBirthDate(userRequestDto.getBirthDate());
        user.setVille(userRequestDto.getVille());
        user.setAdresse(userRequestDto.getAdresse());
        user.setPhone(userRequestDto.getPhone());
        if(userRequestDto.getRole() != null) {
            user.setRole(userRequestDto.getRole());
        }
        user.setSexe(userRequestDto.getSexe());
        user.setPays(userRequestDto.getPays());
        user.setNiveauEtude(userRequestDto.getNiveauEtude());
        user.setCodePostal(userRequestDto.getCodePostal());

        return user;
    }

    public User updateUser(User user, UserRequestDto userRequestDto) {

        user.setNom(userRequestDto.getNom());
        user.setPrenom(userRequestDto.getPrenom());
        user.setEmail((userRequestDto.getEmail()));
        user.setPassword(passwordEncoder.encode(userRequestDto.getPassword()));
        user.setBirthDate(userRequestDto.getBirthDate());
        user.setVille(userRequestDto.getVille());
        user.setAdresse(userRequestDto.getAdresse());
        user.setPhone(userRequestDto.getPhone());
        user.setSexe(userRequestDto.getSexe());
        user.setPays(userRequestDto.getPays());
        user.setNiveauEtude(userRequestDto.getNiveauEtude());
        user.setCodePostal(userRequestDto.getCodePostal());

        return user;
    }

}
