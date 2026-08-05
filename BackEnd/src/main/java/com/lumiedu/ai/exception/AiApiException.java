package com.lumiedu.ai.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class AiApiException extends RuntimeException {
    private final HttpStatus status;
    private final String errorCode;

    public AiApiException(HttpStatus status, String errorCode, String message) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }

    public static AiApiException unauthorized(String message) {
        return new AiApiException(HttpStatus.UNAUTHORIZED, "AI_UNAUTHORIZED", message);
    }

    public static AiApiException forbidden(String errorCode, String message) {
        return new AiApiException(HttpStatus.FORBIDDEN, errorCode, message);
    }

    public static AiApiException badRequest(String errorCode, String message) {
        return new AiApiException(HttpStatus.BAD_REQUEST, errorCode, message);
    }

    public static AiApiException notFound(String errorCode, String message) {
        return new AiApiException(HttpStatus.NOT_FOUND, errorCode, message);
    }

    public static AiApiException rateLimited(String message) {
        return new AiApiException(HttpStatus.TOO_MANY_REQUESTS, "AI_RATE_LIMITED", message);
    }

    public static AiApiException badGateway(String errorCode, String message) {
        return new AiApiException(HttpStatus.BAD_GATEWAY, errorCode, message);
    }

    public static AiApiException serviceUnavailable(String errorCode, String message) {
        return new AiApiException(HttpStatus.SERVICE_UNAVAILABLE, errorCode, message);
    }

    public static AiApiException gatewayTimeout(String message) {
        return new AiApiException(HttpStatus.GATEWAY_TIMEOUT, "AI_GENERATION_TIMEOUT", message);
    }

    public static AiApiException internalError(String message) {
        return new AiApiException(HttpStatus.INTERNAL_SERVER_ERROR, "AI_INTERNAL_ERROR", message);
    }
}
