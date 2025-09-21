package com.example.siteamame.exception;

import com.example.siteamame.exception.concours.RessourceNotFoundException;
import com.example.siteamame.exception.user.PasswordNotMatchException;
import com.example.siteamame.exception.user.UserAlreadyExistsException;
import com.example.siteamame.exception.user.UserNotFoundException;
import jakarta.servlet.http.HttpServletRequest;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import javax.xml.crypto.Data;
import java.util.List;

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

    //Handler Global
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
