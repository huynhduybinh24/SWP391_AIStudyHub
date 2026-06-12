package com.lumiedu.common.config;

import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.UserCredentials;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Collections;

@Configuration
public class GoogleDriveConfig {

    private static final Logger log = LoggerFactory.getLogger(GoogleDriveConfig.class);

    @Value("${google.drive.credentials-path}")
    private Resource credentialsPath;

    @Value("${google.drive.client-id:}")
    private String clientId;

    @Value("${google.drive.client-secret:}")
    private String clientSecret;

    @Value("${google.drive.refresh-token:}")
    private String refreshToken;

    @Bean
    public Drive googleDrive() throws IOException {
        com.google.auth.Credentials credentials;

        if (refreshToken != null && !refreshToken.trim().isEmpty() && !refreshToken.equals("mock-refresh-token")) {
            log.info("GOOGLE DRIVE: Initializing using personal Gmail OAuth Refresh Token");
            credentials = UserCredentials.newBuilder()
                    .setClientId(clientId)
                    .setClientSecret(clientSecret)
                    .setRefreshToken(refreshToken)
                    .build();
        } else {
            log.info("GOOGLE DRIVE: Initializing using Service Account JSON credentials");
            credentials = GoogleCredentials
                    .fromStream(credentialsPath.getInputStream())
                    .createScoped(Collections.singleton(DriveScopes.DRIVE));
        }

        com.google.api.client.http.HttpRequestInitializer requestInitializer = new com.google.api.client.http.HttpRequestInitializer() {
            private final HttpCredentialsAdapter credentialsAdapter = new HttpCredentialsAdapter(credentials);
            @Override
            public void initialize(com.google.api.client.http.HttpRequest request) throws IOException {
                credentialsAdapter.initialize(request);
                request.setConnectTimeout(5000); // 5 seconds connect timeout
                request.setReadTimeout(5000);    // 5 seconds read timeout
            }
        };

        return new Drive.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance(),
                requestInitializer)
                .setApplicationName("LumiEdu-StudyHub")
                .build();
    }
}
