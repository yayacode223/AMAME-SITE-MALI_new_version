package com.example.siteamame.exception.user;

import com.example.siteamame.exception.BasicException;

public class UserNotFoundException extends BasicException {
    public UserNotFoundException(String message) {
        super(message);
    }
}
