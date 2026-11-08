package com.example.siteamame.service.file;

import com.example.siteamame.config.StorageProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.function.IntSupplier;

/**
 * Tâche de purge (docs/03, §1.4, DT8) : efface du stockage les objets dont la ligne file_entity a été
 * supprimée depuis plus longtemps que la rétention (STORAGE_PURGE_RETENTION, 10 jours).
 *
 * Les entrées arrivent dans storage_purge_queue par le déclencheur de la base (migration V3), jamais
 * par le code : toute suppression d'une ligne y est inscrite, quelle que soit son origine.
 *
 * Fonctionnement, identique en stockage local et chez Bunny :
 *   1. une courte transaction réserve un lot d'entrées échues (SKIP LOCKED : deux instances du
 *      backend ne prennent jamais la même entrée) en notant la tentative ;
 *   2. les objets sont effacés hors transaction : aucune connexion n'est immobilisée pendant les
 *      appels au stockage (DT5) ;
 *   3. une seconde courte transaction marque les entrées purgées, ou note l'erreur. Une entrée en
 *      échec est reprise à la prochaine exécution.
 * L'effacement est idempotent : un objet déjà absent n'est pas une erreur.
 *
 * Garde-fous : une entrée dont la clé est de nouveau référencée par une ligne (restauration) n'est
 * jamais purgée, elle est retirée de la file ; seules les clés sous uploads/ sont effacées.
 *
 * Désactivée par défaut (le bean n'existe pas) : activée explicitement en production uniquement (I6).
 * Planifiée une fois par nuit, dans la fenêtre commune aux tâches qui réveillent la base.
 */
@Component
@ConditionalOnProperty(name = "app.storage.purge.enabled", havingValue = "true")
public class StoragePurgeJob {

    private static final Logger log = LoggerFactory.getLogger(StoragePurgeJob.class);

    /** En dessous, une erreur de saisie (une durée en heures, en minutes) est plus probable qu'un choix. */
    static final Duration MIN_RETENTION = Duration.ofDays(1);
    /** Durée de conservation des entrées purgées, que lit la sauvegarde (DT9). */
    static final int PURGED_HISTORY_DAYS = 60;
    private static final int BATCH_SIZE = 100;
    /** Borne le travail d'une exécution ; le reste attend la nuit suivante. */
    private static final int MAX_BATCHES_PER_RUN = 50;
    private static final int MAX_ERROR_LENGTH = 1000;

    private static final String CLAIM = """
            UPDATE public.storage_purge_queue
               SET attempts = attempts + 1, last_attempt_at = now()
             WHERE id IN (
                   SELECT q.id
                     FROM public.storage_purge_queue q
                    WHERE q.purged_at IS NULL
                      AND q.requested_at <= now() - make_interval(secs => ?)
                      AND (q.last_attempt_at IS NULL OR q.last_attempt_at < now() - interval '30 minutes')
                      AND NOT EXISTS (SELECT 1 FROM public.file_entity f WHERE f.file_path = q.object_key)
                    ORDER BY q.requested_at, q.id
                    LIMIT ?
                      FOR UPDATE SKIP LOCKED)
            RETURNING id, object_key
            """;

    private static final String CANCEL_REFERENCED = """
            DELETE FROM public.storage_purge_queue q
             WHERE q.purged_at IS NULL
               AND EXISTS (SELECT 1 FROM public.file_entity f WHERE f.file_path = q.object_key)
            """;

    private static final String FORGET_PURGED =
            "DELETE FROM public.storage_purge_queue WHERE purged_at < now() - make_interval(days => ?)";

    private final JdbcTemplate jdbc;
    private final TransactionTemplate tx;
    private final FileStorageService storage;
    private final Duration retention;

    public StoragePurgeJob(JdbcTemplate jdbc, PlatformTransactionManager transactionManager,
                           FileStorageService storage, StorageProperties props) {
        this.retention = props.purge().retention();
        if (retention.compareTo(MIN_RETENTION) < 0) {
            throw new IllegalStateException("STORAGE_PURGE_RETENTION=" + retention + " : au moins "
                    + MIN_RETENTION.toDays() + " jour. La rétention doit dépasser la fenêtre de restauration "
                    + "de la base (10 jours recommandés, docs/03 §7.2). Un nombre sans unité compte des jours.");
        }
        this.jdbc = jdbc;
        this.tx = new TransactionTemplate(transactionManager);
        this.storage = storage;
        log.info("Purge du stockage activée : rétention {} jour(s), planification « {} » (UTC)",
                retention.toDays(), props.purge().schedule());
    }

    @Scheduled(cron = "${app.storage.purge.schedule}", zone = "UTC")
    public void scheduledPurge() {
        try {
            purgeOlderThan(retention);
        } catch (RuntimeException e) {
            log.error("Purge du stockage interrompue, reprise à la prochaine exécution : {}", e.toString());
        }
    }

    /**
     * Purge les entrées demandées depuis plus de {@code age}. La planification passe la rétention
     * configurée ; un test peut passer une durée plus courte.
     */
    public PurgeResult purgeOlderThan(Duration age) {
        int cancelled = inTransaction(() -> jdbc.update(CANCEL_REFERENCED));
        if (cancelled > 0) {
            log.warn("Purge : {} entrée(s) retirée(s) de la file, leur clé étant de nouveau référencée", cancelled);
        }
        int forgotten = inTransaction(() -> jdbc.update(FORGET_PURGED, PURGED_HISTORY_DAYS));

        int purged = 0;
        int failed = 0;
        for (int batch = 0; batch < MAX_BATCHES_PER_RUN; batch++) {
            List<Entry> claimed = tx.execute(status -> jdbc.query(CLAIM,
                    (rs, i) -> new Entry(rs.getLong("id"), rs.getString("object_key")),
                    (double) age.toSeconds(), BATCH_SIZE));
            if (claimed == null || claimed.isEmpty()) {
                break;
            }

            List<Long> done = new ArrayList<>();
            List<Failure> errors = new ArrayList<>();
            for (Entry entry : claimed) {
                try {
                    if (!entry.key().startsWith(StoragePaths.ROOT_PREFIX)) {
                        throw new IllegalArgumentException("clé hors de " + StoragePaths.ROOT_PREFIX + " : jamais purgée");
                    }
                    storage.delete(entry.key());
                    done.add(entry.id());
                } catch (Exception e) {
                    errors.add(new Failure(entry.id(), truncate(e.toString())));
                    log.warn("Purge : échec pour {} ({}), nouvelle tentative à la prochaine exécution",
                            entry.key(), e.toString());
                }
            }

            inTransaction(() -> {
                jdbc.batchUpdate(
                        "UPDATE public.storage_purge_queue SET purged_at = now(), last_error = NULL WHERE id = ?",
                        done, done.size(), (ps, id) -> ps.setLong(1, id));
                jdbc.batchUpdate(
                        "UPDATE public.storage_purge_queue SET last_error = ? WHERE id = ?",
                        errors, errors.size(), (ps, f) -> {
                            ps.setString(1, f.error());
                            ps.setLong(2, f.id());
                        });
                return 0;
            });
            purged += done.size();
            failed += errors.size();
        }

        PurgeResult result = new PurgeResult(purged, failed, cancelled, forgotten);
        if (purged + failed + cancelled + forgotten > 0) {
            log.info("Purge du stockage : {}", result);
        }
        return result;
    }

    private int inTransaction(IntSupplier work) {
        Integer n = tx.execute(status -> work.getAsInt());
        return n == null ? 0 : n;
    }

    private static String truncate(String message) {
        return message.length() <= MAX_ERROR_LENGTH ? message : message.substring(0, MAX_ERROR_LENGTH);
    }

    private record Entry(long id, String key) {}

    private record Failure(long id, String error) {}

    /**
     * @param purged    objets effacés et entrées marquées purgées
     * @param failed    échecs, repris à la prochaine exécution
     * @param cancelled entrées retirées de la file car leur clé est de nouveau référencée
     * @param forgotten entrées purgées depuis plus de 60 jours, supprimées de la file
     */
    public record PurgeResult(int purged, int failed, int cancelled, int forgotten) {}
}
