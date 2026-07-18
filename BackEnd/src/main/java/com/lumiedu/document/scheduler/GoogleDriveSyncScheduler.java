package com.lumiedu.document.scheduler;

import com.lumiedu.document.entity.Document;
import com.lumiedu.document.repository.DocumentRepository;
import com.lumiedu.document.service.GoogleDriveService;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class GoogleDriveSyncScheduler {

    private final DocumentRepository documentRepository;
    private final GoogleDriveService googleDriveService;
    private final UserRepository userRepository;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Scheduled(fixedDelay = 60000)
    public void syncStagedDocuments() {
        List<Document> stagedDocs = documentRepository.findByDriveSyncStatusAndDeletedFalse("STAGING");
        if (stagedDocs.isEmpty()) {
            return;
        }

        log.info("Starting background sync for {} staged documents...", stagedDocs.size());

        for (Document doc : stagedDocs) {
            Path stagedPath = Paths.get(uploadDir, "google_drive_staging", doc.getFileName()).toAbsolutePath().normalize();
            if (!Files.exists(stagedPath)) {
                log.error("Staged file not found on disk for document ID: {}. Path: {}", doc.getId(), stagedPath);
                doc.setDriveSyncStatus("FAILED");
                doc.setDriveSyncError("Staged file not found on disk.");
                documentRepository.save(doc);
                continue;
            }

            try {
                List<String> folderHierarchy = new ArrayList<>();
                String userFolder = "User_" + doc.getUserId();
                if (doc.getUserId() != null) {
                    Optional<User> uOpt = userRepository.findById(doc.getUserId());
                    if (uOpt.isPresent()) {
                        userFolder = uOpt.get().getEmail();
                    }
                }
                folderHierarchy.add(userFolder);
                if (doc.getSubject() != null && !doc.getSubject().isBlank()) {
                    folderHierarchy.add(doc.getSubject().trim());
                }

                PathMultipartFile multipartFile = new PathMultipartFile(
                        stagedPath,
                        doc.getOriginalFileName(),
                        doc.getMimeType()
                );

                String realDriveId = googleDriveService.uploadFile(multipartFile, folderHierarchy, doc.getUserId());
                if (realDriveId != null && !realDriveId.startsWith("gdrive_") && !realDriveId.startsWith("staging_")) {
                    doc.setGoogleDriveFileId(realDriveId);
                    doc.setStorageProvider("GOOGLE_DRIVE");
                    doc.setFileUrl("https://drive.google.com/file/d/" + realDriveId + "/view");
                    doc.setDriveSyncStatus("SYNCED");
                    doc.setDriveSyncError(null);
                    documentRepository.save(doc);

                    try {
                        Files.delete(stagedPath);
                        log.info("Successfully synced document ID: {} to Google Drive and deleted staged file.", doc.getId());
                    } catch (IOException e) {
                        log.warn("Failed to delete staged local file after sync for document ID {}: {}", doc.getId(), e.getMessage());
                    }
                } else {
                    throw new RuntimeException("Upload returned a mock or staging ID: " + realDriveId);
                }
            } catch (Exception e) {
                log.error("Failed to sync document ID {} to Google Drive: {}", doc.getId(), e.getMessage());
                doc.setDriveSyncError(e.getMessage());
                documentRepository.save(doc);
            }
        }
    }

    private static class PathMultipartFile implements MultipartFile {
        private final Path path;
        private final String originalFilename;
        private final String contentType;

        public PathMultipartFile(Path path, String originalFilename, String contentType) {
            this.path = path;
            this.originalFilename = originalFilename;
            this.contentType = contentType;
        }

        @Override
        public String getName() {
            return originalFilename;
        }

        @Override
        public String getOriginalFilename() {
            return originalFilename;
        }

        @Override
        public String getContentType() {
            return contentType;
        }

        @Override
        public boolean isEmpty() {
            try {
                return Files.size(path) == 0;
            } catch (IOException e) {
                return true;
            }
        }

        @Override
        public long getSize() {
            try {
                return Files.size(path);
            } catch (IOException e) {
                return 0;
            }
        }

        @Override
        public byte[] getBytes() throws IOException {
            return Files.readAllBytes(path);
        }

        @Override
        public InputStream getInputStream() throws IOException {
            return Files.newInputStream(path);
        }

        @Override
        public void transferTo(File dest) throws IOException, IllegalStateException {
            Files.copy(path, dest.toPath(), StandardCopyOption.REPLACE_EXISTING);
        }
    }
}
