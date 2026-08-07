package com.lumiedu.document.service.impl;

import com.lumiedu.document.dto.request.DocumentCreateRequest;
import com.lumiedu.document.dto.request.DocumentUpdateRequest;
import com.lumiedu.document.dto.response.DocumentResponse;
import com.lumiedu.document.dto.response.SubjectStatsResponse;
import com.lumiedu.document.dto.response.DocumentShareResponse;
import com.lumiedu.document.enums.DocumentStatus;
import com.lumiedu.ai.repository.QuizAttemptRepository;
import com.lumiedu.ai.repository.StudyPlanRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lumiedu.document.entity.AudioRecord;
import com.lumiedu.document.entity.Document;
import com.lumiedu.document.entity.DocumentDownload;
import com.lumiedu.document.entity.DocumentTag;
import com.lumiedu.document.exception.DocumentNotFoundException;
import com.lumiedu.document.exception.FileStorageException;
import com.lumiedu.document.exception.InvalidFileTypeException;
import com.lumiedu.document.entity.DocumentShare;
import com.lumiedu.document.repository.DocumentShareRepository;
import com.lumiedu.document.repository.AudioRecordRepository;
import com.lumiedu.document.repository.DocumentDownloadRepository;
import com.lumiedu.document.repository.DocumentRepository;
import com.lumiedu.document.repository.DocumentTagRepository;
import com.lumiedu.document.service.DocumentService;
import com.lumiedu.document.service.GoogleDriveService;
import com.lumiedu.ai.service.DocumentChunkingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import com.lumiedu.user.entity.User;
import com.lumiedu.document.entity.Subject;
import com.lumiedu.document.repository.SubjectRepository;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.security.MessageDigest;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class DocumentServiceImpl implements DocumentService {

    private static final Set<String> ALLOWED_DOCUMENT_EXTENSIONS = Set.of(
            "pdf"
    );

    private static final Set<String> ALLOWED_MEDIA_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "mp4", "mp3", "wav");

    private static final Set<String> ALLOWED_AUDIO_EXTENSIONS = Set.of(
            "mp3", "wav", "webm", "m4a");

    private static final String FILE_TYPE_DOCUMENT = "DOCUMENT";
    private static final String FILE_TYPE_MEDIA = "MEDIA";
    private static final String FILE_TYPE_AUDIO = "AUDIO";

    @Value("${app.upload.dir}")
    private String uploadDir;

    private final DocumentRepository documentRepository;
    private final DocumentShareRepository documentShareRepository;
    private final DocumentTagRepository documentTagRepository;
    private final DocumentDownloadRepository documentDownloadRepository;
    private final AudioRecordRepository audioRecordRepository;
    private final GoogleDriveService googleDriveService;
    private final DocumentChunkingService documentChunkingService;

    private final com.lumiedu.workspace.repository.WorkspaceDocumentRepository workspaceDocumentRepository;
    private final com.lumiedu.workspace.repository.WorkspaceMemberRepository workspaceMemberRepository;
    private final com.lumiedu.workspace.repository.SharedWorkspaceRepository sharedWorkspaceRepository;
    private final com.lumiedu.user.repository.UserRepository userRepository;
    private final SubjectRepository subjectRepository;

    private final QuizAttemptRepository quizAttemptRepository;
    private final StudyPlanRepository studyPlanRepository;
    private final ObjectMapper objectMapper;
    private final com.lumiedu.notification.service.NotificationService notificationService;
    private final com.lumiedu.email.service.EmailService emailService;

    // -------------------------------------------------------------------------
    // Upload
    // -------------------------------------------------------------------------

    @Override
    public DocumentResponse uploadDocument(MultipartFile file, DocumentCreateRequest request) {
        return saveFile(file, request, FILE_TYPE_DOCUMENT, ALLOWED_DOCUMENT_EXTENSIONS);
    }

    @Override
    public DocumentResponse uploadMedia(MultipartFile file, DocumentCreateRequest request) {
        return saveFile(file, request, FILE_TYPE_MEDIA, ALLOWED_MEDIA_EXTENSIONS);
    }

    private DocumentResponse saveFile(MultipartFile file,
            DocumentCreateRequest request,
            String fileType,
            Set<String> allowedExtensions) {
        validateFile(file);

        // Security correction: get current authenticated user ID
        Long authenticatedUserId = null;
        org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            Object details = auth.getDetails();
            if (details instanceof Long) {
                authenticatedUserId = (Long) details;
            }
        }
        if (authenticatedUserId != null) {
            request.setUserId(authenticatedUserId);
        }

        String originalFileName = StringUtils.cleanPath(
                Objects.requireNonNull(file.getOriginalFilename(), "Original filename must not be null"));
        String extension = getExtension(originalFileName).toLowerCase();

        if (FILE_TYPE_DOCUMENT.equals(fileType) && !"pdf".equalsIgnoreCase(extension)) {
            throw new InvalidFileTypeException(extension, fileType);
        }

        if (!allowedExtensions.contains(extension)) {
            throw new InvalidFileTypeException(extension, fileType);
        }

        // Check for duplicate document within the same subject or globally
        String subjectToUse = request.getSubject() != null && !request.getSubject().trim().isEmpty()
                ? request.getSubject().trim()
                : "GENERAL";
        Long userId = request.getUserId();
        String fileChecksum = calculateChecksum(file);
        String titleToUse = request.getTitle() != null && !request.getTitle().trim().isEmpty()
                ? request.getTitle().trim()
                : originalFileName;

        // SPECIAL WORKSPACE UPLOAD RULE: If uploading inside workspace and the file ALREADY exists in My Documents:
        // Do NOT throw error and do NOT create a new duplicate document in My Documents!
        // Reuse the existing document record so it gets linked to the workspace cleanly without creating a duplicate in My Documents!
        if (Boolean.TRUE.equals(request.getIsWorkspaceUpload()) && userId != null) {
            Document existingUserDoc = null;
            if (fileChecksum != null) {
                existingUserDoc = documentRepository.findFirstByUserIdAndChecksumAndDeletedFalse(userId, fileChecksum).orElse(null);
            }
            if (existingUserDoc == null && request.getTitle() != null && !request.getTitle().trim().isEmpty()) {
                existingUserDoc = documentRepository.findFirstByUserIdAndTitleIgnoreCaseAndDeletedFalse(userId, request.getTitle().trim()).orElse(null);
            }
            if (existingUserDoc == null) {
                existingUserDoc = documentRepository.findFirstByUserIdAndOriginalFileNameIgnoreCaseAndDeletedFalse(userId, originalFileName).orElse(null);
            }

            if (existingUserDoc != null) {
                log.info("Workspace upload matches existing My Documents doc ID {}. Reusing existing document without duplicating in My Documents.", existingUserDoc.getId());
                
                // Still check if it's already in the target workspace
                if (request.getWorkspaceId() != null && workspaceDocumentRepository.existsByWorkspaceIdAndDocumentId(request.getWorkspaceId(), existingUserDoc.getId())) {
                    throw new IllegalArgumentException("[Trùng tài liệu nhóm] Tài liệu này đã được tải lên/chia sẻ trong Nhóm học tập này trước đó. Vui lòng kiểm tra lại danh sách tài liệu nhóm!");
                }
                
                return mapToResponse(existingUserDoc);
            }
        }

        // STEP 1: Check duplicate FILE CONTENT (Checksum SHA-256) for this specific user account
        if (fileChecksum != null && userId != null) {
            boolean checksumExistsForUser = documentRepository.existsByUserIdAndSubjectIgnoreCaseAndChecksumAndDeletedFalse(userId, subjectToUse, fileChecksum);

            if (checksumExistsForUser) {
                throw new IllegalArgumentException("[Trùng nội dung tệp] Bạn đã tải một tệp tin có nội dung giống hệt 100% lên My Documents trước đó cho môn học [" + subjectToUse + "]. Vui lòng không tải lại tệp trùng!");
            }
        }

        // STEP 2: Check duplicate TITLE for this specific user account
        if (request.getTitle() != null && !request.getTitle().trim().isEmpty() && userId != null) {
            String trimmedTitle = request.getTitle().trim();
            boolean titleForUsr = documentRepository.existsByUserIdAndSubjectIgnoreCaseAndTitleIgnoreCaseAndDeletedFalse(userId, subjectToUse, trimmedTitle);

            if (titleForUsr) {
                throw new IllegalArgumentException("[Trùng tiêu đề] Tiêu đề tài liệu '" + trimmedTitle + "' đã tồn tại trong môn học [" + subjectToUse + "]. Vui lòng đổi sang Tiêu đề khác ở ô thông tin!");
            }
        }

        // STEP 3: Check duplicate ORIGINAL FILE NAME for this specific user account
        if (userId != null) {
            boolean nameForUsr = documentRepository.existsByUserIdAndSubjectIgnoreCaseAndOriginalFileNameIgnoreCaseAndDeletedFalse(userId, subjectToUse, originalFileName);

            if (nameForUsr) {
                throw new IllegalArgumentException("[Trùng tên tệp gốc] Tệp '" + originalFileName + "' đã tồn tại trong môn học [" + subjectToUse + "]. Vui lòng nhập 'Tiêu đề tài liệu' riêng để phân biệt hoặc đổi tên file trên máy!");
            }
        }

        // STEP 4: Check duplicate inside the specific Workspace if workspaceId is provided
        if (request.getWorkspaceId() != null && fileChecksum != null) {
            boolean existsInWorkspace = workspaceDocumentRepository.existsByWorkspaceIdAndChecksum(request.getWorkspaceId(), fileChecksum);
            if (existsInWorkspace) {
                throw new IllegalArgumentException("[Trùng tài liệu nhóm] Tài liệu này đã được tải lên/chia sẻ trong Nhóm học tập này trước đó. Vui lòng kiểm tra lại danh sách tài liệu nhóm!");
            }
        }

        // Upload / Reuse Google Drive storage
        String googleDriveFileId = null;
        String fileUrl = null;
        String savedFileName = null;
        boolean uploadedToGDrive = false;
        String driveSyncStatus = "SYNCED";
        String driveSyncError = null;

        // Always save a local backup copy on server disk
        String localFileName = UUID.randomUUID() + "." + extension;
        savedFileName = localFileName;
        fileUrl = buildFileUrl(FILE_TYPE_DOCUMENT, localFileName);
        try {
            Path targetPath = resolveUploadPath(FILE_TYPE_DOCUMENT).resolve(localFileName);
            Files.createDirectories(targetPath.getParent());
            Files.write(targetPath, file.getBytes(), StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            log.info("Saved local backup copy: {}", localFileName);
        } catch (Exception e) {
            log.warn("Could not save local backup copy for {}: {}", originalFileName, e.getMessage());
        }

        if (FILE_TYPE_DOCUMENT.equals(fileType)) {
            // Check if this physical file content was already uploaded to Google Drive by another account
            if (fileChecksum != null) {
                Document existingDriveDoc = documentRepository.findFirstByChecksumAndDeletedFalse(fileChecksum).orElse(null);
                if (existingDriveDoc != null && existingDriveDoc.getGoogleDriveFileId() != null) {
                    googleDriveFileId = existingDriveDoc.getGoogleDriveFileId();
                    fileUrl = existingDriveDoc.getFileUrl();
                    uploadedToGDrive = true;
                    log.info("Reusing existing System Google Drive file ID: {} for matching checksum {}", googleDriveFileId, fileChecksum);
                }
            }

            String effectiveSubject = request.getSubject();
            if (request.getWorkspaceId() != null && (effectiveSubject == null || effectiveSubject.isBlank() || "GENERAL".equalsIgnoreCase(effectiveSubject))) {
                com.lumiedu.workspace.entity.SharedWorkspace ws = sharedWorkspaceRepository.findById(request.getWorkspaceId()).orElse(null);
                if (ws != null && ws.getName() != null && !ws.getName().isBlank()) {
                    effectiveSubject = ws.getName().replaceAll("^(?i)Nhóm\\s+", "").trim();
                }
            }

            java.util.List<String> folderHierarchy;
            if (request.getWorkspaceId() != null) {
                com.lumiedu.workspace.entity.SharedWorkspace ws = sharedWorkspaceRepository.findById(request.getWorkspaceId()).orElse(null);
                String wsName = ws != null ? ws.getName() : ("Workspace_" + request.getWorkspaceId());
                String cleanWsName = wsName.startsWith("Nhóm ") ? wsName : ("Nhóm " + wsName);
                folderHierarchy = java.util.List.of(cleanWsName);
            } else {
                folderHierarchy = getGoogleDriveHierarchy(effectiveSubject, request.getUserId());
            }
            String userGoogleDriveFileId = null;

            // 1. Upload to System Google Drive (System Mail's Drive - Group Folder)
            if (!uploadedToGDrive) {
                try {
                    googleDriveFileId = googleDriveService.uploadFile(file, folderHierarchy);
                    if (googleDriveFileId != null && !googleDriveFileId.startsWith("gdrive_")) {
                        fileUrl = "https://drive.google.com/file/d/" + googleDriveFileId + "/view";
                        uploadedToGDrive = true;
                        log.info("Uploaded to System Google Drive successfully with ID: {} under hierarchy {}", googleDriveFileId, folderHierarchy);
                    }
                } catch (Exception e) {
                    log.warn("System Google Drive upload failed: {}. Using local file backup.", e.getMessage());
                }
            }

            // 2. Upload to Uploader's Personal Google Drive if connected (placed in BOTH LumiEdu StudyHub and Group Folder)
            if (request.getUserId() != null && googleDriveService.isUserDriveConnected(request.getUserId())) {
                try {
                    // Upload to Uploader's Drive: LumiEdu StudyHub -> <Semester> -> <Subject>
                    java.util.List<String> userDriveHierarchy = getGoogleDriveHierarchyForUserDrive(effectiveSubject, request.getUserId());
                    userGoogleDriveFileId = googleDriveService.uploadFile(file, userDriveHierarchy, request.getUserId());
                    if (userGoogleDriveFileId != null && !userGoogleDriveFileId.startsWith("gdrive_")) {
                        log.info("Uploaded to User Personal Google Drive with ID: {} under hierarchy {}", userGoogleDriveFileId, userDriveHierarchy);
                    }

                    // If uploaded inside a Workspace, ALSO upload to Uploader's Drive: Nhóm <WorkspaceName>
                    if (request.getWorkspaceId() != null) {
                        try {
                            com.lumiedu.workspace.entity.SharedWorkspace ws = sharedWorkspaceRepository.findById(request.getWorkspaceId()).orElse(null);
                            String wsName = ws != null ? ws.getName() : ("Workspace_" + request.getWorkspaceId());
                            String cleanWsName = wsName.startsWith("Nhóm ") ? wsName : ("Nhóm " + wsName);
                            java.util.List<String> userGroupHierarchy = java.util.List.of(cleanWsName);
                            String userGroupFileId = googleDriveService.uploadFile(file, userGroupHierarchy, request.getUserId());
                            log.info("Uploaded to User Personal Google Drive Group Folder with ID: {} under hierarchy {}", userGroupFileId, userGroupHierarchy);
                        } catch (Exception e) {
                            log.warn("User Personal Google Drive group folder upload failed: {}", e.getMessage());
                        }
                    }
                } catch (Exception e) {
                    log.warn("User Personal Google Drive upload skipped/failed for userId={}: {}", request.getUserId(), e.getMessage());
                }
            }

            // 2.5 If uploaded inside a Workspace, ALSO save a copy to System Mail's Google Drive in LumiEdu StudyHub & System Personal Folders
            String hubFileId = null;
            if (request.getWorkspaceId() != null) {
                try {
                    // Upload to System Mail's Google Drive: LumiEdu StudyHub -> <Semester> -> <Subject>
                    java.util.List<String> userHubHierarchy = getGoogleDriveHierarchyForUserDrive(effectiveSubject, request.getUserId());
                    hubFileId = googleDriveService.uploadFile(file, userHubHierarchy);
                    log.info("Also saved Workspace file to System Mail Drive under LumiEdu StudyHub folder {} with ID: {}", userHubHierarchy, hubFileId);

                    // Upload to System Mail's Google Drive: <UserEmail> -> <Semester> -> <Subject>
                    java.util.List<String> personalHierarchy = getGoogleDriveHierarchy(effectiveSubject, request.getUserId());
                    String systemPersonalFileId = googleDriveService.uploadFile(file, personalHierarchy);
                    log.info("Also saved Workspace file to System Mail Drive under Personal folder {} with ID: {}", personalHierarchy, systemPersonalFileId);
                } catch (Exception e) {
                    log.warn("Failed to save secondary copy to System Mail Drive folders: {}", e.getMessage());
                }
            }

            // 2.6 Auto-share Google Drive files with Uploader Email so it appears in their Google Drive
            if (request.getUserId() != null) {
                try {
                    User uploader = userRepository.findById(request.getUserId()).orElse(null);
                    if (uploader != null && uploader.getEmail() != null && !uploader.getEmail().isBlank()) {
                        String uploaderEmail = uploader.getEmail();
                        if (googleDriveFileId != null && !googleDriveFileId.startsWith("gdrive_")) {
                            googleDriveService.shareFile(googleDriveFileId, uploaderEmail, "writer");
                        }
                        if (hubFileId != null && !hubFileId.startsWith("gdrive_")) {
                            googleDriveService.shareFile(hubFileId, uploaderEmail, "writer");
                        }
                    }
                } catch (Exception shareEx) {
                    log.warn("Auto-sharing with uploader failed: {}", shareEx.getMessage());
                }
            }

            Document document = Document.builder()
                    .title(request.getTitle())
                    .description(request.getDescription())
                    .subject(request.getSubject())
                    .visibility(request.getVisibility() != null ? request.getVisibility() : "PRIVATE")
                    .userId(request.getUserId())
                    .fileName(savedFileName)
                    .originalFileName(originalFileName)
                    .fileUrl(fileUrl)
                    .fileType(fileType)
                    .mimeType(file.getContentType())
                    .fileSize(file.getSize())
                    .googleDriveFileId(googleDriveFileId)
                    .storageProvider(googleDriveFileId != null ? ("STAGING".equals(driveSyncStatus) ? "GOOGLE_DRIVE_STAGING" : "GOOGLE_DRIVE") : "LOCAL")
                    .checksum(calculateChecksum(file))
                    .deleted(false)
                    .moderationStatus(DocumentStatus.APPROVED)
                    .driveSyncStatus(driveSyncStatus)
                    .driveSyncError(driveSyncError)
                    .build();

            document.setUserGoogleDriveFileId(userGoogleDriveFileId);
            document = documentRepository.save(document);

            if (request.getWorkspaceId() != null) {
                boolean existsInWs = workspaceDocumentRepository.existsByWorkspaceIdAndDocumentId(request.getWorkspaceId(), document.getId());
                if (!existsInWs) {
                    com.lumiedu.workspace.entity.WorkspaceDocument wd = com.lumiedu.workspace.entity.WorkspaceDocument.builder()
                            .workspaceId(request.getWorkspaceId())
                            .documentId(document.getId())
                            .addedBy(request.getUserId())
                            .build();
                    workspaceDocumentRepository.save(wd);
                    log.info("Linked newly uploaded document ID {} to workspace ID {}", document.getId(), request.getWorkspaceId());
                }

                if (googleDriveFileId != null && !googleDriveFileId.startsWith("gdrive_")) {
                    try {
                        com.lumiedu.workspace.entity.SharedWorkspace ws = sharedWorkspaceRepository.findById(request.getWorkspaceId()).orElse(null);
                        if (ws != null) {
                            String wsFolderName = "Nhóm " + ws.getName();
                            String folderId = googleDriveService.getOrCreateFolder(wsFolderName, ws.getOwnerId());
                            
                            java.util.List<com.lumiedu.workspace.entity.WorkspaceMember> members = workspaceMemberRepository.findByWorkspaceIdAndStatus(request.getWorkspaceId(), com.lumiedu.workspace.enums.WorkspaceMemberStatus.ACCEPTED);
                            for (com.lumiedu.workspace.entity.WorkspaceMember m : members) {
                                if (m.getEmail() != null && !m.getEmail().isBlank()) {
                                    String gDriveRole = (m.getRole() == com.lumiedu.workspace.enums.WorkspaceMemberRole.OWNER || m.getRole() == com.lumiedu.workspace.enums.WorkspaceMemberRole.COLLABORATOR) ? "writer" : "reader";
                                    if (folderId != null && !folderId.startsWith("gdrive_")) {
                                        googleDriveService.shareFile(folderId, m.getEmail(), gDriveRole, ws.getOwnerId());
                                    }
                                    googleDriveService.shareFile(googleDriveFileId, m.getEmail(), gDriveRole, ws.getOwnerId());
                                }
                            }
                            log.info("Shared newly uploaded workspace file ID {} and folder '{}' with members", googleDriveFileId, wsFolderName);
                        }
                    } catch (Exception shareEx) {
                        log.warn("Failed to share newly uploaded workspace document to members: {}", shareEx.getMessage());
                    }
                }

                // Send in-app notification and email to ALL workspace members when document is uploaded/updated
                try {
                    com.lumiedu.workspace.entity.SharedWorkspace ws = sharedWorkspaceRepository.findById(request.getWorkspaceId()).orElse(null);
                    User uploader = userRepository.findById(request.getUserId()).orElse(null);
                    String uploaderName = uploader != null ? (uploader.getFullName() != null ? uploader.getFullName() : uploader.getEmail()) : "Thành viên";
                    String wsName = ws != null ? ws.getName() : "Workspace";
                    String docTitle = document.getTitle() != null && !document.getTitle().isBlank() ? document.getTitle() : document.getFileName();

                    java.util.List<com.lumiedu.workspace.entity.WorkspaceMember> members = workspaceMemberRepository.findByWorkspaceIdAndStatus(request.getWorkspaceId(), com.lumiedu.workspace.enums.WorkspaceMemberStatus.ACCEPTED);
                    for (com.lumiedu.workspace.entity.WorkspaceMember m : members) {
                        if (m.getEmail() != null && !m.getEmail().isBlank() && (m.getUserId() == null || !m.getUserId().equals(request.getUserId()))) {
                            String targetEmail = m.getEmail().trim().toLowerCase();

                            // 1. In-app notification
                            try {
                                notificationService.createNotification(com.lumiedu.notification.dto.request.NotificationRequest.builder()
                                        .targetUserEmail(targetEmail)
                                        .title("Tài liệu mới trong nhóm / New Workspace Document")
                                        .message(uploaderName + " vừa tải lên/cập nhật tài liệu mới '" + docTitle + "' vào nhóm '" + wsName + "'.")
                                        .type("SHARED_FILE")
                                        .documentId(document.getId())
                                        .documentName(docTitle)
                                        .build());
                            } catch (Exception ne) {
                                log.warn("Failed to send in-app notification for new workspace doc: {}", ne.getMessage());
                            }

                            // 2. Email notification
                            try {
                                String emailSubject = "[LumiEdu] Tài liệu mới '" + docTitle + "' vừa được thêm vào nhóm '" + wsName + "'";
                                String htmlBody = "<div style='font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #1e293b;'>" +
                                        "<h2 style='color: #2563eb;'>Tài liệu mới trong nhóm học tập</h2>" +
                                        "<p>Chào bạn,</p>" +
                                        "<p>Thành viên <strong>" + uploaderName + "</strong> vừa tải lên/cập nhật tài liệu mới <strong>" + docTitle + "</strong> vào nhóm học tập <strong>" + wsName + "</strong>.</p>" +
                                        "<p>Bạn có thể truy cập Workspace nhóm trên LumiEdu để xem và cùng học tập ngay bây giờ.</p>" +
                                        "<hr style='border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;' />" +
                                        "<p style='font-size: 12px; color: #64748b;'>Đây là email tự động từ hệ thống LumiEdu StudyHub.</p>" +
                                        "</div>";
                                emailService.sendEmail(targetEmail, emailSubject, htmlBody, true);
                            } catch (Exception ee) {
                                log.warn("Failed to send email for new workspace doc to {}: {}", targetEmail, ee.getMessage());
                            }
                        }
                    }
                } catch (Exception wsNotifyEx) {
                    log.warn("Failed to process notifications for workspace document upload: {}", wsNotifyEx.getMessage());
                }
            }

            if (request.getTags() != null && !request.getTags().isEmpty()) {
                saveTagsForDocument(document, request.getTags());
            }

            // Tự động chunk & index cho tài liệu
            final Long docId = document.getId();
            triggerChunkingAfterCommit(docId);

            return mapToResponse(document);
        } else {
            // Media/Audio: lưu local như cũ
            String newFileName = UUID.randomUUID() + "." + extension;
            Path targetPath = resolveUploadPath(fileType).resolve(newFileName);
            try {
                Files.createDirectories(targetPath.getParent());
                Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException e) {
                throw new FileStorageException("Failed to store file: " + originalFileName, e);
            }
            savedFileName = newFileName;
            fileUrl = buildFileUrl(fileType, newFileName);

            Document document = Document.builder()
                    .title(request.getTitle())
                    .description(request.getDescription())
                    .subject(request.getSubject())
                    .visibility(request.getVisibility() != null ? request.getVisibility() : "PRIVATE")
                    .userId(request.getUserId())
                    .fileName(savedFileName)
                    .originalFileName(originalFileName)
                    .fileUrl(fileUrl)
                    .fileType(fileType)
                    .mimeType(file.getContentType())
                    .fileSize(file.getSize())
                    .storageProvider("LOCAL")
                    .deleted(false)
                    .moderationStatus(DocumentStatus.APPROVED)
                    .build();

            document = documentRepository.save(document);

            if (request.getTags() != null && !request.getTags().isEmpty()) {
                saveTagsForDocument(document, request.getTags());
            }

            return mapToResponse(document);
        }
    }

    @Override
    public DocumentResponse recordAudio(MultipartFile file, Long documentId) {
        validateFile(file);

        Document document = documentRepository.findByIdAndDeletedFalse(documentId)
                .orElseThrow(() -> new DocumentNotFoundException(documentId));

        String originalFileName = StringUtils.cleanPath(
                Objects.requireNonNull(file.getOriginalFilename(), "Original filename must not be null"));
        String extension = getExtension(originalFileName).toLowerCase();

        if (!ALLOWED_AUDIO_EXTENSIONS.contains(extension)) {
            throw new InvalidFileTypeException(extension, FILE_TYPE_AUDIO);
        }

        String newFileName = UUID.randomUUID() + "." + extension;
        Path targetPath = resolveUploadPath(FILE_TYPE_AUDIO).resolve(newFileName);

        try {
            Files.createDirectories(targetPath.getParent());
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new FileStorageException("Failed to store audio file: " + originalFileName, e);
        }

        String audioUrl = buildFileUrl(FILE_TYPE_AUDIO, newFileName);

        AudioRecord audioRecord = AudioRecord.builder()
                .document(document)
                .audioFileName(newFileName)
                .audioUrl(audioUrl)
                .mimeType(file.getContentType())
                .fileSize(file.getSize())
                .build();

        audioRecordRepository.save(audioRecord);

        return mapToResponse(document);
    }

    // -------------------------------------------------------------------------
    // CRUD
    // -------------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public List<DocumentResponse> getAllDocuments(Long userId) {
        if (userId == null) {
            return new ArrayList<>();
        }

        String userEmail = "";
        Optional<User> uOpt = userRepository.findById(userId);
        if (uOpt.isPresent()) {
            userEmail = uOpt.get().getEmail();
        }

        List<Document> ownedDocs = documentRepository.findAllByUserIdAndDeletedFalse(userId);

        List<DocumentShare> shares = (userEmail != null && !userEmail.isBlank())
                ? documentShareRepository.findByShareeEmail(userEmail.trim().toLowerCase())
                : new ArrayList<>();

        List<Long> sharedDocIds = shares.stream()
                .map(DocumentShare::getDocumentId)
                .collect(Collectors.toList());

        List<Document> sharedDocs = new ArrayList<>();
        if (!sharedDocIds.isEmpty()) {
            sharedDocs = documentRepository.findAllById(sharedDocIds).stream()
                    .filter(d -> d.getDeleted() != null && !d.getDeleted())
                    .collect(Collectors.toList());
        }

        Set<Long> seenIds = new HashSet<>();
        List<DocumentResponse> responseList = new ArrayList<>();

        for (Document d : ownedDocs) {
            if (isApprovedForUser(d) && seenIds.add(d.getId())) {
                DocumentResponse res = mapToResponse(d);
                res.setRole("owner");
                responseList.add(res);
            }
        }

        Map<Long, String> sharedRoleMap = shares.stream()
                .collect(Collectors.toMap(
                        DocumentShare::getDocumentId,
                        DocumentShare::getRole,
                        (r1, r2) -> r1));

        for (Document d : sharedDocs) {
            if (isApprovedForUser(d) && seenIds.add(d.getId())) {
                DocumentResponse res = mapToResponse(d);
                res.setRole(sharedRoleMap.getOrDefault(d.getId(), "viewer"));
                responseList.add(res);
            }
        }

        return responseList;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentResponse> getMyUploads(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID is required.");
        }
        return documentRepository.findAllByUserIdAndDeletedFalse(userId).stream()
                .filter(this::isApprovedForUser)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentResponse getDocumentById(Long id, Long currentUserId) {
        Document document = documentRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new DocumentNotFoundException(id));
        checkDocumentAccess(document, currentUserId);
        return mapToResponse(document);
    }

    @Override
    public DocumentResponse updateDocument(Long id, DocumentUpdateRequest request, Long currentUserId) {
        Document document = documentRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new DocumentNotFoundException(id));
        if (currentUserId == null) {
            throw new SecurityException("Authentication is required to modify this document.");
        }
        boolean isAdmin = userRepository.findById(currentUserId)
                .map(u -> u.getRole() == com.lumiedu.user.enums.UserRole.ADMIN)
                .orElse(false);
        if (!isAdmin && !currentUserId.equals(document.getUserId())) {
            throw new SecurityException("You do not have permission to modify this document.");
        }

        if (request.getTitle() != null) {
            document.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            document.setDescription(request.getDescription());
        }
        if (request.getSubject() != null) {
            document.setSubject(request.getSubject());
        }
        if (request.getVisibility() != null) {
            document.setVisibility(request.getVisibility());
        }

        document = documentRepository.save(document);

        if (request.getTags() != null) {
            List<DocumentTag> existingTags = documentTagRepository.findAllByDocumentId(id);
            documentTagRepository.deleteAll(existingTags);
            saveTagsForDocument(document, request.getTags());
        }

        return mapToResponse(document);
    }

    @Override
    public void deleteDocument(Long id, Long currentUserId) {
        Document document = documentRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new DocumentNotFoundException(id));
        if (currentUserId == null) {
            throw new SecurityException("Authentication is required to delete this document.");
        }
        // Log deletion request info for audit
        log.info("User {} requesting deletion for document ID {} (Owner ID: {})", currentUserId, id, document.getUserId());

        // 1. Delete file from User's Personal Google Drive (LumiEdu StudyHub folder)
        if (document.getUserGoogleDriveFileId() != null && !document.getUserGoogleDriveFileId().startsWith("gdrive_")) {
            try {
                googleDriveService.deleteFile(document.getUserGoogleDriveFileId(), document.getUserId());
                log.info("Deleted document ID {} from Personal Google Drive (LumiEdu StudyHub) ID {}", id, document.getUserGoogleDriveFileId());
            } catch (Exception e) {
                log.error("Failed to delete file from Personal Google Drive (LumiEdu StudyHub) for doc ID {}: {}", id, e.getMessage());
            }
        }

        // 2. Delete file from Workspace Group Folder on Google Drive (Nhóm folder) & revoke shares
        if (document.getGoogleDriveFileId() != null && !document.getGoogleDriveFileId().startsWith("gdrive_")) {
            try {
                googleDriveService.deleteFile(document.getGoogleDriveFileId(), document.getUserId());
                log.info("Deleted document ID {} from Workspace Group Google Drive ID {}", id, document.getGoogleDriveFileId());
            } catch (Exception e) {
                log.warn("Failed to delete file from Workspace Group Google Drive for doc ID {}: {}", id, e.getMessage());
            }

            try {
                List<com.lumiedu.workspace.entity.WorkspaceDocument> wDocs = workspaceDocumentRepository.findByDocumentId(id);
                for (com.lumiedu.workspace.entity.WorkspaceDocument wd : wDocs) {
                    List<com.lumiedu.workspace.entity.WorkspaceMember> members = workspaceMemberRepository.findByWorkspaceIdAndStatus(wd.getWorkspaceId(), com.lumiedu.workspace.enums.WorkspaceMemberStatus.ACCEPTED);
                    for (com.lumiedu.workspace.entity.WorkspaceMember m : members) {
                        if (m.getEmail() != null && !m.getEmail().isBlank()) {
                            try {
                                googleDriveService.revokeShare(document.getGoogleDriveFileId(), m.getEmail().trim().toLowerCase(), document.getUserId());
                            } catch (Exception e) {
                                log.warn("Failed to revoke share for doc {} and member {}: {}", id, m.getEmail(), e.getMessage());
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to cleanup workspace shares on doc delete: {}", e.getMessage());
            }
        }

        document.setDeleted(true);
        documentRepository.save(document);
    }

    // -------------------------------------------------------------------------
    // Download / Preview
    // -------------------------------------------------------------------------

    @Override
    public Resource downloadDocument(Long id, Long currentUserId) {
        Document document = documentRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new DocumentNotFoundException(id));
        checkDocumentAccess(document, currentUserId);

        // Enforce block download for viewers in shared workspaces
        if (currentUserId != null && !currentUserId.equals(document.getUserId())) {
            List<com.lumiedu.workspace.entity.WorkspaceDocument> workspaceDocs = workspaceDocumentRepository
                    .findByDocumentId(id);
            for (com.lumiedu.workspace.entity.WorkspaceDocument wd : workspaceDocs) {
                com.lumiedu.workspace.entity.SharedWorkspace workspace = sharedWorkspaceRepository
                        .findById(wd.getWorkspaceId()).orElse(null);
                if (workspace != null && Boolean.TRUE.equals(workspace.getBlockDownloadForViewers())) {
                    Optional<com.lumiedu.workspace.entity.WorkspaceMember> memberOpt = workspaceMemberRepository
                            .findByWorkspaceIdAndUserId(workspace.getId(), currentUserId);
                    if (memberOpt.isPresent() && memberOpt.get()
                            .getStatus() == com.lumiedu.workspace.enums.WorkspaceMemberStatus.ACCEPTED) {
                        if (memberOpt.get().getRole() == com.lumiedu.workspace.enums.WorkspaceMemberRole.VIEWER) {
                            throw new SecurityException(
                                    "Downloading and printing documents is blocked for viewers in this workspace.");
                        }
                    }
                }
            }
        }

        Resource resource = null;
        if (("GOOGLE_DRIVE".equals(document.getStorageProvider()) || "GOOGLE_DRIVE_STAGING".equals(document.getStorageProvider()))
                && document.getGoogleDriveFileId() != null) {
            try {
                resource = googleDriveService.downloadFile(document.getGoogleDriveFileId(), document.getUserId());
            } catch (Exception e) {
                log.warn("Google Drive download failed for file ID {}: {}. Falling back to local file backup.", document.getGoogleDriveFileId(), e.getMessage());
                resource = null;
            }
        }
        if (resource == null) {
            resource = loadFileAsResource(document.getFileType(), document.getFileName());
        }

        // Record download history
        DocumentDownload download = DocumentDownload.builder()
                .document(document)
                .userId(currentUserId)
                .build();
        documentDownloadRepository.save(download);

        return resource;
    }

    @Override
    @Transactional(readOnly = true)
    public Resource previewDocument(Long id, Long currentUserId) {
        Document document = documentRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new DocumentNotFoundException(id));
        checkDocumentAccess(document, currentUserId);

        // Always return the actual binary resource for PDF/image file preview so that the viewer/iframe works correctly
        if (("GOOGLE_DRIVE".equals(document.getStorageProvider()) || "GOOGLE_DRIVE_STAGING".equals(document.getStorageProvider()))
                && document.getGoogleDriveFileId() != null) {
            try {
                return googleDriveService.downloadFile(document.getGoogleDriveFileId(), document.getUserId());
            } catch (IOException e) {
                throw new FileStorageException(
                        "Failed to load preview from Google Drive ID: " + document.getGoogleDriveFileId(), e);
            }
        }
        return loadFileAsResource(document.getFileType(), document.getFileName());
    }

    private Resource loadFileAsResource(String fileType, String fileName) {
        try {
            Path filePath = resolveUploadPath(fileType).resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new FileStorageException("File not found or not readable: " + fileName);
            }
        } catch (MalformedURLException e) {
            throw new FileStorageException("Could not read file: " + fileName, e);
        }
    }

    // -------------------------------------------------------------------------
    // Search
    // -------------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public List<DocumentResponse> searchDocuments(String keyword,
            String subject,
            String fileType,
            String tag,
            Long userId) {
        List<Document> documents = documentRepository.searchDocuments(keyword, subject, fileType, userId);

        // Filter by tag in memory if tag param provided
        if (tag != null && !tag.isBlank()) {
            List<DocumentTag> tagMatches = documentTagRepository.findAllByName(tag);
            Set<Long> documentIdsWithTag = tagMatches.stream()
                    .map(dt -> dt.getDocument().getId())
                    .collect(Collectors.toSet());

            documents = documents.stream()
                    .filter(d -> documentIdsWithTag.contains(d.getId()))
                    .collect(Collectors.toList());
        }

        return documents.stream()
                .filter(this::isApprovedForUser)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // -------------------------------------------------------------------------
    // Tags
    // -------------------------------------------------------------------------

    @Override
    public void addTag(Long documentId, String tagName) {
        Document document = documentRepository.findByIdAndDeletedFalse(documentId)
                .orElseThrow(() -> new DocumentNotFoundException(documentId));

        boolean exists = documentTagRepository.findByDocumentIdAndName(documentId, tagName).isPresent();
        if (exists) {
            throw new IllegalArgumentException("Tag '" + tagName + "' already exists on this document.");
        }

        DocumentTag tag = DocumentTag.builder()
                .document(document)
                .name(tagName)
                .build();
        documentTagRepository.save(tag);
    }

    @Override
    public void removeTag(Long documentId, String tagName) {
        documentRepository.findByIdAndDeletedFalse(documentId)
                .orElseThrow(() -> new DocumentNotFoundException(documentId));

        documentTagRepository.deleteByDocumentIdAndName(documentId, tagName);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private boolean isApprovedForUser(Document document) {
        if (document == null) return false;
        return document.getModerationStatus() == null
                || document.getModerationStatus() == DocumentStatus.APPROVED;
    }


    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File must not be null or empty.");
        }
        if (file.getOriginalFilename() == null || file.getOriginalFilename().isBlank()) {
            throw new IllegalArgumentException("File must have a valid original filename.");
        }
    }

    private String calculateChecksum(MultipartFile file) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(file.getBytes());
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1)
                    hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            log.warn("Failed to calculate checksum: {}", e.getMessage());
            return UUID.randomUUID().toString().replace("-", "");
        }
    }

    private String getExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == filename.length() - 1) {
            throw new InvalidFileTypeException("File has no extension: " + filename);
        }
        return filename.substring(dotIndex + 1);
    }

    private Path resolveUploadPath(String fileType) {
        String subDir = switch (fileType) {
            case FILE_TYPE_DOCUMENT -> "documents";
            case FILE_TYPE_MEDIA -> "media";
            case FILE_TYPE_AUDIO -> "audio";
            default -> "others";
        };
        return Paths.get(uploadDir, subDir).toAbsolutePath().normalize();
    }

    private String buildFileUrl(String fileType, String fileName) {
        String subDir = switch (fileType) {
            case FILE_TYPE_DOCUMENT -> "documents";
            case FILE_TYPE_MEDIA -> "media";
            case FILE_TYPE_AUDIO -> "audio";
            default -> "others";
        };
        return "/uploads/" + subDir + "/" + fileName;
    }

    private void saveTagsForDocument(Document document, List<String> tagNames) {
        tagNames.stream()
                .filter(t -> t != null && !t.isBlank())
                .distinct()
                .forEach(tagName -> {
                    DocumentTag tag = DocumentTag.builder()
                            .document(document)
                            .name(tagName.trim())
                            .build();
                    documentTagRepository.save(tag);
                });
    }

    private DocumentResponse mapToResponse(Document document) {
        List<String> tags = documentTagRepository.findAllByDocumentId(document.getId())
                .stream()
                .map(DocumentTag::getName)
                .collect(Collectors.toList());

        String ownerName = "Unknown";
        String ownerEmail = "";
        if (document.getUserId() != null) {
            Optional<User> uploaderOpt = userRepository.findById(document.getUserId());
            if (uploaderOpt.isPresent()) {
                ownerName = uploaderOpt.get().getFullName();
                ownerEmail = uploaderOpt.get().getEmail();
            }
        }

        return DocumentResponse.builder()
                .id(document.getId())
                .title(document.getTitle())
                .description(document.getDescription())
                .fileName(document.getFileName())
                .originalFileName(document.getOriginalFileName())
                .fileUrl(document.getFileUrl())
                .googleDriveFileId(document.getGoogleDriveFileId())
                .storageProvider(document.getStorageProvider())
                .fileType(document.getFileType())
                .mimeType(document.getMimeType())
                .fileSize(document.getFileSize())
                .subject(document.getSubject())
                .visibility(document.getVisibility())
                .userId(document.getUserId())
                .ownerName(ownerName)
                .ownerEmail(ownerEmail)
                .status(document.getStatus() != null ? document.getStatus() : "PENDING")
                .moderationStatus(document.getModerationStatus() != null ? document.getModerationStatus().name() : "APPROVED")
                .tags(tags)
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .rejectionReason(document.getRejectionReason())
                .reviewedAt(document.getReviewedAt())
                .build();
    }

    private java.util.List<String> getGoogleDriveHierarchy(String subject, Long userId) {
        java.util.List<String> hierarchy = new java.util.ArrayList<>();

        // 1. Get user folder name to isolate user workspaces
        String userFolder = "User_" + userId;
        if (userId != null) {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                userFolder = userOpt.get().getEmail();
            }
        }
        hierarchy.add(userFolder);

        if (subject == null || subject.isBlank() || "GENERAL".equalsIgnoreCase(subject)) {
            hierarchy.add("General");
            return hierarchy;
        }

        String cleanSubject = subject.trim().toUpperCase();

        // 2. Lookup subject in DB (either custom or system-wide)
        // Find subject by code and userId first, then fall back to system defaults
        Optional<Subject> subjectOpt = subjectRepository.findByCodeAndUserId(cleanSubject, userId);
        if (subjectOpt.isEmpty()) {
            subjectOpt = subjectRepository.findByCodeAndUserIdIsNull(cleanSubject);
        }

        if (subjectOpt.isPresent()) {
            Subject s = subjectOpt.get();
            hierarchy.add(s.getSemesterName());
            hierarchy.add(s.getCode() + " - " + s.getName());
        } else {
            hierarchy.add("Khác");
            hierarchy.add(cleanSubject);
        }

        return hierarchy;
    }

    private java.util.List<String> getGoogleDriveHierarchyForUserDrive(String subject, Long userId) {
        java.util.List<String> hierarchy = new java.util.ArrayList<>();
        hierarchy.add("LumiEdu StudyHub");

        if (subject == null || subject.isBlank() || "GENERAL".equalsIgnoreCase(subject)) {
            hierarchy.add("Chung");
            return hierarchy;
        }

        String cleanSubject = subject.trim().toUpperCase();
        Optional<Subject> subjectOpt = subjectRepository.findByCodeAndUserId(cleanSubject, userId);
        if (subjectOpt.isEmpty()) {
            subjectOpt = subjectRepository.findByCodeAndUserIdIsNull(cleanSubject);
        }
        if (subjectOpt.isEmpty()) {
            java.util.List<Subject> matches = subjectRepository.findByCodeContainingIgnoreCase(cleanSubject);
            if (!matches.isEmpty()) {
                subjectOpt = Optional.of(matches.get(0));
            }
        }

        if (subjectOpt.isPresent()) {
            Subject s = subjectOpt.get();
            String sem = (s.getSemesterName() != null && !s.getSemesterName().isBlank()) ? s.getSemesterName() : "Chung";
            hierarchy.add(sem);
            hierarchy.add(s.getCode() + " - " + s.getName());
        } else {
            hierarchy.add("Chung");
            hierarchy.add(cleanSubject);
        }

        return hierarchy;
    }

    private void checkDocumentAccess(Document document, Long userId) {
        if ("PUBLIC".equalsIgnoreCase(document.getVisibility())) {
            return;
        }
        if (userId == null) {
            throw new SecurityException("Authentication is required to access this document.");
        }
        boolean isAdmin = userRepository.findById(userId)
                .map(u -> u.getRole() == com.lumiedu.user.enums.UserRole.ADMIN)
                .orElse(false);
        if (isAdmin) {
            return;
        }
        if (userId.equals(document.getUserId())) {
            return;
        }
        List<com.lumiedu.workspace.entity.WorkspaceDocument> workspaceDocs = workspaceDocumentRepository.findByDocumentId(document.getId());
        for (com.lumiedu.workspace.entity.WorkspaceDocument wd : workspaceDocs) {
            Optional<com.lumiedu.workspace.entity.WorkspaceMember> memberOpt = workspaceMemberRepository
                    .findByWorkspaceIdAndUserId(wd.getWorkspaceId(), userId);
            if (memberOpt.isPresent()
                    && memberOpt.get().getStatus() == com.lumiedu.workspace.enums.WorkspaceMemberStatus.ACCEPTED) {
                return;
            }
        }
        throw new SecurityException("You do not have permission to access this document.");
    }

    @Override
    @Transactional(readOnly = true)
    public SubjectStatsResponse getSubjectStats(String subjectId, Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID is required.");
        }

        // 1. Calculate average score
        List<com.lumiedu.ai.entity.QuizAttempt> userAttempts = quizAttemptRepository.findAllByUserIdAndSubject(userId,
                subjectId);
        Double averageScore = null;
        if (!userAttempts.isEmpty()) {
            double totalScore = userAttempts.stream()
                    .mapToDouble(com.lumiedu.ai.entity.QuizAttempt::getScore)
                    .sum();
            // score is stored as percentage (0-100). We map to 0.0 - 10.0 scale.
            double averagePercentage = totalScore / userAttempts.size();
            averageScore = Math.round((averagePercentage * 10.0 / 100.0) * 10.0) / 10.0;
        }

        // 2. Calculate rank based on average scores of all users for this subject
        String rankStr = "Rank #--";
        if (averageScore != null) {
            List<com.lumiedu.ai.entity.QuizAttempt> allAttempts = quizAttemptRepository.findAllBySubject(subjectId);
            // Group attempts by user
            Map<Long, List<com.lumiedu.ai.entity.QuizAttempt>> attemptsByUser = allAttempts.stream()
                    .collect(Collectors.groupingBy(com.lumiedu.ai.entity.QuizAttempt::getUserId));

            // Calculate average score for each user
            Map<Long, Double> userAverages = new HashMap<>();
            for (Map.Entry<Long, List<com.lumiedu.ai.entity.QuizAttempt>> entry : attemptsByUser.entrySet()) {
                double total = entry.getValue().stream()
                        .mapToDouble(com.lumiedu.ai.entity.QuizAttempt::getScore)
                        .sum();
                userAverages.put(entry.getKey(), total / entry.getValue().size());
            }

            // Get current user's average percentage
            double currentUserAvg = userAverages.getOrDefault(userId, 0.0);

            // Sort all averages in descending order
            List<Double> sortedAverages = userAverages.values().stream()
                    .sorted(Comparator.reverseOrder())
                    .toList();

            // Find current user's rank
            int rank = sortedAverages.indexOf(currentUserAvg) + 1;
            int totalUsers = sortedAverages.size();

            if (totalUsers <= 1) {
                rankStr = "Rank #1";
            } else {
                double percentile = ((double) (rank - 1) / totalUsers) * 100.0;
                if (percentile <= 10.0) {
                    rankStr = String.format("Top %.0f%% of class", Math.max(1.0, percentile));
                    if ("Top 0% of class".equalsIgnoreCase(rankStr) || "Top 0%".equalsIgnoreCase(rankStr)) {
                        rankStr = "Top 5% of class";
                    }
                } else {
                    rankStr = String.format("Rank #%d", rank);
                }
            }
        }

        // 3. Calculate study progress
        int studyProgress = 0;
        List<com.lumiedu.ai.entity.StudyPlan> plans = studyPlanRepository
                .findByUserIdAndSubjectOrderByCreatedAtDesc(userId, subjectId);
        boolean progressCalculated = false;
        if (!plans.isEmpty()) {
            com.lumiedu.ai.entity.StudyPlan plan = plans.get(0);
            try {
                String curriculumJson = plan.getCurriculumJson();
                String completedJson = plan.getCompletedLessonsJson();
                if (curriculumJson != null && !curriculumJson.isBlank()) {
                    List<?> totalModules = null;
                    if (curriculumJson.trim().startsWith("[")) {
                        totalModules = objectMapper.readValue(curriculumJson, List.class);
                    } else if (curriculumJson.trim().startsWith("{")) {
                        java.util.Map<?, ?> map = objectMapper.readValue(curriculumJson, java.util.Map.class);
                        Object modulesObj = map.get("modules");
                        if (modulesObj instanceof List) {
                            totalModules = (List<?>) modulesObj;
                        }
                    }
                    if (totalModules != null) {
                        int totalCount = totalModules.size();
                        if (totalCount > 0) {
                            int completedCount = 0;
                            if (completedJson != null && !completedJson.isBlank()) {
                                List<?> completedLessons = objectMapper.readValue(completedJson, List.class);
                                completedCount = completedLessons.size();
                            }
                            studyProgress = Math.min(100, (completedCount * 100) / totalCount);
                            progressCalculated = true;
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to parse study plan progress: {}", e.getMessage());
            }
        }

        if (!progressCalculated) {
            List<Document> subjectDocs = documentRepository.searchDocuments(null, subjectId, null, userId);
            if (!subjectDocs.isEmpty()) {
                long attemptedCount = subjectDocs.stream()
                        .filter(d -> !quizAttemptRepository.findByDocumentId(d.getId()).isEmpty())
                        .count();
                studyProgress = (int) ((attemptedCount * 100) / subjectDocs.size());
            } else {
                studyProgress = 0;
            }
        }

        // 4. Determine AI recommendation advice
        String aiRec;
        if (averageScore == null) {
            aiRec = getDefaultRecommendation(subjectId);
        } else if (averageScore < 5.0) {
            aiRec = "Kết quả luyện tập còn thấp (" + averageScore
                    + "/10). Hãy xem lại tài liệu môn học và thực hiện lại các Quiz để ôn tập kiến thức cơ bản.";
        } else if (averageScore < 8.0) {
            aiRec = "Tiến độ học tập khá tốt (" + averageScore
                    + "/10). Hãy tiếp tục làm thêm các bài Quiz của môn học và xem lại các câu trả lời sai để tối ưu điểm số.";
        } else {
            aiRec = "Tuyệt vời! Bạn đang dẫn đầu với điểm trung bình " + averageScore
                    + "/10. Hãy thử sức tạo các Quiz nâng cao hoặc giúp đỡ các bạn cùng lớp học tập.";
        }

        int totalQuizzes = userAttempts.size();

        return SubjectStatsResponse.builder()
                .studyProgress(studyProgress)
                .averageScore(averageScore)
                .rank(rankStr)
                .totalQuizzes(totalQuizzes)
                .aiRecommendation(aiRec)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentShareResponse> getDocumentShares(Long documentId, Long currentUserId) {
        Document document = documentRepository.findByIdAndDeletedFalse(documentId)
                .orElseThrow(() -> new DocumentNotFoundException(documentId));

        if (currentUserId == null) {
            throw new IllegalArgumentException("Authentication is required.");
        }
        boolean isAdmin = userRepository.findById(currentUserId)
                .map(u -> u.getRole() == com.lumiedu.user.enums.UserRole.ADMIN)
                .orElse(false);
        if (!isAdmin && !currentUserId.equals(document.getUserId())) {
            throw new IllegalArgumentException("Only the document owner can view its shares.");
        }

        List<DocumentShare> shares = documentShareRepository.findByDocumentId(documentId);
        return shares.stream()
                .map(this::mapToShareResponse)
                .collect(Collectors.toList());
    }

    @Override
    public DocumentShareResponse addOrUpdateDocumentShare(Long documentId, String email, String role,
            Long currentUserId) {
        Document document = documentRepository.findByIdAndDeletedFalse(documentId)
                .orElseThrow(() -> new DocumentNotFoundException(documentId));

        if (currentUserId == null) {
            throw new IllegalArgumentException("Authentication is required.");
        }
        boolean isAdmin = userRepository.findById(currentUserId)
                .map(u -> u.getRole() == com.lumiedu.user.enums.UserRole.ADMIN)
                .orElse(false);
        if (!isAdmin && !currentUserId.equals(document.getUserId())) {
            throw new IllegalArgumentException("Only the document owner can share it.");
        }

        User sharee = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Collaborator email must belong to an existing registered user."));

        if (sharee.getId().equals(document.getUserId())) {
            throw new IllegalArgumentException("You cannot share a document with yourself.");
        }

        Optional<DocumentShare> existingShareOpt = documentShareRepository.findByDocumentIdAndShareeEmail(documentId,
                sharee.getEmail());
        DocumentShare share;
        if (existingShareOpt.isPresent()) {
            share = existingShareOpt.get();
            share.setRole(role);
        } else {
            share = DocumentShare.builder()
                    .documentId(documentId)
                    .shareeEmail(sharee.getEmail())
                    .role(role)
                    .build();
        }
        share = documentShareRepository.save(share);

        // 1. Google Drive permission sharing (best-effort & auto-upload if needed)
        String gDriveFileId = document.getGoogleDriveFileId();
        if (gDriveFileId == null || gDriveFileId.startsWith("gdrive_") || !"GOOGLE_DRIVE".equalsIgnoreCase(document.getStorageProvider())) {
            try {
                java.nio.file.Path localFilePath = resolveUploadPath(document.getFileType()).resolve(document.getFileName()).toAbsolutePath().normalize();
                java.io.File localFile = localFilePath.toFile();
                if (!localFile.exists()) {
                    localFilePath = java.nio.file.Paths.get(uploadDir, "google_drive_staging", document.getFileName()).toAbsolutePath().normalize();
                    localFile = localFilePath.toFile();
                }
                if (localFile.exists()) {
                    byte[] fileData = java.nio.file.Files.readAllBytes(localFile.toPath());
                    String uploadedFileId = googleDriveService.uploadFile(fileData, document.getOriginalFileName(), document.getMimeType(), document.getUserId());
                    if (uploadedFileId != null && !uploadedFileId.startsWith("gdrive_")) {
                        document.setGoogleDriveFileId(uploadedFileId);
                        document.setStorageProvider("GOOGLE_DRIVE");
                        documentRepository.save(document);
                        gDriveFileId = uploadedFileId;
                        log.info("Auto-uploaded document ID {} to Google Drive on share: new gDriveFileId = {}", documentId, uploadedFileId);
                    }
                }
            } catch (Exception ex) {
                log.warn("Failed to auto-upload document ID {} to Google Drive on share: {}", documentId, ex.getMessage());
            }
        }

        if (gDriveFileId != null && !gDriveFileId.startsWith("gdrive_")) {
            String gDriveRole = "reader";
            if ("editor".equalsIgnoreCase(role) || "writer".equalsIgnoreCase(role)) {
                gDriveRole = "writer";
            }
            try {
                googleDriveService.shareFile(gDriveFileId, sharee.getEmail(), gDriveRole, document.getUserId());
                log.info("Successfully shared Google Drive file {} with email {}", gDriveFileId, sharee.getEmail());
            } catch (Exception e) {
                log.warn("Google Drive permission sharing skipped/failed for document {} and collaborator {}: {}",
                        documentId, sharee.getEmail(), e.getMessage());
            }
        }

        // 2. Send notification if it's a new share
        if (existingShareOpt.isEmpty()) {
            try {
                User owner = userRepository.findById(document.getUserId()).orElse(null);
                String ownerNameOrEmail = (owner != null)
                        ? (owner.getFullName() != null && !owner.getFullName().isBlank() ? owner.getFullName()
                                : owner.getEmail())
                        : "An owner";

                String title = String.format("%s đã chia sẻ tài liệu", ownerNameOrEmail);
                String message = String.format("đã chia sẻ tài liệu \"%s\" với bạn.", document.getTitle());

                com.lumiedu.notification.dto.request.NotificationRequest notificationRequest = com.lumiedu.notification.dto.request.NotificationRequest
                        .builder()
                        .targetUserEmail(sharee.getEmail())
                        .type("SHARED_FILE")
                        .title(title)
                        .message(message)
                        .documentId(documentId)
                        .documentName(document.getTitle())
                        .actionType("shared-files")
                        .actionText("Xem tài liệu")
                        .actionUrl("/dashboard/shared")
                        .build();

                notificationService.createNotification(notificationRequest);
                log.info("Created share notification for user: {} on document: {}", sharee.getEmail(),
                        document.getTitle());
            } catch (Exception e) {
                log.error("Failed to create share notification: {}", e.getMessage());
            }
        }

        return mapToShareResponse(share);
    }

    @Override
    public void deleteDocumentShare(Long documentId, String email, Long currentUserId) {
        Document document = documentRepository.findByIdAndDeletedFalse(documentId)
                .orElseThrow(() -> new DocumentNotFoundException(documentId));

        if (currentUserId == null) {
            throw new IllegalArgumentException("Authentication is required.");
        }
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + currentUserId));

        boolean isAdmin = currentUser.getRole() == com.lumiedu.user.enums.UserRole.ADMIN;
        boolean isOwner = currentUserId.equals(document.getUserId());

        String targetEmail = (email != null && !email.trim().isEmpty()) ? email.trim().toLowerCase() : currentUser.getEmail().trim().toLowerCase();
        boolean isSelfSharee = targetEmail.equalsIgnoreCase(currentUser.getEmail().trim().toLowerCase());

        if (!isAdmin && !isOwner && !isSelfSharee) {
            throw new IllegalArgumentException("Only the document owner or recipient can remove share access.");
        }

        List<DocumentShare> sharesToDelete = new ArrayList<>();
        Optional<DocumentShare> shareOpt = documentShareRepository.findByDocumentIdAndShareeEmail(documentId, targetEmail);
        if (shareOpt.isPresent()) {
            sharesToDelete.add(shareOpt.get());
        } else if (isOwner) {
            // If owner requests remove access without specific sharee email, purge all 1-on-1 shares for this doc
            sharesToDelete = documentShareRepository.findByDocumentId(documentId);
        }

        if (!sharesToDelete.isEmpty()) {
            for (DocumentShare share : sharesToDelete) {
                documentShareRepository.delete(share);
                if ("GOOGLE_DRIVE".equalsIgnoreCase(document.getStorageProvider()) && document.getGoogleDriveFileId() != null) {
                    try {
                        googleDriveService.revokeShare(document.getGoogleDriveFileId(), share.getShareeEmail(), document.getUserId());
                    } catch (Exception e) {
                        log.warn("Google Drive revoke share skipped/failed for document {} and collaborator {}: {}",
                                documentId, share.getShareeEmail(), e.getMessage());
                    }
                }
            }
        }
    }

    private DocumentShareResponse mapToShareResponse(DocumentShare share) {
        return DocumentShareResponse.builder()
                .id(share.getId())
                .documentId(share.getDocumentId())
                .shareeEmail(share.getShareeEmail())
                .role(share.getRole())
                .createdAt(share.getCreatedAt())
                .updatedAt(share.getUpdatedAt())
                .build();
    }

    private String getDefaultRecommendation(String subject) {
        if (subject == null)
            return "Hãy ôn tập tài liệu học tập thường xuyên và sử dụng tính năng tạo Quiz tự động bằng AI để củng cố kiến thức tốt nhất.";
        String cleanSubject = subject.trim().toUpperCase();
        return switch (cleanSubject) {
            case "PRF192", "PRO192" ->
                "Tập trung ôn tập các khái niệm lập trình cơ bản, cú pháp Java/C, cấu trúc điều khiển và thực hành viết code trên giấy.";
            case "CSD201" ->
                "Ôn tập kỹ các cấu trúc dữ liệu cơ bản (Danh sách liên kết, Cây nhị phân) và các thuật toán sắp xếp để chuẩn bị tốt cho bài thi PE.";
            case "DBI202" ->
                "Luyện tập viết các câu truy vấn SQL phức tạp (JOIN, Subquery, Group By) và vẽ sơ đồ thực thể mối quan hệ ERD.";
            case "SWP391" ->
                "Đảm bảo tiến độ sprint của nhóm trên Jira. Xem lại tài liệu thiết kế hệ thống và tích hợp liên tục (CI/CD) cho sản phẩm.";
            case "PRN211", "PRN221" ->
                "Thực hành các ứng dụng WinForms, WPF hoặc ASP.NET Core MVC. Đảm bảo hiểu rõ lập trình hướng sự kiện và kết nối Entity Framework.";
            case "AIL302M", "DLN301" ->
                "Ôn tập toán tối ưu, đại số tuyến tính cho Machine Learning và thiết lập kiến trúc mạng Neural (CNN, RNN) trong PyTorch/TensorFlow.";
            case "MKT101" ->
                "Nghiên cứu mô hình 4P/7P và phân tích hành vi khách hàng. Chuẩn bị slide thuyết trình cho dự án nghiên cứu thị trường nhóm.";
            default ->
                "Hãy ôn tập tài liệu học tập thường xuyên và sử dụng tính năng tạo Quiz tự động bằng AI để củng cố kiến thức tốt nhất.";
        };
    }

    private void triggerChunkingAfterCommit(Long docId) {
        if (org.springframework.transaction.support.TransactionSynchronizationManager.isActualTransactionActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                new org.springframework.transaction.support.TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        documentChunkingService.chunkAndIndexDocument(docId);
                    }
                }
            );
        } else {
            documentChunkingService.chunkAndIndexDocument(docId);
        }
    }
}
