-- Droits des rôles applicatifs sur la base (étape 4 : docs/03, §5, action 4.1 ; docs/neon/02, §3.3).
--
-- Exécuté par le rôle PROPRIÉTAIRE de la base (amame_owner), celui qui a restauré le dump et qui
-- exécute les migrations Flyway. Idempotent : se relance sans risque. Ne crée aucun rôle et ne touche
-- à aucun mot de passe : amame_app, amame_scraper et amame_backup existent déjà, créés dans l'éditeur
-- SQL de la console Neon (procédure dans ops/README.md). Lancé par db-transfer.sh, ou à la main :
--   psql "$TARGET_DATABASE_URL" -v ON_ERROR_STOP=1 -f /usr/local/share/amame/db-grants.sql

\set ON_ERROR_STOP on
SELECT current_database() AS dbname \gset

-- Connexion et schéma
GRANT CONNECT ON DATABASE :"dbname" TO amame_app, amame_scraper, amame_backup;
GRANT USAGE ON SCHEMA public TO amame_app, amame_scraper, amame_backup;

-- Backend : les données, jamais le schéma. Les migrations Flyway passent par le rôle propriétaire.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO amame_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO amame_app;
-- L'historique Flyway n'appartient qu'aux migrations : lecture seule pour le backend.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.flyway_schema_history FROM amame_app;

-- Scrapers : seulement les trois tables qu'ils alimentent (lecture pour éviter les doublons, insertion,
-- mise à jour), et la séquence classique de bourse. Rien sur file_entity ni sur la file de purge.
GRANT SELECT, INSERT, UPDATE ON TABLE public.bourse, public.etablissements, public.opportunites TO amame_scraper;
GRANT USAGE, SELECT ON SEQUENCE public.bourse_id_seq TO amame_scraper;

-- Sauvegardes, inventaire, réconciliation : lecture seule.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO amame_backup;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO amame_backup;

-- Tables et séquences créées plus tard par les migrations (exécutées par ce même rôle propriétaire).
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO amame_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO amame_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO amame_backup;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO amame_backup;
