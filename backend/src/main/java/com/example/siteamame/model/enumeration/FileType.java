package com.example.siteamame.model.enumeration;


import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum FileType {
    IMAGE("Image"),
    DOCUMENT("Document");

    private final String label;
}
