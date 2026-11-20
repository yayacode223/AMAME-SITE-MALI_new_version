package com.example.siteamame.exception;

/**
 * Codes stables du champ {@code code} d'{@link ApiError} : le site s'appuie dessus pour choisir son
 * message ou le champ à signaler, jamais sur le texte de {@code message}. Un code ne change pas de sens.
 */
public final class ApiErrorCode {

    /** Un compte existe déjà avec cet e-mail (inscription, création par un administrateur). */
    public static final String EMAIL_ALREADY_USED = "EMAIL_ALREADY_USED";
    /** Champs refusés par la validation : détail dans {@code fieldErrors}. */
    public static final String VALIDATION_FAILED = "VALIDATION_FAILED";
    /** Requête mal formée : JSON illisible, partie ou paramètre manquant, identifiant mal typé. */
    public static final String INVALID_REQUEST = "INVALID_REQUEST";
    /** Fichier refusé (vide, format non accepté). */
    public static final String INVALID_FILE = "INVALID_FILE";
    /** Fichier au-delà de la taille maximale. */
    public static final String FILE_TOO_LARGE = "FILE_TOO_LARGE";
    public static final String UNAUTHORIZED = "UNAUTHORIZED";
    public static final String FORBIDDEN = "FORBIDDEN";
    public static final String NOT_FOUND = "NOT_FOUND";
    /** Conflit avec l'état des données (doublon, demande déjà traitée…). */
    public static final String CONFLICT = "CONFLICT";
    public static final String METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED";
    /** Erreur imprévue : journalisée côté serveur avec une référence, rappelée dans le message. */
    public static final String INTERNAL_ERROR = "INTERNAL_ERROR";

    private ApiErrorCode() {
    }
}
