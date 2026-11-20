package com.example.siteamame.exception;

import lombok.Getter;

/**
 * Valeur d'un champ refusée par une règle du service (et non par {@code @Valid}) : par exemple le mot de
 * passe actuel incorrect. Répondue comme une erreur de validation (400 {@code VALIDATION_FAILED}), avec le
 * message sous ce champ dans {@code fieldErrors}. Le message est une phrase pour l'utilisateur.
 */
@Getter
public class InvalidFieldException extends BasicException {

    /** Nom du champ tel que le site l'envoie (ex. {@code currentPassword}). */
    private final String field;

    public InvalidFieldException(String field, String message) {
        super(message);
        this.field = field;
    }
}
