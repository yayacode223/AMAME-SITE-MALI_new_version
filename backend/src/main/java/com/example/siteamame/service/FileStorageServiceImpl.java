package com.example.siteamame.service;

import com.example.siteamame.exception.concours.RessourceNotFoundException;
import com.example.siteamame.model.FileEntity;
import com.example.siteamame.model.enumeration.FileType;
import com.example.siteamame.repository.FileEntityRepo;
import lombok.AllArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;


import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.UUID;

@AllArgsConstructor
@Service
public class FileStorageServiceImpl implements FileStorageService {

    private final Path rootLocation = Paths.get("uploads");
    private final FileEntityRepo fileEntityRepo;

    @Override
    public FileEntity storeFile(MultipartFile file, FileType type) throws IOException {
        String fileName = UUID.randomUUID() + "_"+ file.getOriginalFilename();
        Path destination = rootLocation.resolve(fileName);
        Files.copy(file.getInputStream(), destination);

        FileEntity entity = new FileEntity();
        entity.setFileName(fileName);
        entity.setFilePath(destination.toString());
        entity.setFileType(type);
        entity.setFileSize(file.getSize());
        entity.setFileMimeType(file.getContentType());
        entity.setUploadDate(LocalDateTime.now());
        return entity;
    }

    @Override
    public Resource loadFileAsResource(Long fileId){
        FileEntity file = fileEntityRepo.findById(fileId)
                .orElseThrow(()-> new RessourceNotFoundException("Le fichier n'existe pas"));
        Path filePath = Paths.get(file.getFileName());
        try {
            return new  UrlResource(filePath.toUri());
        } catch (MalformedURLException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void deleteFile(Long fileId) {
        FileEntity file = fileEntityRepo.findById(fileId)
                .orElseThrow(()-> new RessourceNotFoundException("Le fichier n'existe pas"));
        try {
            Files.deleteIfExists(Paths.get(file.getFilePath()));
            fileEntityRepo.deleteById(fileId);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
