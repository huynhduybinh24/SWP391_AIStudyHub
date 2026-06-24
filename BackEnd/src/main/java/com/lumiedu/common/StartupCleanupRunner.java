package com.lumiedu.common;

import com.lumiedu.document.entity.Document;
import com.lumiedu.document.repository.*;
import com.lumiedu.workspace.repository.WorkspaceDocumentRepository;
import com.lumiedu.workspace.entity.WorkspaceDocument;
import com.lumiedu.document.service.GoogleDriveService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class StartupCleanupRunner implements CommandLineRunner {

    private final DocumentRepository documentRepository;
    private final DocumentShareRepository documentShareRepository;
    private final DocumentTagRepository documentTagRepository;
    private final DocumentDownloadRepository documentDownloadRepository;
    private final AudioRecordRepository audioRecordRepository;
    private final WorkspaceDocumentRepository workspaceDocumentRepository;
    private final GoogleDriveService googleDriveService;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Override
    public void run(String... args) throws Exception {
        log.info("Starting StartupCleanupRunner: Purging non-PDF files...");
        List<Document> documents = documentRepository.findAll();
        int deletedCount = 0;

        for (Document doc : documents) {
            String filename = doc.getOriginalFileName();
            if (filename == null) {
                filename = doc.getFileName();
            }
            
            boolean isPdf = false;
            if (filename != null && filename.toLowerCase().endsWith(".pdf")) {
                isPdf = true;
            }

            if (!isPdf) {
                log.info("Purging non-PDF document: ID={}, name={}, fileUrl={}", doc.getId(), filename, doc.getFileUrl());
                
                // 1. Delete from Google Drive (if uploaded there)
                if (doc.getGoogleDriveFileId() != null) {
                    try {
                        googleDriveService.deleteFile(doc.getGoogleDriveFileId());
                    } catch (Exception e) {
                        log.warn("Failed to delete file from Google Drive for doc ID {}: {}", doc.getId(), e.getMessage());
                    }
                }

                // 2. Delete local files (local upload file, media, audio, mock files)
                if (doc.getFileName() != null) {
                    deleteLocalFile(Paths.get(uploadDir, "DOCUMENT", doc.getFileName()));
                    deleteLocalFile(Paths.get(uploadDir, "MEDIA", doc.getFileName()));
                    deleteLocalFile(Paths.get(uploadDir, "AUDIO", doc.getFileName()));
                    deleteLocalFile(Paths.get(uploadDir, "google_drive_mock", doc.getFileName()));
                }

                // 3. Delete database relationships
                try {
                    // Workspace links
                    List<WorkspaceDocument> workspaceDocs = workspaceDocumentRepository.findByDocumentId(doc.getId());
                    workspaceDocumentRepository.deleteAll(workspaceDocs);

                    // Tags
                    var tags = documentTagRepository.findAllByDocumentId(doc.getId());
                    documentTagRepository.deleteAll(tags);

                    // Shares
                    var shares = documentShareRepository.findByDocumentId(doc.getId());
                    documentShareRepository.deleteAll(shares);

                    // Downloads
                    var downloads = documentDownloadRepository.findAllByDocumentId(doc.getId());
                    documentDownloadRepository.deleteAll(downloads);

                    // Audio records
                    var audios = audioRecordRepository.findAllByDocumentId(doc.getId());
                    audioRecordRepository.deleteAll(audios);

                    // The document itself
                    documentRepository.delete(doc);
                    deletedCount++;
                } catch (Exception e) {
                    log.error("Error deleting database records for doc ID {}: {}", doc.getId(), e.getMessage());
                }
            }
        }

        if (deletedCount > 0) {
            log.info("Purged {} non-PDF documents and files successfully.", deletedCount);
        } else {
            log.info("No non-PDF files found to purge.");
        }
    }

    private void deleteLocalFile(Path path) {
        try {
            File file = path.toFile();
            if (file.exists() && file.isFile()) {
                if (file.delete()) {
                    log.info("Deleted local file: {}", path);
                } else {
                    log.warn("Failed to delete local file: {}", path);
                }
            }
        } catch (Exception e) {
            log.warn("Error deleting file at {}: {}", path, e.getMessage());
        }
    }
}
