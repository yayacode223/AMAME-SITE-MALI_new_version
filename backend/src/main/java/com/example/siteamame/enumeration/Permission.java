package com.example.siteamame.enumeration;

import java.util.EnumSet;
import java.util.Set;

public enum Permission {

    // ── Tableau de bord ─────────────────────────────────────────────────────
    DASHBOARD_ACCESS("Accès au tableau de bord"),

    // ── Articles ─────────────────────────────────────────────────────────────
    ARTICLE_CREATE("Créer un article"),
    ARTICLE_EDIT("Modifier un article"),
    ARTICLE_DELETE("Supprimer un article"),

    // ── Bourses ──────────────────────────────────────────────────────────────
    BOURSE_CREATE("Créer une bourse"),
    BOURSE_EDIT("Modifier une bourse"),
    BOURSE_DELETE("Supprimer une bourse"),

    // ── Concours ─────────────────────────────────────────────────────────────
    CONCOURS_CREATE("Créer un concours"),
    CONCOURS_EDIT("Modifier un concours"),
    CONCOURS_DELETE("Supprimer un concours"),

    // ── Filières ─────────────────────────────────────────────────────────────
    FILIERE_CREATE("Créer une filière"),
    FILIERE_EDIT("Modifier une filière"),
    FILIERE_DELETE("Supprimer une filière"),

    // ── Établissements ───────────────────────────────────────────────────────
    ETABLISSEMENT_CREATE("Créer un établissement"),
    ETABLISSEMENT_EDIT("Modifier un établissement"),
    ETABLISSEMENT_DELETE("Supprimer un établissement"),

    // ── Membres ──────────────────────────────────────────────────────────────
    MEMBRE_CREATE("Créer un membre"),
    MEMBRE_EDIT("Modifier un membre"),
    MEMBRE_DELETE("Supprimer un membre"),

    // ── Partenaires ──────────────────────────────────────────────────────────
    PARTENAIRE_CREATE("Créer un partenaire"),
    PARTENAIRE_EDIT("Modifier un partenaire"),
    PARTENAIRE_DELETE("Supprimer un partenaire"),

    // ── Liens utiles ─────────────────────────────────────────────────────────
    LIEN_UTILE_CREATE("Créer un lien utile"),
    LIEN_UTILE_EDIT("Modifier un lien utile"),
    LIEN_UTILE_DELETE("Supprimer un lien utile"),

    // ── Ressources académiques ───────────────────────────────────────────────
    RESSOURCE_CREATE("Créer une ressource académique"),
    RESSOURCE_EDIT("Modifier une ressource académique"),
    RESSOURCE_DELETE("Supprimer une ressource académique"),

    // ── Opportunités ─────────────────────────────────────────────────────────
    OPPORTUNITE_CREATE("Créer une opportunité"),
    OPPORTUNITE_EDIT("Modifier une opportunité"),
    OPPORTUNITE_DELETE("Supprimer une opportunité"),

    // ── Galerie ──────────────────────────────────────────────────────────────
    GALERIE_CREATE("Ajouter à la galerie"),
    GALERIE_EDIT("Modifier la galerie"),
    GALERIE_DELETE("Supprimer de la galerie"),

    // ── Gestion des utilisateurs ─────────────────────────────────────────────
    USER_READ_ALL("Voir tous les utilisateurs"),
    USER_EDIT_ANY("Modifier n'importe quel utilisateur"),
    USER_DELETE("Supprimer un utilisateur"),
    USER_MANAGE_ROLES("Gérer les rôles utilisateurs"),
    USER_GRANT_PERMISSIONS("Accorder ou révoquer des permissions"),

    // ── Adhésions ─────────────────────────────────────────────────────────────
    ADHESION_MANAGE("Gérer les demandes d'adhésion");

    // ────────────────────────────────────────────────────────────────────────

    private final String label;

    Permission(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    // ── Permissions par défaut selon le rôle ────────────────────────────────

    /** Ensemble de permissions attribuées par défaut à un rôle. */
    public static Set<Permission> defaultPermissionsFor(RoleType role) {
        return switch (role) {
            case SUPERADMIN -> EnumSet.allOf(Permission.class);

            case ADMIN -> EnumSet.of(
                    DASHBOARD_ACCESS,
                    ARTICLE_CREATE, ARTICLE_EDIT, ARTICLE_DELETE,
                    BOURSE_CREATE, BOURSE_EDIT, BOURSE_DELETE,
                    CONCOURS_CREATE, CONCOURS_EDIT, CONCOURS_DELETE,
                    FILIERE_CREATE, FILIERE_EDIT, FILIERE_DELETE,
                    ETABLISSEMENT_CREATE, ETABLISSEMENT_EDIT, ETABLISSEMENT_DELETE,
                    MEMBRE_CREATE, MEMBRE_EDIT, MEMBRE_DELETE,
                    PARTENAIRE_CREATE, PARTENAIRE_EDIT, PARTENAIRE_DELETE,
                    LIEN_UTILE_CREATE, LIEN_UTILE_EDIT, LIEN_UTILE_DELETE,
                    RESSOURCE_CREATE, RESSOURCE_EDIT, RESSOURCE_DELETE,
                    OPPORTUNITE_CREATE, OPPORTUNITE_EDIT, OPPORTUNITE_DELETE,
                    GALERIE_CREATE, GALERIE_EDIT, GALERIE_DELETE,
                    USER_READ_ALL, USER_EDIT_ANY, USER_DELETE, USER_MANAGE_ROLES,
                    ADHESION_MANAGE
                    // USER_GRANT_PERMISSIONS réservé au SUPERADMIN
            );

            case EDITOR -> EnumSet.of(
                    DASHBOARD_ACCESS,
                    ARTICLE_CREATE, ARTICLE_EDIT, ARTICLE_DELETE,
                    BOURSE_CREATE, BOURSE_EDIT, BOURSE_DELETE,
                    CONCOURS_CREATE, CONCOURS_EDIT, CONCOURS_DELETE,
                    FILIERE_CREATE, FILIERE_EDIT, FILIERE_DELETE,
                    ETABLISSEMENT_CREATE, ETABLISSEMENT_EDIT, ETABLISSEMENT_DELETE,
                    MEMBRE_CREATE, MEMBRE_EDIT, MEMBRE_DELETE,
                    PARTENAIRE_CREATE, PARTENAIRE_EDIT, PARTENAIRE_DELETE,
                    LIEN_UTILE_CREATE, LIEN_UTILE_EDIT, LIEN_UTILE_DELETE,
                    RESSOURCE_CREATE, RESSOURCE_EDIT, RESSOURCE_DELETE,
                    OPPORTUNITE_CREATE, OPPORTUNITE_EDIT, OPPORTUNITE_DELETE,
                    GALERIE_CREATE, GALERIE_EDIT, GALERIE_DELETE
                    // Pas de gestion des utilisateurs ni des permissions
            );

            // MEMBER, USER, VISITOR : aucune permission admin par défaut.
            // Leur accès est assuré par les routes /api/visitor/** et /api/user/**.
            default -> EnumSet.noneOf(Permission.class);
        };
    }
}
