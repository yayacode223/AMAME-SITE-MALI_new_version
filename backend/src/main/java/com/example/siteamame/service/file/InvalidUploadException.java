package com.example.siteamame.service.file;

/** Fichier refusé à l'upload : format non pris en charge, type inattendu ou taille excessive (HTTP 400). */
public class InvalidUploadException extends RuntimeException {
    public InvalidUploadException(String message) {
        super(message);
    }
}
