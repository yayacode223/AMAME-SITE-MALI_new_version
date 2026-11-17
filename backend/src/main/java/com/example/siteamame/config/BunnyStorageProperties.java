package com.example.siteamame.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.time.Duration;

/**
 * Bunny Storage (app.storage.bunny.*), lu seulement avec STORAGE_PROVIDER=bunny (étape 3).
 *
 * Deux zones : la publique sert les médias par le CDN, la privée garde les CV et photos des inscrits
 * (clés sous uploads/utilisateur/), lus uniquement par le backend. La zone d'un fichier se déduit de
 * sa clé, jamais d'une colonne en base.
 *
 * Budget d'un appel (DT5) : 5 s pour la connexion, 20 s pour la réponse, 2 tentatives au plus. Une
 * transaction qui envoie un fichier n'est ainsi jamais bloquée plus d'une quarantaine de secondes.
 *
 * @param endpoint       point d'accès de la région de stockage, sans « / » final
 * @param publicZone     zone des fichiers publics
 * @param privateZone    zone des fichiers privés (uploads/utilisateur/)
 * @param connectTimeout délai d'établissement de la connexion
 * @param timeout        délai d'obtention de la réponse, par tentative
 * @param attempts       nombre de tentatives pour une erreur réseau ou une réponse 5xx
 */
@ConfigurationProperties(prefix = "app.storage.bunny")
public record BunnyStorageProperties(
        @DefaultValue("https://storage.bunnycdn.com") String endpoint,
        @DefaultValue Zone publicZone,
        @DefaultValue Zone privateZone,
        @DefaultValue("5s") Duration connectTimeout,
        @DefaultValue("20s") Duration timeout,
        @DefaultValue("2") int attempts) {

    /**
     * Une zone de stockage et son mot de passe (« Password » du panneau Bunny, qui permet d'écrire).
     * Le mot de passe n'apparaît jamais dans {@link #toString()}, ni donc dans un message d'erreur.
     */
    public record Zone(@DefaultValue("") String name, @DefaultValue("") String accessKey) {

        public boolean configured() {
            return name != null && !name.isBlank() && accessKey != null && !accessKey.isBlank();
        }

        @Override
        public String toString() {
            return "Zone[name=" + name + ", accessKey=" + (accessKey == null || accessKey.isBlank() ? "absent" : "***") + "]";
        }
    }
}
