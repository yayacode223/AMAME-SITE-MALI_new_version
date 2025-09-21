package com.example.siteamame.exception.user;

import com.example.siteamame.exception.BasicException;

public class PasswordNotMatchException extends BasicException {
    public PasswordNotMatchException(String message) {
        super(message);
    }
}
