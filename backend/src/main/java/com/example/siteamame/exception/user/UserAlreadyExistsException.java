package com.example.siteamame.exception.user;

import com.example.siteamame.exception.BasicException;

public class UserAlreadyExistsException extends BasicException {
    public UserAlreadyExistsException(String message) {
        super(message);
    }

    public UserAlreadyExistsException(String message, Throwable cause) {
        super(message, cause);
    }
}
