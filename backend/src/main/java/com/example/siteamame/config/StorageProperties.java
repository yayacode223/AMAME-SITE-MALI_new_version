package com.example.siteamame.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.boot.convert.DurationUnit;

import java.time.Duration;
import java.time.temporal.ChronoUnit;

/**
 * Configuration du stockage des fichiers (app.storage.*), alimentée par les variables
 * STORAGE_PROVIDER, MEDIA_BASE_URL, UPLOAD_DIR et STORAGE_PURGE_*.
 *
 * @param provider      implémentation active de FileStorageService
 * @param publicBaseUrl base des URL publiques, sans « / » final ; vide : URL relatives (/uploads/…)
 * @param local         réglages du stockage sur disque
 * @param purge         effacement différé des objets dont la ligne a été supprimée
 */
@ConfigurationProperties(prefix = "app.storage")
public record StorageProperties(
        @DefaultValue("local") String provider,
        @DefaultValue("") String publicBaseUrl,
        @DefaultValue Local local,
        @DefaultValue Purge purge) {

    /** @param uploadDir dossier qui contient un sous-dossier par type de contenu */
    public record Local(@DefaultValue("uploads") String uploadDir) {}

    /**
     * Tâche de purge (docs/03, §1.4 et étape 2).
     *
     * @param enabled   désactivée par défaut ; activée explicitement en production uniquement (I6)
     * @param retention délai entre la suppression d'une ligne et l'effacement de l'objet. Doit
     *                  toujours dépasser la fenêtre de restauration de la base (I5). Un nombre sans
     *                  unité compte des jours : « 10 » vaut 10 jours, et non 10 millisecondes
     * @param schedule  expression cron de Spring, en UTC, dans la fenêtre de nuit commune
     */
    public record Purge(
            @DefaultValue("false") boolean enabled,
            @DefaultValue("10d") @DurationUnit(ChronoUnit.DAYS) Duration retention,
            @DefaultValue("0 30 2 * * *") String schedule) {

        /** Purge désactivée, réglages par défaut (tests, outils). */
        public static Purge disabled() {
            return new Purge(false, Duration.ofDays(10), "0 30 2 * * *");
        }
    }
}
