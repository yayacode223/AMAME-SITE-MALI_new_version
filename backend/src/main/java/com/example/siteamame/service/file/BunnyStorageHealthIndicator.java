package com.example.siteamame.service.file;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * État de Bunny Storage dans /actuator/health, d'après le dernier appel réel : aucune requête n'est
 * envoyée à Bunny pour répondre à une sonde.
 *
 * Hors des sondes de vivacité et de disponibilité (/actuator/health/liveness et /readiness, qui ne
 * contiennent que l'état de l'application) : une panne de Bunny ne doit jamais faire redémarrer le
 * backend. Elle n'empêche que les uploads et la lecture des fichiers privés.
 */
@Component("bunnyStorage")
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "bunny")
public class BunnyStorageHealthIndicator implements HealthIndicator {

    private final BunnyFileStorageService storage;

    public BunnyStorageHealthIndicator(BunnyFileStorageService storage) {
        this.storage = storage;
    }

    @Override
    public Health health() {
        BunnyFileStorageService.Outcome outcome = storage.lastOutcome();
        if (outcome == null) {
            return Health.unknown().withDetail("dernierAppel", "aucun depuis le démarrage").build();
        }
        if (outcome.success()) {
            return Health.up().withDetail("dernierSucces", outcome.at().toString()).build();
        }
        return Health.down()
                .withDetail("dernierEchec", outcome.at().toString())
                .withDetail("erreur", String.valueOf(outcome.error()))
                .build();
    }
}
