-- Suppression d'un compte utilisateur (constat C7 du suivi, docs/03).
--
-- Avant cette migration, DELETE FROM users échouait dès que le compte avait un jeton de session,
-- un jeton de réinitialisation, une adhésion, une cotisation ou un don : les clés étrangères
-- n'avaient aucune action. Décision de l'équipe du 7 novembre 2026 :
--   - ce qui n'a de sens qu'avec le compte disparaît avec lui : jetons, permissions, liens vers
--     ses fichiers (les fichiers eux-mêmes sont supprimés par le backend, donc inscrits dans la
--     file de purge) ;
--   - l'historique (adhésions, cotisations, dons) est conservé, détaché du compte : user_id vide ;
--   - une permission accordée par le compte supprimé reste valable : granted_by devient vide.
--
-- Les noms des clés étrangères existantes ont été générés par Hibernate : ils sont retrouvés dans
-- le catalogue plutôt qu'écrits en dur, pour que la migration s'applique aussi à une base dont le
-- schéma a été créé par une autre version d'Hibernate. SQL PostgreSQL standard.

DO $$
DECLARE
    fk record;
BEGIN
    FOR fk IN
        SELECT c.conrelid::regclass AS table_name, c.conname AS constraint_name
          FROM pg_catalog.pg_constraint c
          JOIN pg_catalog.pg_attribute a
            ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
         WHERE c.contype = 'f'
           AND c.confrelid = 'public.users'::regclass
           AND array_length(c.conkey, 1) = 1
           AND (c.conrelid, a.attname::text) IN (
                 ('public.refresh_token'::regclass::oid, 'user_id'),
                 ('public.password_reset_tokens'::regclass::oid, 'user_id'),
                 ('public.user_permission'::regclass::oid, 'user_id'),
                 ('public.user_permission'::regclass::oid, 'granted_by'),
                 ('public.users_files'::regclass::oid, 'user_id'),
                 ('public.file_entity'::regclass::oid, 'user_id'),
                 ('public.adhesions'::regclass::oid, 'user_id'),
                 ('public.cotisations'::regclass::oid, 'user_id'),
                 ('public.dons'::regclass::oid, 'user_id'))
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', fk.table_name, fk.constraint_name);
    END LOOP;
END;
$$;

-- Disparaissent avec le compte.
ALTER TABLE public.refresh_token
    ADD CONSTRAINT refresh_token_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

ALTER TABLE public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

ALTER TABLE public.user_permission
    ADD CONSTRAINT user_permission_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

ALTER TABLE public.users_files
    ADD CONSTRAINT users_files_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

-- Restent, détachés du compte.
ALTER TABLE public.user_permission
    ADD CONSTRAINT user_permission_granted_by_fkey
    FOREIGN KEY (granted_by) REFERENCES public.users (id) ON DELETE SET NULL;

-- Colonne jamais renseignée par le backend (le lien passe par users_files) ; conservée telle quelle.
ALTER TABLE public.file_entity
    ADD CONSTRAINT file_entity_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE SET NULL;

ALTER TABLE public.adhesions ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.adhesions
    ADD CONSTRAINT adhesions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE SET NULL;

ALTER TABLE public.cotisations ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.cotisations
    ADD CONSTRAINT cotisations_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE SET NULL;

ALTER TABLE public.dons ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.dons
    ADD CONSTRAINT dons_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE SET NULL;
