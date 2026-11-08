-- Étape 2 de la migration Neon/Bunny (docs/03, §5, action 2.2) : contrat de métadonnées des fichiers.
--
-- La base garantit elle-même (DT4) qu'une clé de fichier est unique et ne change jamais (I4),
-- et prépare l'empreinte SHA-256 qui servira de preuve d'intégrité pour la copie vers Bunny.
--
-- Migration additive : le code de l'étape 1 (backend-v1.2) reste compatible, il crée toujours
-- une clé neuve, conforme au format, avec son type MIME et sa taille, et ne modifie jamais une clé.
--
-- SQL PostgreSQL standard, noms qualifiés, aucun réglage de session (portabilité, §6.2).

-- Empreinte SHA-256 du contenu, en hexadécimal minuscule. Vide pour les fichiers déjà en base :
-- elle est calculée par ops/backup/backfill-sha256.sh, puis rendue obligatoire par une migration
-- ultérieure, une fois remplie pour 100 % des lignes.
ALTER TABLE public.file_entity ADD COLUMN file_sha256 character varying(64);

ALTER TABLE public.file_entity
    ADD CONSTRAINT file_entity_file_sha256_format
    CHECK (file_sha256 IS NULL OR file_sha256 ~ '^[0-9a-f]{64}$');

-- I4 : une clé désigne une seule ligne. Échoue si la base contient déjà un doublon :
-- l'inventaire croisé (ops/backup/inventory.sh) doit être passé avant le déploiement.
ALTER TABLE public.file_entity
    ADD CONSTRAINT file_entity_file_path_key UNIQUE (file_path);

-- I3 : format de la clé, uploads/<dossier>/<uuid>.<extension>, tout en minuscules.
-- Les trois contraintes suivantes sont posées NOT VALID : PostgreSQL les applique à toute ligne
-- insérée ou modifiée, sans vérifier l'existant. L'existant est contrôlé par l'inventaire croisé ;
-- elles seront validées (ALTER TABLE … VALIDATE CONSTRAINT) par une migration ultérieure.
ALTER TABLE public.file_entity
    ADD CONSTRAINT file_entity_file_path_format
    CHECK (file_path ~ '^uploads/[a-z0-9_-]+/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{1,10}$')
    NOT VALID;

ALTER TABLE public.file_entity
    ADD CONSTRAINT file_entity_file_mime_type_present
    CHECK (file_mime_type IS NOT NULL AND file_mime_type <> '')
    NOT VALID;

ALTER TABLE public.file_entity
    ADD CONSTRAINT file_entity_file_size_present
    CHECK (file_size IS NOT NULL AND file_size >= 0)
    NOT VALID;

-- I4 : une clé ne change jamais. Remplacer un fichier crée une nouvelle ligne et une nouvelle clé.
-- Le déclencheur protège aussi des écritures faites hors du backend (SQL manuel, scripts).
CREATE FUNCTION public.file_entity_key_is_immutable() RETURNS trigger
    LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.file_path IS DISTINCT FROM OLD.file_path THEN
        RAISE EXCEPTION 'file_entity.file_path est immuable (id %, clé %) : créer une nouvelle ligne',
            OLD.id, OLD.file_path
            USING ERRCODE = 'integrity_constraint_violation';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER file_entity_key_is_immutable
    BEFORE UPDATE OF file_path ON public.file_entity
    FOR EACH ROW
    EXECUTE FUNCTION public.file_entity_key_is_immutable();
