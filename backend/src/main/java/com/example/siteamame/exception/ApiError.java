package com.example.siteamame.exception;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Corps de toute réponse d'erreur de l'API.
 *
 * <p>{@code message} est toujours une phrase destinée à l'utilisateur, jamais le texte d'une exception
 * technique. {@code code} est stable (voir {@link ApiErrorCode}). {@code fieldErrors} associe un champ
 * du formulaire à son message, pour l'afficher sous le champ. {@code errors} est gardé pour les écrans
 * qui le lisent encore.
 */
@Getter
@Setter
public class ApiError {

    private HttpStatus status;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime timestamp;

    private String code;
    private String message;
    private String path;
    private List<String> errors; // Liste d'erreurs détaillées

    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    private Map<String, String> fieldErrors;

    public ApiError() {
        this.timestamp = LocalDateTime.now();
    }

    public ApiError(HttpStatus status, String message, String path, List<String> errors) {
        this();
        this.status = status;
        this.message = message;
        this.path = path;
        this.errors = errors;
    }

    public ApiError(HttpStatus status, String code, String message, String path, List<String> errors) {
        this(status, message, path, errors);
        this.code = code;
    }
}
