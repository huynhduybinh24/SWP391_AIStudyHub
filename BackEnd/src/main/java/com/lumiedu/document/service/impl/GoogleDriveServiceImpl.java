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
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleDriveServiceImpl implements GoogleDriveService {

    private final Drive googleDrive;

    @Value("${google.drive.folder-id}")
    private String rootFolderId;

    @Override
    public String uploadFile(MultipartFile file, String folderName) throws IOException {
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
                .execute();

        log.info("GOOGLE DRIVE: Uploaded file '{}' with ID: {}", file.getOriginalFilename(), uploadedFile.getId());
        return uploadedFile.getId();
    }

    @Override
    public Resource downloadFile(String googleDriveFileId) throws IOException {
        InputStream inputStream = googleDrive.files()
                .get(googleDriveFileId)
                .executeMediaAsInputStream();

        return new InputStreamResource(inputStream);
    }

    @Override
    public void deleteFile(String googleDriveFileId) throws IOException {
        googleDrive.files().delete(googleDriveFileId).execute();
        log.info("GOOGLE DRIVE: Deleted file ID: {}", googleDriveFileId);
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
                .execute();

        log.info("GOOGLE DRIVE: Created folder '{}' with ID: {}", folderName, createdFolder.getId());
        return createdFolder.getId();
    }
}
