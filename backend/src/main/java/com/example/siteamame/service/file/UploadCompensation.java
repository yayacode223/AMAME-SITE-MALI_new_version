package com.example.siteamame.service.file;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Compensation d'un upload (docs/03, §1.4) : un objet tout juste écrit est effacé immédiatement si
 * la transaction qui devait enregistrer sa ligne est annulée.
 *
 * Aucune transaction validée n'a jamais référencé cet objet : l'effacer tout de suite est sans danger,
 * y compris vis-à-vis d'une restauration de la base. Seule l'annulation certaine déclenche
 * l'effacement ; une issue inconnue (connexion perdue pendant la validation) le laisse en place,
 * car la ligne a peut-être été validée. Si l'effacement échoue, l'objet reste orphelin : la
 * réconciliation le retrouvera (I2). Un orphelin invisible vaut mieux qu'une référence cassée.
 *
 * Commun à toutes les implémentations de {@link FileStorageService}.
 */
final class UploadCompensation {

    private static final Logger log = LoggerFactory.getLogger(UploadCompensation.class);

    private UploadCompensation() {}

    /** À appeler juste après l'écriture de l'objet {@code key}, dans la transaction métier. */
    static void deleteOnRollback(String key, FileStorageService storage) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            // Tous les services qui stockent un fichier sont transactionnels. Hors transaction, rien
            // n'annulera la ligne : l'appelant reste responsable de l'objet.
            log.debug("Upload {} hors transaction : aucune compensation enregistrée", key);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_ROLLED_BACK) {
                    return;
                }
                try {
                    storage.delete(key);
                    log.info("Transaction annulée : objet {} effacé (compensation)", key);
                } catch (Exception e) {
                    log.warn("Transaction annulée : l'objet {} n'a pas pu être effacé et reste orphelin ({})",
                            key, e.toString());
                }
            }
        });
    }
}
