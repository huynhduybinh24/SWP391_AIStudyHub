package com.lumiedu.common.config;

import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.util.Collections;

@Configuration
public class GoogleDriveConfig {

    @Value("${google.drive.credentials-path}")
    private Resource credentialsPath;

    @Bean
    public Drive googleDrive() throws IOException {
        GoogleCredentials credentials = GoogleCredentials
                .fromStream(credentialsPath.getInputStream())
                .createScoped(Collections.singleton(DriveScopes.DRIVE));

        return new Drive.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance(),
                new HttpCredentialsAdapter(credentials))
                .setApplicationName("LumiEdu-StudyHub")
                .build();
    }
}
