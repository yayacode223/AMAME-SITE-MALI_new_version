-- Étape 2 de la migration Neon/Bunny (docs/03, §5, action 2.3) : file de purge.
--
-- Toute suppression d'une ligne file_entity inscrit sa clé dans storage_purge_queue, dans la même
-- transaction (§1.4) : la ligne disparaît et l'intention de purge est enregistrée ensemble ou pas
-- du tout. L'objet n'est effacé du stockage que par la tâche de purge, après la rétention
-- (STORAGE_PURGE_RETENTION, 10 jours), plus longue que toute fenêtre de restauration de la base (I5).
--
-- Annuler une suppression pendant la rétention : supprimer l'entrée de la file (et restaurer la ligne).
-- Migration additive : sans tâche de purge active, la file se remplit sans conséquence.

CREATE TABLE public.storage_purge_queue (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    -- Clé de l'objet, uploads/<dossier>/<uuid>.<ext> ; la zone se déduit de la clé.
    object_key character varying(255) NOT NULL,
    -- Date de la demande : celle de la transaction qui a supprimé la ligne.
    requested_at timestamp with time zone NOT NULL DEFAULT now(),
    -- Date de l'effacement effectif ; l'entrée est conservée 60 jours ensuite (DT9).
    purged_at timestamp with time zone,
    attempts integer NOT NULL DEFAULT 0,
    last_attempt_at timestamp with time zone,
    last_error character varying(1000)
);

-- Entrées à purger, dans l'ordre des demandes.
CREATE INDEX storage_purge_queue_pending_idx
    ON public.storage_purge_queue (requested_at) WHERE purged_at IS NULL;
-- Entrées purgées : nettoyage après 60 jours, et lecture par la sauvegarde (DT9).
CREATE INDEX storage_purge_queue_purged_idx
    ON public.storage_purge_queue (purged_at) WHERE purged_at IS NOT NULL;
CREATE INDEX storage_purge_queue_object_key_idx
    ON public.storage_purge_queue (object_key);

-- Voit toutes les suppressions : cascade, orphanRemoval, DELETE en masse, SQL manuel (DT4).
CREATE FUNCTION public.file_entity_enqueue_purge() RETURNS trigger
    LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.storage_purge_queue (object_key) VALUES (OLD.file_path);
    RETURN OLD;
END;
$$;

CREATE TRIGGER file_entity_enqueue_purge
    AFTER DELETE ON public.file_entity
    FOR EACH ROW
    EXECUTE FUNCTION public.file_entity_enqueue_purge();

-- TRUNCATE ne déclenche pas les déclencheurs de ligne : il viderait la table sans rien inscrire
-- dans la file, et laisserait tous les objets orphelins. Il est donc refusé.
CREATE FUNCTION public.file_entity_refuse_truncate() RETURNS trigger
    LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'TRUNCATE file_entity est refusé : utiliser DELETE, qui inscrit les clés dans storage_purge_queue'
        USING ERRCODE = 'integrity_constraint_violation';
END;
$$;

CREATE TRIGGER file_entity_refuse_truncate
    BEFORE TRUNCATE ON public.file_entity
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.file_entity_refuse_truncate();
