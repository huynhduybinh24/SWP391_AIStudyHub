package com.lumiedu;

import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import java.io.FileInputStream;
import java.util.Collections;

public class TestDriveAccess {
    public static void main(String[] args) {
        String rootFolderId = "1A-6N2J2j20eu7zDYo-uiCk1nuXNfGUvS";
        String credPath = "d:/SWP391_AIStudyHub/BackEnd/src/main/resources/google-credentials.json";
        System.out.println("=== STANDALONE GOOGLE DRIVE TEST ===");
        try {
            GoogleCredentials credentials = GoogleCredentials
                    .fromStream(new FileInputStream(credPath))
                    .createScoped(Collections.singleton(DriveScopes.DRIVE));

            Drive googleDrive = new Drive.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance(),
                    new HttpCredentialsAdapter(credentials))
                    .setApplicationName("LumiEdu-StudyHub")
                    .build();

            System.out.println("Credentials loaded successfully.");

            // Simulate file upload
            System.out.println("Testing file upload to folder: " + rootFolderId);
            com.google.api.services.drive.model.File fileMetadata = new com.google.api.services.drive.model.File();
            fileMetadata.setName("test_upload_file.txt");
            fileMetadata.setParents(Collections.singletonList(rootFolderId));

            byte[] contentBytes = "Hello Google Drive from Service Account!".getBytes();
            var mediaContent = new com.google.api.client.http.ByteArrayContent("text/plain", contentBytes);

            var uploadedFile = googleDrive.files().create(fileMetadata, mediaContent)
                    .setFields("id, name")
                    .execute();
            System.out.println("UPLOAD SUCCESS! File ID: " + uploadedFile.getId());
        } catch (Exception e) {
            System.out.println("FAILED! Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
