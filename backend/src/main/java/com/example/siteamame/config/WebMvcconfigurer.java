package com.example.siteamame.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * Sert /uploads/** depuis le dossier du stockage local. Utile en développement hors Docker ;
 * en production, c'est Nginx qui sert ces fichiers. Inactif dès que le stockage n'est plus local.
 */
@Configuration
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "local", matchIfMissing = true)
public class WebMvcconfigurer implements WebMvcConfigurer {

    private final String uploadsLocation;

    public WebMvcconfigurer(StorageProperties props) {
        // Calculé depuis la configuration, et non figé sur /app/uploads/ : fonctionne aussi sous Windows.
        // Le « / » final est obligatoire : sans lui, Spring ne traite pas l'emplacement comme un dossier.
        String location = Paths.get(props.local().uploadDir()).toAbsolutePath().normalize().toUri().toString();
        this.uploadsLocation = location.endsWith("/") ? location : location + "/";
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadsLocation);
    }
}
