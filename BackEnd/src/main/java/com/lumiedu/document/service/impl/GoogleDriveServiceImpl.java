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

    @Value("${google.drive.folder-id}")
    private String rootFolderId;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Override
    public String uploadFile(MultipartFile file, String folderName) throws IOException {
        if ("mock-folder-id".equals(rootFolderId)) {
            return uploadFileMock(file, folderName);
        }
        try {
            // 1. Tìm hoặc tạo subfolder trong LumiEdu_Workspace
            String targetFolderId = getOrCreateFolder(folderName, rootFolderId);

            // 2. Upload file lên Google Drive
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
            log.error("Google Drive upload failed. Falling back to local mock storage. Error: {}", e.getMessage());
            return uploadFileMock(file, folderName);
        }
    }

    @Override
    public String uploadFile(MultipartFile file, java.util.List<String> folderHierarchy) throws IOException {
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
                    currentParentId = getOrCreateFolder(folderName.trim(), currentParentId);
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
            log.error("Google Drive upload hierarchy failed. Falling back to local mock storage. Error: {}", e.getMessage());
            String folderName = folderHierarchy.isEmpty() ? "Khác" : folderHierarchy.get(folderHierarchy.size() - 1);
            return uploadFileMock(file, folderName);
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
        if ("mock-folder-id".equals(rootFolderId) || (googleDriveFileId != null && googleDriveFileId.startsWith("gdrive_"))) {
            return downloadFileMock(googleDriveFileId);
        }
        try {
            InputStream inputStream = googleDrive.files()
                    .get(googleDriveFileId)
                    .setSupportsAllDrives(true)
                    .executeMediaAsInputStream();

            return new InputStreamResource(inputStream);
        } catch (Exception e) {
            log.error("Google Drive download failed for ID {}. Falling back to local mock. Error: {}", googleDriveFileId, e.getMessage());
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

    @Override
    public void deleteFile(String googleDriveFileId) throws IOException {
        if ("mock-folder-id".equals(rootFolderId) || (googleDriveFileId != null && googleDriveFileId.startsWith("gdrive_"))) {
            deleteFileMock(googleDriveFileId);
            return;
        }
        try {
            googleDrive.files().delete(googleDriveFileId)
                    .setSupportsAllDrives(true)
                    .execute();
            log.info("GOOGLE DRIVE: Deleted file ID: {}", googleDriveFileId);
        } catch (Exception e) {
            log.error("Google Drive delete failed for ID {}. Falling back to local mock. Error: {}", googleDriveFileId, e.getMessage());
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

    // -------------------------------------------------------------------------
    // Helper: Tìm hoặc tạo subfolder
    // -------------------------------------------------------------------------

    private String getOrCreateFolder(String folderName, String parentFolderId) throws IOException {
        // Tìm folder đã tồn tại
        String query = String.format(
                "mimeType='application/vnd.google-apps.folder' and name='%s' and '%s' in parents and trashed=false",
                folderName, parentFolderId
        );

        var result = googleDrive.files().list()
                .setQ(query)
                .setFields("files(id, name)")
                .setSupportsAllDrives(true)
                .setIncludeItemsFromAllDrives(true)
                .execute();

        if (result.getFiles() != null && !result.getFiles().isEmpty()) {
            return result.getFiles().get(0).getId();
        }

        // Tạo folder mới nếu chưa có
        File folderMetadata = new File();
        folderMetadata.setName(folderName);
        folderMetadata.setMimeType("application/vnd.google-apps.folder");
        folderMetadata.setParents(Collections.singletonList(parentFolderId));

        File createdFolder = googleDrive.files().create(folderMetadata)
                .setFields("id")
                .setSupportsAllDrives(true)
                .execute();

        log.info("GOOGLE DRIVE: Created folder '{}' with ID: {}", folderName, createdFolder.getId());
        return createdFolder.getId();
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
        if (googleDriveFileId == null || googleDriveFileId.isBlank() ||
            "mock-folder-id".equals(rootFolderId) || googleDriveFileId.startsWith("gdrive_")) {
            log.info("MOCK GOOGLE DRIVE: Sharing file ID: {} with email: {} as role: {}", googleDriveFileId, email, role);
            return;
        }
        try {
            // First check if permission already exists
            String existingPermissionId = null;
            try {
                var permissionsList = googleDrive.permissions().list(googleDriveFileId)
                        .setFields("permissions(id, emailAddress)")
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
                log.warn("Failed to list existing permissions for Google Drive file {}: {}", googleDriveFileId, e.getMessage());
            }

            if (existingPermissionId != null) {
                // Update existing permission
                Permission permission = new Permission();
                permission.setRole(role);
                googleDrive.permissions().update(googleDriveFileId, existingPermissionId, permission)
                        .setSupportsAllDrives(true)
                        .execute();
                log.info("GOOGLE DRIVE: Updated permission for file ID: {} for email: {} to role: {}", googleDriveFileId, email, role);
            } else {
                // Create new permission
                Permission permission = new Permission();
                permission.setType("user");
                permission.setRole(role);
                permission.setEmailAddress(email);
                googleDrive.permissions().create(googleDriveFileId, permission)
                        .setSupportsAllDrives(true)
                        .execute();
                log.info("GOOGLE DRIVE: Shared file ID: {} with email: {} as role: {}", googleDriveFileId, email, role);
            }
        } catch (Exception e) {
            log.error("Google Drive sharing failed for file ID: {} and email: {}. Error: {}", googleDriveFileId, email, e.getMessage());
            throw new IOException("Google Drive permission API failed: " + e.getMessage(), e);
        }
    }

    @Override
    public void revokeShare(String googleDriveFileId, String email) throws IOException {
        if (googleDriveFileId == null || googleDriveFileId.isBlank() ||
            "mock-folder-id".equals(rootFolderId) || googleDriveFileId.startsWith("gdrive_")) {
            log.info("MOCK GOOGLE DRIVE: Revoking share on file ID: {} for email: {}", googleDriveFileId, email);
            return;
        }
        try {
            var permissionsList = googleDrive.permissions().list(googleDriveFileId)
                    .setFields("permissions(id, emailAddress)")
                    .setSupportsAllDrives(true)
                    .execute();
            if (permissionsList.getPermissions() != null) {
                for (Permission p : permissionsList.getPermissions()) {
                    if (email.equalsIgnoreCase(p.getEmailAddress())) {
                        googleDrive.permissions().delete(googleDriveFileId, p.getId())
                                .setSupportsAllDrives(true)
                                .execute();
                        log.info("GOOGLE DRIVE: Revoked share on file ID: {} for email: {}", googleDriveFileId, email);
                        return;
                    }
                }
            }
        } catch (Exception e) {
            log.error("Google Drive revoking failed for file ID: {} and email: {}. Error: {}", googleDriveFileId, email, e.getMessage());
            throw new IOException("Google Drive permission API failed: " + e.getMessage(), e);
        }
    }
}
