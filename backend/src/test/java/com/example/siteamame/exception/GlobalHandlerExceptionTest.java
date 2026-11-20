package com.example.siteamame.exception;

import com.example.siteamame.exception.concours.RessourceNotFoundException;
import com.example.siteamame.exception.user.UserAlreadyExistsException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/** Contrat d'erreur de l'API (rapport 05, P3a) : codes stables, messages pour l'utilisateur, aucun détail technique. */
class GlobalHandlerExceptionTest {

    private final GlobalHandlerException handler = new GlobalHandlerException();
    private final MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/visitor/adhesion/register");

    @Test
    void anEmailAlreadyUsedIsAConflictWithItsOwnCode() {
        ResponseEntity<ApiError> response = handler.handleUserAlreadyExistsException(UserAlreadyExistsException.forEmail(), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().getCode()).isEqualTo(ApiErrorCode.EMAIL_ALREADY_USED);
        assertThat(response.getBody().getMessage()).isEqualTo("Un compte existe déjà avec cet e-mail.");
    }

    @Test
    void anUnexpectedErrorHidesItsDetailsAndGivesAReference() {
        ResponseEntity<ApiError> response = handler.handleGlobalException(
                new IllegalStateException("could not execute statement [SQL: select password from users]"), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        ApiError body = response.getBody();
        assertThat(body.getCode()).isEqualTo(ApiErrorCode.INTERNAL_ERROR);
        assertThat(body.getMessage()).startsWith(GlobalHandlerException.UNEXPECTED_MESSAGE).matches(".*\\(réf\\. [0-9A-F]{8}\\)$");
        assertThat(body.getMessage() + body.getErrors()).doesNotContain("SQL", "password", "statement");
    }

    @Test
    void validationErrorsAreGivenFieldByField() {
        BeanPropertyBindingResult result = new BeanPropertyBindingResult(new Object(), "request");
        result.addError(new FieldError("request", "email", "Adresse email invalide"));
        result.addError(new FieldError("request", "password", "Le mot de passe doit contenir au moins 8 caractères"));
        result.addError(new FieldError("request", "email", "L'email est obligatoire"));

        ResponseEntity<ApiError> response = handler.handleValidationException(new MethodArgumentNotValidException(null, result), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED);
        assertThat(response.getBody().getFieldErrors()).isEqualTo(Map.of(
                "email", "Adresse email invalide",
                "password", "Le mot de passe doit contenir au moins 8 caractères"));
    }

    @Test
    void aFieldRefusedByAServiceIsGivenLikeAValidationError() {
        ResponseEntity<ApiError> response = handler.handleInvalidFieldException(
                new InvalidFieldException("currentPassword", "Mot de passe actuel incorrect."), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED);
        assertThat(response.getBody().getMessage()).isEqualTo(GlobalHandlerException.VALIDATION_MESSAGE);
        assertThat(response.getBody().getFieldErrors()).isEqualTo(Map.of("currentPassword", "Mot de passe actuel incorrect."));
    }

    @Test
    void aMissingItemIsA404WithItsSentence() {
        ResponseEntity<ApiError> response = handler.handlerRessourceNotFoundException(
                new RessourceNotFoundException("Cet article est introuvable : il a peut-être été supprimé."), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().getCode()).isEqualTo(ApiErrorCode.NOT_FOUND);
        assertThat(response.getBody().getMessage()).isEqualTo("Cet article est introuvable : il a peut-être été supprimé.");
    }

    @Test
    void aStatusChosenByAServiceKeepsItsReason() {
        ResponseEntity<ApiError> conflict = handler.handleResponseStatusException(
                new ResponseStatusException(HttpStatus.CONFLICT, "Une demande d'adhésion est déjà en cours ou approuvée."), request);
        assertThat(conflict.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(conflict.getBody().getCode()).isEqualTo(ApiErrorCode.CONFLICT);
        assertThat(conflict.getBody().getMessage()).isEqualTo("Une demande d'adhésion est déjà en cours ou approuvée.");

        ResponseEntity<ApiError> serverError = handler.handleResponseStatusException(
                new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "détail interne"), request);
        assertThat(serverError.getBody().getCode()).isEqualTo(ApiErrorCode.INTERNAL_ERROR);
        assertThat(serverError.getBody().getMessage()).doesNotContain("détail interne");
    }

    @Test
    void aTooLargeFileIsA413() {
        ResponseEntity<ApiError> response = handler.handleMaxUploadSizeExceededException(new MaxUploadSizeExceededException(10_485_760), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.PAYLOAD_TOO_LARGE);
        assertThat(response.getBody().getCode()).isEqualTo(ApiErrorCode.FILE_TOO_LARGE);
    }

    @Test
    void aClosedConnectionIsNotAnError() {
        assertThat(handler.handleGlobalException(new AsyncRequestNotUsableException("Broken pipe"), request)).isNull();
    }
}
