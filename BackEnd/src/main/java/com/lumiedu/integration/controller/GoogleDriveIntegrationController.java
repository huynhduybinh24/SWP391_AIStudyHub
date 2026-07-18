package com.lumiedu.integration.controller;

import com.lumiedu.integration.dto.GoogleDriveConnectUrlResponse;
import com.lumiedu.integration.dto.GoogleDriveStatusResponse;
import com.lumiedu.integration.service.GoogleDriveIntegrationService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@RestController
@RequestMapping("/api/integrations/google-drive")
@RequiredArgsConstructor
public class GoogleDriveIntegrationController {

    private final GoogleDriveIntegrationService integrationService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @GetMapping("/status")
    public ResponseEntity<GoogleDriveStatusResponse> getStatus(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        GoogleDriveStatusResponse response = integrationService.getStatus(userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/connect-url")
    public ResponseEntity<GoogleDriveConnectUrlResponse> getConnectUrl(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String authUrl = integrationService.buildAuthUrl(userId);
        return ResponseEntity.ok(new GoogleDriveConnectUrlResponse(authUrl));
    }

    @GetMapping("/callback")
    public void callback(
            @RequestParam(value = "code", required = false) String code,
            @RequestParam("state") String state,
            @RequestParam(value = "error", required = false) String error,
            HttpServletResponse response
    ) throws IOException {
        String redirectUrl = frontendUrl + "/dashboard/settings";

        if (error != null && !error.isEmpty()) {
            log.warn("Google OAuth callback returned error: {}", error);
            response.sendRedirect(redirectUrl + "?error=" + URLEncoder.encode("Google access request was " + error, StandardCharsets.UTF_8));
            return;
        }

        if (code == null || code.isEmpty()) {
            log.error("Google OAuth callback missing code parameter.");
            response.sendRedirect(redirectUrl + "?error=" + URLEncoder.encode("OAuth authorization code was not returned by Google.", StandardCharsets.UTF_8));
            return;
        }

        try {
            integrationService.handleCallback(code, state);
            response.sendRedirect(redirectUrl + "?googleDriveConnected=true");
        } catch (Exception e) {
            log.error("Google Drive integration callback failed", e);
            response.sendRedirect(redirectUrl + "?error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
        }
    }

    @PostMapping("/disconnect")
    public ResponseEntity<Void> disconnect(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        integrationService.disconnect(userId);
        return ResponseEntity.ok().build();
    }

    private Long getCurrentUserId(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        Object details = authentication.getDetails();
        if (details instanceof Long) {
            return (Long) details;
        }
        return null;
    }
}
