package com.example.siteamame.exception;

public abstract class  BasicException extends RuntimeException {
    public BasicException(String message) {
        super(message);
    }

    public BasicException(String message, Throwable cause ){
        super(message,cause);
    }
}
