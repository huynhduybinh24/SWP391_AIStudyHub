package com.lumiedu.document.exception;

public class InvalidFileTypeException extends RuntimeException {

    public InvalidFileTypeException(String message) {
        super(message);
    }

    public InvalidFileTypeException(String extension, String fileType) {
        super("File extension '" + extension + "' is not allowed for file type: " + fileType);
    }
}
