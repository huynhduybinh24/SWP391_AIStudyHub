package com.lumiedu.integration.service;

import com.lumiedu.integration.dto.GoogleDriveStatusResponse;

public interface GoogleDriveIntegrationService {
    GoogleDriveStatusResponse getStatus(Long userId);
    String buildAuthUrl(Long userId);
    void handleCallback(String code, String state);
    void disconnect(Long userId);
}
