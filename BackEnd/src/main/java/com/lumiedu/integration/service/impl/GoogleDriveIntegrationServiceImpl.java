package com.lumiedu.integration.service.impl;

import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.model.About;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.UserCredentials;
import com.lumiedu.integration.dto.GoogleDriveStatusResponse;
import com.lumiedu.integration.entity.UserGoogleDriveConnection;
import com.lumiedu.integration.repository.UserGoogleDriveConnectionRepository;
import com.lumiedu.integration.service.EncryptionService;
import com.lumiedu.integration.service.GoogleDriveIntegrationService;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Date;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleDriveIntegrationServiceImpl implements GoogleDriveIntegrationService {

    private final UserGoogleDriveConnectionRepository connectionRepository;
    private final UserRepository userRepository;
    private final EncryptionService encryptionService;

    @Value("${google.drive.client-id:}")
    private String clientId;

    @Value("${google.drive.client-secret:}")
    private String clientSecret;

    @Value("${google.drive.oauth.redirect-uri:http://localhost:8080/api/integrations/google-drive/callback}")
    private String redirectUri;

    @Value("${jwt.secret}")
    private String jwtSecret;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    private GoogleAuthorizationCodeFlow buildFlow() {
        if (clientId == null || clientId.trim().isEmpty() || clientSecret == null || clientSecret.trim().isEmpty()) {
            throw new IllegalStateException("Google OAuth Client ID or Client Secret is not configured.");
        }
        return new GoogleAuthorizationCodeFlow.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance(),
                clientId,
                clientSecret,
                Collections.singleton("https://www.googleapis.com/auth/drive.file")
        )
        .setAccessType("offline")
        .build();
    }

    private String generateStateToken(Long userId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("purpose", "GOOGLE_DRIVE_CONNECT")
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getSigningKey())
                .compact();
    }

    private Long verifyAndParseStateToken(String state) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(state)
                    .getPayload();

            String purpose = claims.get("purpose", String.class);
            if (!"GOOGLE_DRIVE_CONNECT".equals(purpose)) {
                throw new IllegalArgumentException("Invalid state token purpose.");
            }

            return Long.parseLong(claims.getSubject());
        } catch (Exception e) {
            log.error("Failed to verify state token: {}", e.getMessage());
            throw new IllegalArgumentException("Invalid or expired state parameter: " + e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public GoogleDriveStatusResponse getStatus(Long userId) {
        var connectionOpt = connectionRepository.findByUserId(userId);
        if (connectionOpt.isPresent() && Boolean.TRUE.equals(connectionOpt.get().getIsConnected())) {
            UserGoogleDriveConnection conn = connectionOpt.get();
            return GoogleDriveStatusResponse.builder()
                    .connected(true)
                    .googleEmail(conn.getGoogleEmail())
                    .connectedAt(conn.getConnectedAt())
                    .storageMode("USER_DRIVE")
                    .build();
        }

        return GoogleDriveStatusResponse.builder()
                .connected(false)
                .storageMode("APP_OR_MOCK_DRIVE")
                .build();
    }

    @Override
    public String buildAuthUrl(Long userId) {
        // Ensure encryption service is initialized first (will throw if secret is missing)
        encryptionService.encrypt("test");

        GoogleAuthorizationCodeFlow flow = buildFlow();
        String state = generateStateToken(userId);

        return flow.newAuthorizationUrl()
                .setRedirectUri(redirectUri)
                .setState(state)
                .set("prompt", "consent") // Force consent to guarantee we get a refresh token
                .build();
    }

    @Override
    @Transactional
    public void handleCallback(String code, String state) {
        // State is verified and parsed first
        Long userId = verifyAndParseStateToken(state);

        try {
            GoogleAuthorizationCodeFlow flow = buildFlow();
            GoogleTokenResponse tokenResponse = flow.newTokenRequest(code)
                    .setRedirectUri(redirectUri)
                    .execute();

            String accessToken = tokenResponse.getAccessToken();
            String refreshToken = tokenResponse.getRefreshToken();

            // Retrieve Google email using the transient access token
            com.google.auth.Credentials credentials = UserCredentials.newBuilder()
                    .setClientId(clientId)
                    .setClientSecret(clientSecret)
                    .setAccessToken(new com.google.auth.oauth2.AccessToken(accessToken, null))
                    .build();

            Drive drive = new Drive.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance(),
                    new HttpCredentialsAdapter(credentials))
                    .setApplicationName("LumiEdu-StudyHub")
                    .build();

            About about = drive.about().get().setFields("user").execute();
            String googleEmail = about.getUser().getEmailAddress();

            // Find or create connection record
            UserGoogleDriveConnection connection = connectionRepository.findByUserId(userId)
                    .orElseGet(() -> {
                        User user = userRepository.findById(userId)
                                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
                        return UserGoogleDriveConnection.builder()
                                .user(user)
                                .build();
                    });

            if (refreshToken != null) {
                connection.setEncryptedRefreshToken(encryptionService.encrypt(refreshToken));
            } else if (connection.getEncryptedRefreshToken() == null) {
                throw new IllegalStateException("Google did not return a refresh token. Please revoke access to LumiEdu in your Google Account security settings and try again.");
            }

            connection.setGoogleEmail(googleEmail);
            connection.setIsConnected(true);
            connection.setConnectedAt(LocalDateTime.now());
            connection.setDisconnectedAt(null);

            connectionRepository.save(connection);
            log.info("Successfully connected Google Drive for user ID: {} with email: {}", userId, googleEmail);

        } catch (Exception e) {
            log.error("Google Drive callback processing failed for user ID {}: {}", userId, e.getMessage());
            throw new RuntimeException("Google Drive authentication failed: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public void disconnect(Long userId) {
        UserGoogleDriveConnection connection = connectionRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("No Google Drive connection found for this user."));

        connection.setIsConnected(false);
        connection.setEncryptedRefreshToken(null);
        connection.setDisconnectedAt(LocalDateTime.now());

        connectionRepository.save(connection);
        log.info("Disconnected Google Drive for user ID: {}", userId);
    }
}
