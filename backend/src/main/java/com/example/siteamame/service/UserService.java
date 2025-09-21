package com.example.siteamame.service;

import com.example.siteamame.dto.UserReqDto;
import com.example.siteamame.dto.UserResDto;
import com.example.siteamame.exception.concours.RessourceNotFoundException;

import com.example.siteamame.mapper.UserMapperDto;
import com.example.siteamame.model.FileEntity;
import com.example.siteamame.model.User;
import com.example.siteamame.model.enumeration.FileType;
import com.example.siteamame.repository.FileEntityRepo;
import com.example.siteamame.repository.UserRepo;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import java.util.stream.Collectors;

@AllArgsConstructor
@Service
public class UserService {
    private final UserRepo userRepo;
    private final UserMapperDto userMapper;
    private final FileStorageService fileStorageSer;
    private final FileEntityRepo fileEntityRepo;

    //Get All Users
    public List<UserResDto> getAllUser() {
            List<User> listOfUser = userRepo.findAll();
            if(listOfUser.isEmpty()){
                return Collections.emptyList();
            }
            return listOfUser.stream()
                    .map(userMapper::UserToDto).collect(Collectors.toList());
    }

    //Get A Specific User
    public UserResDto getUserById(Long id) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new RessourceNotFoundException("Ce User n'existe pas"));
        return userMapper.UserToDto(user);
    }

    @Transactional
    public UserResDto register(UserReqDto userReqDto, MultipartFile cv, MultipartFile image) throws IOException {
//
        Optional<User> existingUser = userRepo.findByEmailIgnoreCase(userReqDto.getEmail());
        if(existingUser.isPresent())
            throw new RuntimeException("L'utilisateur existe deja");

        User user = userMapper.DtoToUser(userReqDto);

        List<FileEntity> files = new ArrayList<>();

        if(cv!= null && !cv.isEmpty()){
            FileEntity cvEntity = fileStorageSer.storeFile(cv, FileType.DOCUMENT);
            FileEntity saved = fileEntityRepo.save(cvEntity);
            files.add(saved);
        }

        if(image != null && !image.isEmpty()){
            FileEntity imageEntity = fileStorageSer.storeFile(image, FileType.IMAGE);
            FileEntity saved = fileEntityRepo.save(imageEntity);
            files.add(saved);
        }

        user.setFiles(files);
        User savedUser = userRepo.save(user);

        return userMapper.UserToDto(savedUser);
    }

}
