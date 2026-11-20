package com.example.siteamame.exception.user;

import com.example.siteamame.exception.BasicException;

public class UserAlreadyExistsException extends BasicException {
    public UserAlreadyExistsException(String message) {
        super(message);
    }

    public UserAlreadyExistsException(String message, Throwable cause) {
        super(message, cause);
    }

    /** E-mail déjà pris : 409, code EMAIL_ALREADY_USED, message affichable tel quel. */
    public static UserAlreadyExistsException forEmail() {
        return new UserAlreadyExistsException("Un compte existe déjà avec cet e-mail.");
    }
}
