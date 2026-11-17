-- V1.1 — Listes de valeurs autorisées alignées sur les énumérations du code (écart E47 du suivi).
--
-- Constat du 16 novembre 2026 (empreintes du schéma de production) : Hibernate (ddl-auto=update)
-- a créé ces deux contraintes CHECK une fois pour toutes et ne les a jamais mises à jour.
-- Les valeurs ajoutées ensuite au code y manquent :
--   - users_role_check : VISITOR (RoleType) ;
--   - user_permission_permission_check : ADHESION_MANAGE (Permission). En production, accorder ou
--     retirer cette permission à un compte était refusé par la base.
-- V1 décrit la production telle qu'elle était ; cette migration la remet en accord avec le code,
-- en production comme sur une base neuve. Les lignes existantes respectent déjà les nouvelles
-- listes, qui ne font qu'ajouter des valeurs : la vérification à l'ajout ne peut pas échouer.
--
-- Toute nouvelle valeur d'une énumération stockée en base demande désormais une migration de ce
-- type : Hibernate en mode validate ne contrôle pas les contraintes CHECK.

ALTER TABLE public.users DROP CONSTRAINT users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
    CHECK (role IN ('SUPERADMIN', 'ADMIN', 'EDITOR', 'MEMBER', 'USER', 'VISITOR'));

ALTER TABLE public.user_permission DROP CONSTRAINT user_permission_permission_check;
ALTER TABLE public.user_permission ADD CONSTRAINT user_permission_permission_check
    CHECK (permission IN (
        'DASHBOARD_ACCESS',
        'ARTICLE_CREATE', 'ARTICLE_EDIT', 'ARTICLE_DELETE',
        'BOURSE_CREATE', 'BOURSE_EDIT', 'BOURSE_DELETE',
        'CONCOURS_CREATE', 'CONCOURS_EDIT', 'CONCOURS_DELETE',
        'FILIERE_CREATE', 'FILIERE_EDIT', 'FILIERE_DELETE',
        'ETABLISSEMENT_CREATE', 'ETABLISSEMENT_EDIT', 'ETABLISSEMENT_DELETE',
        'MEMBRE_CREATE', 'MEMBRE_EDIT', 'MEMBRE_DELETE',
        'PARTENAIRE_CREATE', 'PARTENAIRE_EDIT', 'PARTENAIRE_DELETE',
        'LIEN_UTILE_CREATE', 'LIEN_UTILE_EDIT', 'LIEN_UTILE_DELETE',
        'RESSOURCE_CREATE', 'RESSOURCE_EDIT', 'RESSOURCE_DELETE',
        'OPPORTUNITE_CREATE', 'OPPORTUNITE_EDIT', 'OPPORTUNITE_DELETE',
        'GALERIE_CREATE', 'GALERIE_EDIT', 'GALERIE_DELETE',
        'USER_READ_ALL', 'USER_EDIT_ANY', 'USER_DELETE', 'USER_MANAGE_ROLES', 'USER_GRANT_PERMISSIONS',
        'ADHESION_MANAGE'));
