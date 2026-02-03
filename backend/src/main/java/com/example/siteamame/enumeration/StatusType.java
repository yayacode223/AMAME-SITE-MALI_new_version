package com.example.siteamame.enumeration;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum StatusType {
    NATIONAL("National"),
    INTERNATIONAL("International");

    private final String label;
}

