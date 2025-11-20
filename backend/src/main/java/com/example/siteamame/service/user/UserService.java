package com.example.siteamame.service.user;

import com.example.siteamame.dto.file.FileDto;
import com.example.siteamame.dto.user.UserRequestDto;
import com.example.siteamame.dto.user.UserReponseDto;
import com.example.siteamame.enumeration.RoleType;
import com.example.siteamame.exception.concours.RessourceNotFoundException;

import com.example.siteamame.mapper.FileMapper;
import com.example.siteamame.mapper.UserMapperDto;
import com.example.siteamame.model.File;
import com.example.siteamame.model.User;
import com.example.siteamame.enumeration.FileType;
import com.example.siteamame.repository.FileRepository;
import com.example.siteamame.repository.UserRepository;

import com.example.siteamame.service.file.FileStorageServiceImpl;
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
    private final UserRepository userRepository;
    private final UserMapperDto userMapper;
    private final FileStorageServiceImpl fileStorageService;
    private final FileRepository fileRepository;
    private final FileMapper fileMapper;

    //Get All Users
    public List<UserReponseDto> getAllUser() {
            List<User> listOfUser = userRepository.findAll();
            if(listOfUser.isEmpty()){
                return Collections.emptyList();
            }
            return listOfUser.stream()
                    .map(userMapper::UserToDto).collect(Collectors.toList());
    }

    //Get A Specific User
    public UserReponseDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RessourceNotFoundException("Ce User n'existe pas"));
        return userMapper.UserToDto(user);
    }

    @Transactional
    public UserReponseDto register(UserRequestDto userRequestDto, MultipartFile cv, MultipartFile image) throws IOException {

        Optional<User> existingUser = userRepository.findByEmailIgnoreCase(userRequestDto.getEmail());
        if(existingUser.isPresent())
            throw new RuntimeException("L'utilisateur existe deja");

        User user = userMapper.DtoToUser(userRequestDto);
        if(userRequestDto.getRole() == null) {
            user.setRole(RoleType.USER);
        }

        List<File> files = new ArrayList<>();

        if(cv!= null && !cv.isEmpty()){
            FileDto cvEntity = fileStorageService.storeFile(cv, "utilisateur", FileType.DOCUMENT);
            File file  = fileMapper.convertDtoToFile(cvEntity);
            File saved = fileRepository.save(file);
            files.add(saved);
        }

        if(image != null && !image.isEmpty()){
            FileDto imageEntity = fileStorageService.storeFile(image, "utilisateur", FileType.IMAGE);
            File file = fileMapper.convertDtoToFile(imageEntity);
            File saved = fileRepository.save(file);
            files.add(saved);
        }

        user.setFiles(files);
        User savedUser = userRepository.save(user);

        return userMapper.UserToDto(savedUser);
    }

    @Transactional
    public UserReponseDto update(Long id, UserRequestDto userRequestDto, MultipartFile cv, MultipartFile image) throws IOException {

        User userToUpdate = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cet User n'existe pas avec Id : " + id));

        User user = userMapper.updateUser(userToUpdate, userRequestDto);
        List<File> files = new ArrayList<>();

        // Récupérer les fichiers existants
        List<File> existingFiles = user.getFiles() != null ?
                new ArrayList<>(user.getFiles()) : new ArrayList<>();

        // Gérer le CV
        if (cv != null && !cv.isEmpty()) {
            // Trouver et supprimer l'ancien CV s'il existe
            Optional<File> oldCv = existingFiles.stream()
                    .filter(file -> file.getFileType().equals(FileType.DOCUMENT))
                    .findFirst();

            if (oldCv.isPresent()) {
                // Supprimer physiquement le fichier
                fileStorageService.deleteFile(oldCv.get().getFileName(), "utilisateur");
                // Supprimer de la liste
                existingFiles.remove(oldCv.get());
            }

            // Ajouter le nouveau CV
            FileDto fileDto = fileStorageService.storeFile(cv, "utilisateur", FileType.DOCUMENT);
            File file = fileMapper.convertDtoToFile(fileDto);
            File savedFile = fileRepository.save(file);
            files.add(savedFile);
        }

        // Gérer l'image
        if (image != null && !image.isEmpty()) {
            // Trouver et supprimer l'ancienne image si elle existe
            Optional<File> oldImage = existingFiles.stream()
                    .filter(file -> file.getFileType().equals(FileType.IMAGE))
                    .findFirst();

            if (oldImage.isPresent()) {
                // Supprimer physiquement le fichier
                fileStorageService.deleteFile(oldImage.get().getFileName(), "utilisateur");
                // Supprimer de la liste
                existingFiles.remove(oldImage.get());
            }

            // Ajouter la nouvelle image
            FileDto fileDto = fileStorageService.storeFile(image, "utilisateur", FileType.IMAGE);
            File file = fileMapper.convertDtoToFile(fileDto);
            File savedFile = fileRepository.save(file);
            files.add(savedFile);
        }

        // Ajouter les fichiers existants non modifiés
        files.addAll(existingFiles);

        if (!files.isEmpty()) {
            user.setFiles(files);
        } else {
            user.setFiles(null);
        }

        User savedUser = userRepository.save(user);
        return userMapper.UserToDto(savedUser);
    }

    public void deleteUser(Long id){
        if(userRepository.existsById(id)){
            userRepository.deleteById(id);
        }else{
            throw new RuntimeException("Cet Utilisateur avec Id : "+ id + " n'existe pas");
        }
    }

}
