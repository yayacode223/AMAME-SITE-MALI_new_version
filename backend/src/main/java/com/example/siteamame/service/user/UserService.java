package com.example.siteamame.service.user;

import com.example.siteamame.exception.concours.RessourceNotFoundException;
import com.example.siteamame.dto.common.PageResponse;
import com.example.siteamame.dto.file.FileDto;
import com.example.siteamame.dto.user.UserRequestDto;
import com.example.siteamame.dto.user.UserReponseDto;
import com.example.siteamame.enumeration.RoleType;
import com.example.siteamame.exception.user.UserAlreadyExistsException;
import com.example.siteamame.mapper.FileMapper;
import com.example.siteamame.mapper.UserMapperDto;
import com.example.siteamame.model.File;
import com.example.siteamame.model.User;
import com.example.siteamame.enumeration.FileType;
import com.example.siteamame.repository.FileRepository;
import com.example.siteamame.repository.UserRepository;

import com.example.siteamame.service.file.FileStorageService;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import com.example.siteamame.config.CacheConfig;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
    private final FileStorageService fileStorageService;
    private final FileRepository fileRepository;
    private final FileMapper fileMapper;

    //Get All Users
    @Transactional(readOnly = true)
    public List<UserReponseDto> getAllUser() {
            List<User> listOfUser = userRepository.findAll();
            if(listOfUser.isEmpty()){
                return Collections.emptyList();
            }
            return listOfUser.stream()
                    .map(userMapper::UserToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<UserReponseDto> getAllUserPage(
            int page, int size, String sortBy, String sortDirection) {
        Sort sort = "DESC".equalsIgnoreCase(sortDirection)
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        return new PageResponse<>(
                userRepository.findAll(PageRequest.of(page, size, sort))
                        .map(userMapper::UserToDto));
    }

    //Get A Specific User
    @Transactional(readOnly = true)
    public UserReponseDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RessourceNotFoundException("Cet utilisateur est introuvable : il a peut-être été supprimé."));
        return userMapper.UserToDto(user);
    }

    @Transactional(rollbackFor = Exception.class)
    public UserReponseDto register(UserRequestDto userRequestDto, MultipartFile cv, MultipartFile image) throws IOException {

        Optional<User> existingUser = userRepository.findByEmailIgnoreCase(userRequestDto.getEmail());
        if(existingUser.isPresent())
            throw UserAlreadyExistsException.forEmail(); // 409 EMAIL_ALREADY_USED (était une erreur 500)

        User user = userMapper.DtoToUser(userRequestDto);
        // Endpoint public : tout compte naît USER, quel que soit le rôle envoyé dans la requête.
        // Un rôle supérieur s'attribue ensuite par /api/admin/users/{id}/role.
        user.setRole(RoleType.USER);

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

    @CacheEvict(cacheNames = CacheConfig.REQUEST_USER, allEntries = true)
    @Transactional(rollbackFor = Exception.class)
    public UserReponseDto update(Long id, UserRequestDto userRequestDto, MultipartFile cv, MultipartFile image) throws IOException {

        User userToUpdate = userRepository.findById(id)
                .orElseThrow(() -> new RessourceNotFoundException("Cet utilisateur est introuvable : il a peut-être été supprimé."));

        User user = userMapper.updateUser(userToUpdate, userRequestDto);

        // La collection gérée par Hibernate est modifiée sur place, jamais remplacée (orphanRemoval) :
        // un fichier retiré perd sa ligne, que la base inscrit dans la file de purge. L'ancien fichier
        // reste ainsi lisible jusqu'à la validation, et récupérable pendant la rétention.
        if (cv != null && !cv.isEmpty()) {
            replaceFile(user, cv, FileType.DOCUMENT);
        }
        if (image != null && !image.isEmpty()) {
            replaceFile(user, image, FileType.IMAGE);
        }

        User savedUser = userRepository.save(user);
        return userMapper.UserToDto(savedUser);
    }

    /** Remplace le fichier de ce type (CV ou photo) : le nouveau est stocké avant de retirer l'ancien. */
    private void replaceFile(User user, MultipartFile upload, FileType type) throws IOException {
        FileDto stored = fileStorageService.storeFile(upload, "utilisateur", type);
        File saved = fileRepository.save(fileMapper.convertDtoToFile(stored));
        List<File> files = user.getFiles();
        files.removeIf(file -> file.getFileType() == type);
        files.add(saved);
    }

    @CacheEvict(cacheNames = CacheConfig.REQUEST_USER, allEntries = true)
    @Transactional
    public void deleteUser(Long id){
        if(userRepository.existsById(id)){
            // Ses fichiers sont supprimés en cascade, donc inscrits dans la file de purge ; ses jetons
            // disparaissent avec lui ; adhésions, cotisations et dons restent, détachés (migration V4).
            userRepository.deleteById(id);
        }else{
            throw new RessourceNotFoundException("Cet utilisateur est introuvable : il a peut-être été supprimé.");
        }
    }

}
