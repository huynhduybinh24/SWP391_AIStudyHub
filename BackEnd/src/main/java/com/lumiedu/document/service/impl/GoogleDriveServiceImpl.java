package com.lumiedu.document.service.impl;

import com.google.api.client.http.InputStreamContent;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.model.File;
import com.google.api.services.drive.model.Permission;
import com.lumiedu.document.service.GoogleDriveService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import com.lumiedu.integration.repository.UserGoogleDriveConnectionRepository;
import com.lumiedu.integration.service.EncryptionService;
import com.lumiedu.integration.entity.UserGoogleDriveConnection;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.UserCredentials;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Collections;
import java.util.Objects;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleDriveServiceImpl implements GoogleDriveService {

    private final Drive googleDrive;
    private final UserGoogleDriveConnectionRepository connectionRepository;
    private final EncryptionService encryptionService;

    @Value("${google.drive.client-id:}")
    private String clientId;

    @Value("${google.drive.client-secret:}")
    private String clientSecret;

    @Value("${google.drive.folder-id}")
    private String rootFolderId;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Override
    public String uploadFile(MultipartFile file, String folderName) throws IOException {
        return uploadFile(file, folderName, null);
    }

    @Override
    public String uploadFile(MultipartFile file, java.util.List<String> folderHierarchy) throws IOException {
        return uploadFile(file, folderHierarchy, null);
    }

    @Override
    public String uploadFile(MultipartFile file, String folderName, Long userId) throws IOException {
        boolean connected = isUserDriveConnected(userId);
        log.info("Drive upload check: userId={}, connected={}, folderId={}", userId, connected, rootFolderId);
        if (connected) {
            if ("mock-folder-id".equals(rootFolderId)) {
                throw new IllegalStateException("Google Drive is in mock mode (mock-folder-id), real upload is disabled.");
            }
            if (clientId == null || clientId.trim().isEmpty() || clientSecret == null || clientSecret.trim().isEmpty()) {
                throw new IllegalStateException("Google Drive Client ID or Client Secret is not configured.");
            }
            log.info("Attempting real Google Drive upload for userId={}", userId);
            try {
                Drive userDrive = getDriveClientForUser(userId);
                String targetFolderId = getOrCreateFolder(userDrive, folderName, "root");

                File fileMetadata = new File();
                fileMetadata.setName(file.getOriginalFilename());
                fileMetadata.setParents(Collections.singletonList(targetFolderId));

                InputStreamContent mediaContent = new InputStreamContent(
                        file.getContentType(),
                        file.getInputStream()
                );

                File uploadedFile = userDrive.files().create(fileMetadata, mediaContent)
                        .setFields("id, name, webViewLink")
                        .setSupportsAllDrives(true)
                        .execute();

                log.info("USER GOOGLE DRIVE: Uploaded file '{}' with ID: {}", file.getOriginalFilename(), uploadedFile.getId());
                return uploadedFile.getId();
            } catch (Exception e) {
                log.error("Real Google Drive upload failed for userId={}: {}", userId, e.getMessage(), e);
                throw new RuntimeException("Failed to upload file to user's Google Drive: " + e.getMessage(), e);
            }
        }

        if ("mock-folder-id".equals(rootFolderId)) {
            return uploadFileMock(file, folderName);
        }
        try {
            String targetFolderId = getOrCreateFolder(googleDrive, folderName, rootFolderId);

            File fileMetadata = new File();
            fileMetadata.setName(file.getOriginalFilename());
            fileMetadata.setParents(Collections.singletonList(targetFolderId));

            InputStreamContent mediaContent = new InputStreamContent(
                    file.getContentType(),
                    file.getInputStream()
            );

            File uploadedFile = googleDrive.files().create(fileMetadata, mediaContent)
                    .setFields("id, name, webViewLink")
                    .setSupportsAllDrives(true)
                    .execute();

            log.info("GOOGLE DRIVE: Uploaded file '{}' with ID: {}", file.getOriginalFilename(), uploadedFile.getId());
            return uploadedFile.getId();
        } catch (Exception e) {
            log.error("Google Drive upload failed. Error: {}", e.getMessage());
            throw new RuntimeException("Google Drive upload failed: " + e.getMessage(), e);
        }
    }

    @Override
    public String uploadFile(MultipartFile file, java.util.List<String> folderHierarchy, Long userId) throws IOException {
        boolean connected = isUserDriveConnected(userId);
        log.info("Drive upload check: userId={}, connected={}, folderId={}", userId, connected, rootFolderId);
        if (connected) {
            if ("mock-folder-id".equals(rootFolderId)) {
                throw new IllegalStateException("Google Drive is in mock mode (mock-folder-id), real upload is disabled.");
            }
            if (clientId == null || clientId.trim().isEmpty() || clientSecret == null || clientSecret.trim().isEmpty()) {
                throw new IllegalStateException("Google Drive Client ID or Client Secret is not configured.");
            }
            log.info("Attempting real Google Drive upload for userId={}", userId);
            try {
                Drive userDrive = getDriveClientForUser(userId);
                String currentParentId = "root";
                for (String folderName : folderHierarchy) {
                    if (folderName != null && !folderName.isBlank()) {
                        currentParentId = getOrCreateFolder(userDrive, folderName.trim(), currentParentId);
                    }
                }

                File fileMetadata = new File();
                fileMetadata.setName(file.getOriginalFilename());
                fileMetadata.setParents(Collections.singletonList(currentParentId));

                InputStreamContent mediaContent = new InputStreamContent(
                        file.getContentType(),
                        file.getInputStream()
                );

                File uploadedFile = userDrive.files().create(fileMetadata, mediaContent)
                        .setFields("id, name, webViewLink")
                        .setSupportsAllDrives(true)
                        .execute();

                log.info("USER GOOGLE DRIVE: Uploaded file '{}' to hierarchy with ID: {}", file.getOriginalFilename(), uploadedFile.getId());
                return uploadedFile.getId();
            } catch (Exception e) {
                log.error("Real Google Drive upload failed for userId={}: {}", userId, e.getMessage(), e);
                throw new RuntimeException("Failed to upload file to user's Google Drive: " + e.getMessage(), e);
            }
        }

        if ("mock-folder-id".equals(rootFolderId)) {
            String folderPath = String.join(java.io.File.separator, folderHierarchy);
            if (folderPath.isEmpty()) {
                folderPath = "Khác";
            }
            return uploadFileMock(file, folderPath);
        }
        try {
            String currentParentId = rootFolderId;
            for (String folderName : folderHierarchy) {
                if (folderName != null && !folderName.isBlank()) {
                    currentParentId = getOrCreateFolder(googleDrive, folderName.trim(), currentParentId);
                }
            }

            File fileMetadata = new File();
            fileMetadata.setName(file.getOriginalFilename());
            fileMetadata.setParents(Collections.singletonList(currentParentId));

            InputStreamContent mediaContent = new InputStreamContent(
                    file.getContentType(),
                    file.getInputStream()
            );

            File uploadedFile = googleDrive.files().create(fileMetadata, mediaContent)
                    .setFields("id, name, webViewLink")
                    .setSupportsAllDrives(true)
                    .execute();

            log.info("GOOGLE DRIVE: Uploaded file '{}' to hierarchy with ID: {}", file.getOriginalFilename(), uploadedFile.getId());
            return uploadedFile.getId();
        } catch (Exception e) {
            log.error("Google Drive upload hierarchy failed. Error: {}", e.getMessage());
            throw new RuntimeException("Google Drive upload hierarchy failed: " + e.getMessage(), e);
        }
    }

    private String uploadFileMock(MultipartFile file, String folderName) throws IOException {
        String originalFileName = StringUtils.cleanPath(
                Objects.requireNonNull(file.getOriginalFilename(), "Original filename must not be null")
        );
        String extension = getExtension(originalFileName);

        // Tạo mã file Google Drive giả lập
        String googleDriveFileId = "gdrive_" + UUID.randomUUID().toString().replace("-", "");
        String savedFileName = googleDriveFileId + (extension.isEmpty() ? "" : "." + extension);

        // Lưu trữ vật lý vào thư mục mock local để phục vụ trích xuất text
        Path targetPath = Paths.get(uploadDir, "google_drive_mock", savedFileName).toAbsolutePath().normalize();
        Files.createDirectories(targetPath.getParent());
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        log.info("MOCK GOOGLE DRIVE: Đã upload thành công file lên Google Drive (Giả lập). File ID: {}", googleDriveFileId);
        return googleDriveFileId;
    }

    @Override
    public Resource downloadFile(String googleDriveFileId) throws IOException {
        return downloadFile(googleDriveFileId, null);
    }

    @Override
    public Resource downloadFile(String googleDriveFileId, Long userId) throws IOException {
        if (googleDriveFileId != null && googleDriveFileId.startsWith("staging_")) {
            return downloadFileStaging(googleDriveFileId);
        }
        if (googleDriveFileId == null || googleDriveFileId.startsWith("gdrive_")) {
            return downloadFileMock(googleDriveFileId);
        }
        try {
            Drive driveClient = getDriveClientForUser(userId);
            InputStream inputStream = driveClient.files()
                    .get(googleDriveFileId)
                    .setSupportsAllDrives(true)
                    .executeMediaAsInputStream();

            return new InputStreamResource(inputStream);
        } catch (Exception e) {
            log.error("Google Drive download failed for ID {} and user {}. Falling back to default/mock. Error: {}", googleDriveFileId, userId, e.getMessage());
            if (isUserDriveConnected(userId)) {
                try {
                    InputStream inputStream = googleDrive.files()
                            .get(googleDriveFileId)
                            .setSupportsAllDrives(true)
                            .executeMediaAsInputStream();
                    return new InputStreamResource(inputStream);
                } catch (Exception ex) {
                    log.error("Fallback Google Drive download failed. Error: {}", ex.getMessage());
                }
            }
            return downloadFileMock(googleDriveFileId);
        }
    }

    private Resource downloadFileMock(String googleDriveFileId) throws IOException {
        Path dirPath = Paths.get(uploadDir, "google_drive_mock").toAbsolutePath().normalize();
        try (var files = Files.list(dirPath)) {
            Path matchedFile = files.filter(p -> p.getFileName().toString().startsWith(googleDriveFileId))
                    .findFirst()
                    .orElseThrow(() -> new IOException("Không tìm thấy file trên Google Drive Mock: " + googleDriveFileId));
            return new UrlResource(matchedFile.toUri());
        }
    }

    private Resource downloadFileStaging(String googleDriveFileId) throws IOException {
        Path dirPath = Paths.get(uploadDir, "google_drive_staging").toAbsolutePath().normalize();
        if (!Files.exists(dirPath)) {
            throw new IOException("Staging directory not found: " + dirPath);
        }
        try (var files = Files.list(dirPath)) {
            Path matchedFile = files.filter(p -> p.getFileName().toString().startsWith(googleDriveFileId))
                    .findFirst()
                    .orElseThrow(() -> new IOException("Không tìm thấy file trên Google Drive Staging: " + googleDriveFileId));
            return new UrlResource(matchedFile.toUri());
        }
    }

    @Override
    public void deleteFile(String googleDriveFileId) throws IOException {
        deleteFile(googleDriveFileId, null);
    }

    @Override
    public void deleteFile(String googleDriveFileId, Long userId) throws IOException {
        if (googleDriveFileId != null && googleDriveFileId.startsWith("staging_")) {
            deleteFileStaging(googleDriveFileId);
            return;
        }
        if (googleDriveFileId == null || googleDriveFileId.startsWith("gdrive_")) {
            deleteFileMock(googleDriveFileId);
            return;
        }
        try {
            Drive driveClient = getDriveClientForUser(userId);
            driveClient.files().delete(googleDriveFileId)
                    .setSupportsAllDrives(true)
                    .execute();
            log.info("GOOGLE DRIVE: Deleted file ID: {} using client for user: {}", googleDriveFileId, userId);
        } catch (Exception e) {
            log.error("Google Drive delete failed for ID {} and user {}. Falling back to default/mock. Error: {}", googleDriveFileId, userId, e.getMessage());
            if (isUserDriveConnected(userId)) {
                try {
                    googleDrive.files().delete(googleDriveFileId)
                            .setSupportsAllDrives(true)
                            .execute();
                    log.info("GOOGLE DRIVE: Deleted file ID: {} using default googleDrive", googleDriveFileId);
                    return;
                } catch (Exception ex) {
                    log.error("Fallback Google Drive delete failed. Error: {}", ex.getMessage());
                }
            }
            deleteFileMock(googleDriveFileId);
        }
    }

    private void deleteFileMock(String googleDriveFileId) throws IOException {
        Path dirPath = Paths.get(uploadDir, "google_drive_mock").toAbsolutePath().normalize();
        if (!Files.exists(dirPath)) {
            log.warn("MOCK GOOGLE DRIVE: Directory '{}' does not exist. Nothing to delete.", dirPath);
            return;
        }
        try (var files = Files.list(dirPath)) {
            var matchedFile = files.filter(p -> p.getFileName().toString().startsWith(googleDriveFileId)).findFirst();
            if (matchedFile.isPresent()) {
                Files.delete(matchedFile.get());
                log.info("MOCK GOOGLE DRIVE: Đã xóa file ID: {}", googleDriveFileId);
            }
        }
    }

    private void deleteFileStaging(String googleDriveFileId) throws IOException {
        Path dirPath = Paths.get(uploadDir, "google_drive_staging").toAbsolutePath().normalize();
        if (!Files.exists(dirPath)) {
            log.warn("GOOGLE DRIVE STAGING: Directory '{}' does not exist. Nothing to delete.", dirPath);
            return;
        }
        try (var files = Files.list(dirPath)) {
            var matchedFile = files.filter(p -> p.getFileName().toString().startsWith(googleDriveFileId)).findFirst();
            if (matchedFile.isPresent()) {
                Files.delete(matchedFile.get());
                log.info("GOOGLE DRIVE STAGING: Deleted staged file ID: {}", googleDriveFileId);
            }
        }
    }

    // -------------------------------------------------------------------------
    // Helper: Tìm hoặc tạo subfolder
    // -------------------------------------------------------------------------

    @Override
    public boolean isUserDriveConnected(Long userId) {
        if (userId == null) {
            return false;
        }
        return connectionRepository.findByUserId(userId)
                .map(UserGoogleDriveConnection::getIsConnected)
                .orElse(false);
    }

    private Drive getDriveClientForUser(Long userId) {
        if (userId == null) {
            return googleDrive;
        }
        var connectionOpt = connectionRepository.findByUserId(userId);
        if (connectionOpt.isPresent() && Boolean.TRUE.equals(connectionOpt.get().getIsConnected())) {
            UserGoogleDriveConnection conn = connectionOpt.get();
            String encryptedToken = conn.getEncryptedRefreshToken();
            if (encryptedToken == null || encryptedToken.trim().isEmpty()) {
                throw new IllegalStateException("Google Drive refresh token is missing.");
            }
            try {
                String refreshToken = encryptionService.decrypt(encryptedToken);
                com.google.auth.Credentials credentials = UserCredentials.newBuilder()
                        .setClientId(clientId)
                        .setClientSecret(clientSecret)
                        .setRefreshToken(refreshToken)
                        .build();

                com.google.api.client.http.HttpRequestInitializer requestInitializer = new com.google.api.client.http.HttpRequestInitializer() {
                    private final HttpCredentialsAdapter credentialsAdapter = new HttpCredentialsAdapter(credentials);
                    @Override
                    public void initialize(com.google.api.client.http.HttpRequest request) throws IOException {
                        credentialsAdapter.initialize(request);
                        request.setConnectTimeout(5000);
                        request.setReadTimeout(5000);
                    }
                };

                return new Drive.Builder(
                        new NetHttpTransport(),
                        GsonFactory.getDefaultInstance(),
                        requestInitializer)
                        .setApplicationName("LumiEdu-StudyHub")
                        .build();
            } catch (Exception e) {
                log.error("Failed to build Google Drive client for user {}: {}", userId, e.getMessage());
                throw new RuntimeException("Failed to build Google Drive client: " + e.getMessage(), e);
            }
        }
        return googleDrive;
    }

    private String getOrCreateFolder(Drive driveClient, String folderName, String parentFolderId) throws IOException {
        String cleanFolderName = folderName.replace("'", "\\'");
        String query = String.format(
                "mimeType='application/vnd.google-apps.folder' and name='%s' and '%s' in parents and trashed=false",
                cleanFolderName, parentFolderId
        );

        var result = driveClient.files().list()
                .setQ(query)
                .setFields("files(id, name)")
                .setSupportsAllDrives(true)
                .setIncludeItemsFromAllDrives(true)
                .execute();

        if (result.getFiles() != null && !result.getFiles().isEmpty()) {
            return result.getFiles().get(0).getId();
        }

        File folderMetadata = new File();
        folderMetadata.setName(folderName);
        folderMetadata.setMimeType("application/vnd.google-apps.folder");
        folderMetadata.setParents(Collections.singletonList(parentFolderId));

        File createdFolder = driveClient.files().create(folderMetadata)
                .setFields("id")
                .setSupportsAllDrives(true)
                .execute();

        log.info("GOOGLE DRIVE: Created folder '{}' with ID: {}", folderName, createdFolder.getId());
        return createdFolder.getId();
    }

    private String getOrCreateFolder(String folderName, String parentFolderId) throws IOException {
        return getOrCreateFolder(this.googleDrive, folderName, parentFolderId);
    }

    private String getExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == filename.length() - 1) {
            return "";
        }
        return filename.substring(dotIndex + 1);
    }

    @Override
    public void shareFile(String googleDriveFileId, String email, String role) throws IOException {
        if (googleDriveFileId != null && googleDriveFileId.startsWith("gdrive_")) {
            throw new IOException("This document does not have a real Google Drive file ID.");
        }
        if (googleDriveFileId == null || googleDriveFileId.isBlank() ||
            "mock-folder-id".equals(rootFolderId)) {
            log.info("MOCK GOOGLE DRIVE: Sharing file ID: {} with email: {} as role: {}", googleDriveFileId, email, role);
            return;
        }
        shareFile(googleDriveFileId, email, role, null);
    }

    @Override
    public void shareFile(String googleDriveFileId, String email, String role, Long userId) throws IOException {
        if (googleDriveFileId != null && googleDriveFileId.startsWith("gdrive_")) {
            throw new IOException("This document does not have a real Google Drive file ID.");
        }
        try {
            Drive driveClient = getDriveClientForUser(userId);
            // First check if permission already exists
            String existingPermissionId = null;
            try {
                var permissionsList = driveClient.permissions().list(googleDriveFileId)
                        .setFields("permissions(id,emailAddress,type,role)")
                        .setSupportsAllDrives(true)
                        .execute();
                if (permissionsList.getPermissions() != null) {
                    for (Permission p : permissionsList.getPermissions()) {
                        if (email.equalsIgnoreCase(p.getEmailAddress())) {
                            existingPermissionId = p.getId();
                            break;
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to list existing permissions for Google Drive file {} and user {}: {}", googleDriveFileId, userId, e.getMessage());
            }

            if (existingPermissionId != null) {
                // Update existing permission
                Permission permission = new Permission();
                permission.setRole(role);
                driveClient.permissions().update(googleDriveFileId, existingPermissionId, permission)
                        .setSupportsAllDrives(true)
                        .execute();
                log.info("GOOGLE DRIVE: Updated permission for file ID: {} for email: {} to role: {} using client for user: {}", googleDriveFileId, email, role, userId);
            } else {
                // Create new permission
                Permission permission = new Permission();
                permission.setType("user");
                permission.setRole(role);
                permission.setEmailAddress(email);
                driveClient.permissions().create(googleDriveFileId, permission)
                        .setSupportsAllDrives(true)
                        .execute();
                log.info("GOOGLE DRIVE: Shared file ID: {} with email: {} as role: {} using client for user: {}", googleDriveFileId, email, role, userId);
            }
        } catch (Exception e) {
            log.error("Google Drive sharing failed for file ID: {} and email: {} and user {}. Error: {}", googleDriveFileId, email, userId, e.getMessage());
            if (isUserDriveConnected(userId)) {
                try {
                    shareFile(googleDriveFileId, email, role, null);
                    return;
                } catch (Exception ex) {
                    log.error("Fallback Google Drive sharing failed. Error: {}", ex.getMessage());
                }
            }
            throw new IOException("Google Drive permission API failed: " + e.getMessage(), e);
        }
    }

    @Override
    public void revokeShare(String googleDriveFileId, String email) throws IOException {
        if (googleDriveFileId != null && googleDriveFileId.startsWith("gdrive_")) {
            throw new IOException("This document does not have a real Google Drive file ID.");
        }
        if (googleDriveFileId == null || googleDriveFileId.isBlank() ||
            "mock-folder-id".equals(rootFolderId)) {
            log.info("MOCK GOOGLE DRIVE: Revoking share on file ID: {} for email: {}", googleDriveFileId, email);
            return;
        }
        revokeShare(googleDriveFileId, email, null);
    }

    @Override
    public void revokeShare(String googleDriveFileId, String email, Long userId) throws IOException {
        if (googleDriveFileId != null && googleDriveFileId.startsWith("gdrive_")) {
            throw new IOException("This document does not have a real Google Drive file ID.");
        }
        try {
            Drive driveClient = getDriveClientForUser(userId);
            var permissionsList = driveClient.permissions().list(googleDriveFileId)
                    .setFields("permissions(id,emailAddress,type,role)")
                    .setSupportsAllDrives(true)
                    .execute();
            if (permissionsList.getPermissions() != null) {
                for (Permission p : permissionsList.getPermissions()) {
                    if (email.equalsIgnoreCase(p.getEmailAddress())) {
                        if ("owner".equalsIgnoreCase(p.getRole()) || "owner".equalsIgnoreCase(p.getType())) {
                            log.info("GOOGLE DRIVE: Skip deleting owner permission for email: {}", email);
                            continue;
                        }
                        driveClient.permissions().delete(googleDriveFileId, p.getId())
                                .setSupportsAllDrives(true)
                                .execute();
                        log.info("GOOGLE DRIVE: Revoked share on file ID: {} for email: {} using client for user: {}", googleDriveFileId, email, userId);
                        return;
                    }
                }
            }
            log.info("GOOGLE DRIVE: No matching permission found to revoke for email: {}", email);
        } catch (Exception e) {
            log.error("Google Drive revoking failed for file ID: {} and email: {} and user {}. Error: {}", googleDriveFileId, email, userId, e.getMessage());
            if (isUserDriveConnected(userId)) {
                try {
                    revokeShare(googleDriveFileId, email, null);
                    return;
                } catch (Exception ex) {
                    log.error("Fallback Google Drive revoking failed. Error: {}", ex.getMessage());
                }
            }
            log.warn("Revoke share call encountered an error but continuing gracefully to prevent breaking the flow: {}", e.getMessage());
        }
    }
}
