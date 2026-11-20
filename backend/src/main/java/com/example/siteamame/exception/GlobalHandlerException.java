package com.example.siteamame.exception;

import com.example.siteamame.exception.concours.RessourceNotFoundException;
import com.example.siteamame.exception.user.PasswordNotMatchException;
import com.example.siteamame.exception.user.UserAlreadyExistsException;
import com.example.siteamame.exception.user.UserNotFoundException;
import com.example.siteamame.service.file.InvalidUploadException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Traduit toute exception en {@link ApiError} (rapport 05, itération P3a).
 *
 * <p>Règles : le {@code message} renvoyé est toujours une phrase pour l'utilisateur, jamais le texte
 * d'une exception technique ; chaque erreur imprévue est journalisée avec une référence courte, que le
 * message rappelle, pour la retrouver dans les journaux ; les erreurs de la requête (format, méthode,
 * taille) gardent leur vrai code HTTP au lieu de sortir en 500.
 */
@Slf4j
@RestControllerAdvice
public class GlobalHandlerException {

    static final String UNEXPECTED_MESSAGE = "Une erreur inattendue est survenue. Réessayez dans quelques instants.";
    static final String INVALID_REQUEST_MESSAGE = "La demande n'a pas pu être lue. Rechargez la page, puis réessayez.";
    static final String VALIDATION_MESSAGE = "Certains champs sont invalides. Corrigez-les, puis réessayez.";

    // ── Comptes ─────────────────────────────────────────────────────────────

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<ApiError> handleUserAlreadyExistsException(UserAlreadyExistsException ex, HttpServletRequest req) {
        return respond(HttpStatus.CONFLICT, ApiErrorCode.EMAIL_ALREADY_USED, ex.getMessage(), req);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiError> handleUserNotFoundException(UserNotFoundException ex, HttpServletRequest req) {
        return respond(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, ex.getMessage(), req);
    }

    @ExceptionHandler(PasswordNotMatchException.class)
    public ResponseEntity<ApiError> handlerPasswordNotMatchException(PasswordNotMatchException ex, HttpServletRequest req) {
        return respond(HttpStatus.UNAUTHORIZED, ApiErrorCode.UNAUTHORIZED, ex.getMessage(), req);
    }

    @ExceptionHandler(RessourceNotFoundException.class)
    public ResponseEntity<ApiError> handlerRessourceNotFoundException(RessourceNotFoundException ex, HttpServletRequest req) {
        return respond(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, ex.getMessage(), req);
    }

    // ── ResponseStatusException : le code HTTP et le motif choisis par le service ──

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiError> handleResponseStatusException(ResponseStatusException ex, HttpServletRequest req) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        if (status == null || status.is5xxServerError()) {
            return unexpected(ex, req);
        }
        String message = ex.getReason() != null ? ex.getReason() : defaultMessage(status);
        return respond(status, codeFor(status), message, req);
    }

    // ── Fichiers ────────────────────────────────────────────────────────────

    @ExceptionHandler(InvalidUploadException.class)
    public ResponseEntity<ApiError> handleInvalidUploadException(InvalidUploadException ex, HttpServletRequest req) {
        return respond(HttpStatus.BAD_REQUEST, ApiErrorCode.INVALID_FILE, ex.getMessage(), req);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiError> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException ex, HttpServletRequest req) {
        return respond(HttpStatus.PAYLOAD_TOO_LARGE, ApiErrorCode.FILE_TOO_LARGE,
                "Fichier trop volumineux (10 Mo au maximum).", req);
    }

    // ── Droits ──────────────────────────────────────────────────────────────

    // Sans ce gestionnaire, le refus d'un @PreAuthorize tombait dans le gestionnaire générique (500).
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDeniedException(AccessDeniedException ex, HttpServletRequest req) {
        return respond(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN,
                "Vous n'avez pas l'autorisation d'effectuer cette action.", req);
    }

    // ── Données envoyées ────────────────────────────────────────────────────

    /** Champs refusés par @Valid : un message par champ, à afficher sous le champ. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidationException(MethodArgumentNotValidException ex, HttpServletRequest req) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(fe.getField(), fe.getDefaultMessage());
        }
        return fieldErrors(fieldErrors, req);
    }

    /** Champ refusé par une règle du service (mot de passe actuel incorrect…) : même forme que @Valid. */
    @ExceptionHandler(InvalidFieldException.class)
    public ResponseEntity<ApiError> handleInvalidFieldException(InvalidFieldException ex, HttpServletRequest req) {
        return fieldErrors(Map.of(ex.getField(), ex.getMessage()), req);
    }

    private static ResponseEntity<ApiError> fieldErrors(Map<String, String> fieldErrors, HttpServletRequest req) {
        List<String> errors = fieldErrors.entrySet().stream()
                .map(e -> e.getKey() + " : " + e.getValue())
                .toList();
        ApiError error = new ApiError(HttpStatus.BAD_REQUEST, ApiErrorCode.VALIDATION_FAILED,
                VALIDATION_MESSAGE, req.getRequestURI(), errors);
        error.setFieldErrors(fieldErrors);
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            MissingServletRequestPartException.class,
            MissingServletRequestParameterException.class,
            MethodArgumentTypeMismatchException.class,
            HttpMediaTypeNotSupportedException.class
    })
    public ResponseEntity<ApiError> handleInvalidRequest(Exception ex, HttpServletRequest req) {
        log.debug("Requête invalide {} {} : {}", req.getMethod(), req.getRequestURI(), ex.getMessage());
        return respond(HttpStatus.BAD_REQUEST, ApiErrorCode.INVALID_REQUEST, INVALID_REQUEST_MESSAGE, req);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiError> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex, HttpServletRequest req) {
        return respond(HttpStatus.METHOD_NOT_ALLOWED, ApiErrorCode.METHOD_NOT_ALLOWED, INVALID_REQUEST_MESSAGE, req);
    }

    // Sans ce gestionnaire, le gestionnaire générique transformait toute adresse inconnue en 500.
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiError> handleNoResourceFoundException(NoResourceFoundException ex, HttpServletRequest req) {
        return respond(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, "Ressource introuvable.", req);
    }

    /** Contrainte de la base (doublon arrivé entre la vérification et l'écriture, par exemple). */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleDataIntegrityViolation(DataIntegrityViolationException ex, HttpServletRequest req) {
        log.warn("Contrainte de la base refusée {} {} : {}", req.getMethod(), req.getRequestURI(),
                ex.getMostSpecificCause().getMessage());
        return respond(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT,
                "Cette information est déjà enregistrée ou entre en conflit avec une autre. Vérifiez votre saisie.", req);
    }

    // ── Dernier recours ─────────────────────────────────────────────────────

    @ExceptionHandler(DataAccesException.class)
    public ResponseEntity<ApiError> handlerDataAccesException(DataAccesException ex, HttpServletRequest req) {
        return unexpected(ex, req);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGlobalException(Exception ex, HttpServletRequest req) {
        if (isClientAbort(ex)) {
            // Le navigateur a fermé la connexion (téléchargement annulé) : rien à répondre, rien d'anormal.
            log.debug("Connexion fermée par le client {} {}", req.getMethod(), req.getRequestURI());
            return null;
        }
        return unexpected(ex, req);
    }

    /** Journalise l'erreur avec une référence courte et répond sans aucun détail technique. */
    private ResponseEntity<ApiError> unexpected(Exception ex, HttpServletRequest req) {
        String reference = UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        log.error("Erreur inattendue (réf. {}) sur {} {}", reference, req.getMethod(), req.getRequestURI(), ex);
        return respond(HttpStatus.INTERNAL_SERVER_ERROR, ApiErrorCode.INTERNAL_ERROR,
                UNEXPECTED_MESSAGE + " (réf. " + reference + ")", req);
    }

    private static ResponseEntity<ApiError> respond(HttpStatus status, String code, String message, HttpServletRequest req) {
        return new ResponseEntity<>(new ApiError(status, code, message, req.getRequestURI(), List.of(message)), status);
    }

    private static String codeFor(HttpStatus status) {
        return switch (status) {
            case BAD_REQUEST -> ApiErrorCode.INVALID_REQUEST;
            case UNAUTHORIZED -> ApiErrorCode.UNAUTHORIZED;
            case FORBIDDEN -> ApiErrorCode.FORBIDDEN;
            case NOT_FOUND -> ApiErrorCode.NOT_FOUND;
            case CONFLICT -> ApiErrorCode.CONFLICT;
            default -> status.name();
        };
    }

    private static String defaultMessage(HttpStatus status) {
        return switch (status) {
            case UNAUTHORIZED -> "Veuillez vous connecter.";
            case FORBIDDEN -> "Vous n'avez pas l'autorisation d'effectuer cette action.";
            case NOT_FOUND -> "Ressource introuvable.";
            default -> INVALID_REQUEST_MESSAGE;
        };
    }

    private static boolean isClientAbort(Throwable ex) {
        for (Throwable t = ex; t != null; t = t.getCause()) {
            if (t instanceof AsyncRequestNotUsableException
                    || t.getClass().getSimpleName().equals("ClientAbortException")) {
                return true;
            }
        }
        return false;
    }
}
