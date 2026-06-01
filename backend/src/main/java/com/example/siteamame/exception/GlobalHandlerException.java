package com.example.siteamame.exception;

import com.example.siteamame.exception.concours.RessourceNotFoundException;
import com.example.siteamame.exception.user.PasswordNotMatchException;
import com.example.siteamame.exception.user.UserAlreadyExistsException;
import com.example.siteamame.exception.user.UserNotFoundException;
import jakarta.servlet.http.HttpServletRequest;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalHandlerException {
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiError> handleUserNotFoundException(UserNotFoundException ex, HttpServletRequest res) {
        ApiError error = new ApiError(
                HttpStatus.NOT_FOUND,
                ex.getMessage(),
                res.getRequestURI(),
                List.of(ex.getMessage())
        );
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<ApiError> handleUserAlreadyExistsException(UserAlreadyExistsException ex, HttpServletRequest res){
        ApiError error = new ApiError(
                HttpStatus.CONFLICT,
                ex.getMessage(),
                res.getRequestURI(),
                List.of(ex.getMessage())
        );

        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    // ── ResponseStatusException : restitue le vrai code HTTP (401, 403, 404…) ──
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiError> handleResponseStatusException(
            ResponseStatusException ex, HttpServletRequest req) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        if (status == null) status = HttpStatus.INTERNAL_SERVER_ERROR;
        String message = ex.getReason() != null ? ex.getReason() : ex.getMessage();
        ApiError error = new ApiError(status, message, req.getRequestURI(), List.of(message));
        return new ResponseEntity<>(error, status);
    }

    // ── Erreurs de validation @Valid → 400 Bad Request ──────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidationException(
            MethodArgumentNotValidException ex, HttpServletRequest req) {
        List<String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + " : " + fe.getDefaultMessage())
                .collect(Collectors.toList());
        ApiError error = new ApiError(
                HttpStatus.BAD_REQUEST,
                "Données invalides",
                req.getRequestURI(),
                fieldErrors
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    // ── Handler Global (dernier recours) ────────────────────────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGlobalException(Exception ex, HttpServletRequest res) {
        ApiError error = new ApiError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                ex.getMessage(),
                res.getRequestURI(),
                List.of(ex.getMessage())
        );
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(DataAccesException.class)
    public ResponseEntity<ApiError> handlerDataAccesException(DataAccessException ex, HttpServletRequest req) {
        ApiError error = new ApiError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                ex.getMessage(),
                req.getRequestURI(),
                List.of(ex.getMessage())
        );
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(PasswordNotMatchException.class)
    public ResponseEntity<ApiError> handlerPasswordNotMatchException(PasswordNotMatchException ex, HttpServletRequest req){
        ApiError error = new ApiError(
                HttpStatus.UNAUTHORIZED,
                ex.getMessage(),
                req.getRequestURI(),
                List.of(ex.getMessage())
        );
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(RessourceNotFoundException.class)
    public ResponseEntity<ApiError> handlerRessourceNotFoundException(RessourceNotFoundException ex, HttpServletRequest req){
        ApiError error = new ApiError(
                HttpStatus.NOT_FOUND,
                ex.getMessage(),
                req.getRequestURI(),
                List.of(ex.getMessage())
        );
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }
}
