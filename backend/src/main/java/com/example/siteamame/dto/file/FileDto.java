package com.example.siteamame.dto.file;

import com.example.siteamame.enumeration.FileType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FileDto {
    private String fileName;
    private FileType fileType;
    private String filePath;
    private String fileMimeType;
    private long fileSize;
}
