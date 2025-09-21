package com.example.siteamame.service;

import com.example.siteamame.model.FileEntity;
import com.example.siteamame.model.enumeration.FileType;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public interface FileStorageService {
    FileEntity storeFile(MultipartFile file, FileType type) throws IOException;

    Resource loadFileAsResource(Long fileId);
    void deleteFile(Long fileId);
}

