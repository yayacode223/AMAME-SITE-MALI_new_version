package com.example.siteamame.mapper;

import com.example.siteamame.dto.file.FileDto;
import com.example.siteamame.model.File;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class FileMapper {

    public File convertDtoToFile(FileDto fileDto) {
        File file = new File();
        file.setFileName(fileDto.getFileName());
        file.setFileSize(fileDto.getFileSize());
        file.setFileMimeType(fileDto.getFileMimeType());
        file.setFilePath(fileDto.getFilePath());
        file.setFileType(fileDto.getFileType());
        file.setUploadDate(LocalDateTime.now());

        return file;
    }

    public FileDto convertFileToDto(File file) {
        FileDto fileDto = new FileDto();
        fileDto.setFileName(file.getFileName());
        fileDto.setFileSize(file.getFileSize());
        fileDto.setFileMimeType(file.getFileMimeType());
        fileDto.setFilePath(file.getFilePath());
        fileDto.setFileSize(file.getFileSize());
        fileDto.setFileType(file.getFileType());
        return fileDto;
    }
}
