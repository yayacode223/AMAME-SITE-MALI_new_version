-- Étape 3 de la migration Neon/Bunny (docs/03, écart E30) : le contrat de métadonnées devient complet.
--
-- V2 a posé le format de la clé, le type MIME et la taille sans vérifier les lignes existantes
-- (NOT VALID), et laissé l'empreinte SHA-256 facultative le temps de la calculer pour l'existant.
-- En production, le 17 novembre 2026, toutes les lignes sont conformes et ont leur empreinte
-- (inventory.sh : 26 lignes, 0 clé hors format, 0 MIME ou taille manquants, 0 sans empreinte).
--
-- La copie vers Bunny (étape 3.3) envoie l'empreinte enregistrée en base, que Bunny contrôle à la
-- réception : chaque ligne doit en avoir une.
--
-- Échoue, sans rien modifier (transaction), si une ligne n'est pas conforme : lancer alors
-- inventory.sh et backfill-sha256.sh, traiter les lignes signalées, puis redémarrer.
-- Conséquence : backend-v1.2, qui n'enregistre pas d'empreinte, ne peut plus écrire de fichier.
-- Le retour arrière d'une étape ultérieure se fait vers backend-v1.3 au plus loin.
--
-- SQL PostgreSQL standard, noms qualifiés, aucun réglage de session (portabilité, §6.2).

ALTER TABLE public.file_entity VALIDATE CONSTRAINT file_entity_file_path_format;
ALTER TABLE public.file_entity VALIDATE CONSTRAINT file_entity_file_mime_type_present;
ALTER TABLE public.file_entity VALIDATE CONSTRAINT file_entity_file_size_present;

ALTER TABLE public.file_entity ALTER COLUMN file_sha256 SET NOT NULL;
