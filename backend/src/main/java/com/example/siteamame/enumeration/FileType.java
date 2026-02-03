package com.example.siteamame.enumeration;


import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum FileType {
    IMAGE("Image"),
    DOCUMENT("Document");

    private final String label;
}
