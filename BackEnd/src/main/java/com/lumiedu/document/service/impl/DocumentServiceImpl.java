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

        // STEP 1: Check duplicate FILE CONTENT (Checksum SHA-256) FIRST
        if (fileChecksum != null) {
            boolean checksumExistsInSubject = documentRepository.existsBySubjectIgnoreCaseAndChecksumAndDeletedFalse(subjectToUse, fileChecksum);
            boolean checksumExistsForUser = userId != null && documentRepository.existsByUserIdAndSubjectIgnoreCaseAndChecksumAndDeletedFalse(userId, subjectToUse, fileChecksum);

            if (checksumExistsInSubject || checksumExistsForUser) {
                throw new IllegalArgumentException("Nội dung tệp bị trùng: Tệp này đã được tải lên trước đó trong môn học [" + subjectToUse + "]! Vui lòng chọn tệp khác.");
            }
        }

        // STEP 2: Check duplicate TITLE SECOND
        if (request.getTitle() != null && !request.getTitle().trim().isEmpty()) {
            String trimmedTitle = request.getTitle().trim();
            boolean titleInSub = documentRepository.existsBySubjectIgnoreCaseAndTitleIgnoreCaseAndDeletedFalse(subjectToUse, trimmedTitle);
            boolean titleForUsr = userId != null && documentRepository.existsByUserIdAndSubjectIgnoreCaseAndTitleIgnoreCaseAndDeletedFalse(userId, subjectToUse, trimmedTitle);

            if (titleInSub || titleForUsr) {
                throw new IllegalArgumentException("Tiêu đề tài liệu bị trùng: Tiêu đề '" + trimmedTitle + "' đã tồn tại trong môn học [" + subjectToUse + "]. Vui lòng sửa tiêu đề khác!");
            }
        }

        // STEP 3: Check duplicate ORIGINAL FILE NAME THIRD
        boolean nameInSub = documentRepository.existsBySubjectIgnoreCaseAndOriginalFileNameIgnoreCaseAndDeletedFalse(subjectToUse, originalFileName);
        boolean nameForUsr = userId != null && documentRepository.existsByUserIdAndSubjectIgnoreCaseAndOriginalFileNameIgnoreCaseAndDeletedFalse(userId, subjectToUse, originalFileName);

        if (nameInSub || nameForUsr) {
            throw new IllegalArgumentException("Tên tệp gốc bị trùng: Tệp '" + originalFileName + "' đã tồn tại trong môn học [" + subjectToUse + "]. Vui lòng nhập Tiêu đề riêng để phân biệt!");
        }

        // Upload lên Google Drive
        // Upload lên Google Drive
        String googleDriveFileId = null;
        String fileUrl = null;
        String savedFileName = null;
        boolean uploadedToGDrive = false;
        String driveSyncStatus = "SYNCED";
        String driveSyncError = null;

        if (FILE_TYPE_DOCUMENT.equals(fileType)) {
            // Check if user is connected
            if (request.getUserId() != null && googleDriveService.isUserDriveConnected(request.getUserId())) {
                try {
                    java.util.List<String> folderHierarchy = getGoogleDriveHierarchy(request.getSubject(), request.getUserId());
                    googleDriveFileId = googleDriveService.uploadFile(file, folderHierarchy, request.getUserId());
                    if (googleDriveFileId != null && !googleDriveFileId.startsWith("gdrive_")) {
                        savedFileName = googleDriveFileId + "." + extension;
                        fileUrl = "https://drive.google.com/file/d/" + googleDriveFileId + "/view";
                        uploadedToGDrive = true;
                    } else {
                        log.warn("Google Drive upload returned a mock or null file ID: {}. Falling back to local storage.", googleDriveFileId);
                    }
                } catch (Exception e) {
                    log.error("Real Google Drive upload failed for userId={}: {}", request.getUserId(), e.getMessage(), e);
                    driveSyncStatus = "FAILED";
                    driveSyncError = e.getMessage();
                }
            } else {
                log.info("User {} has not connected Google Drive. Storing file locally.", request.getUserId());
            }

            if (!uploadedToGDrive) {
                // Keep storage provider as LOCAL and store the file locally
                String newFileName = UUID.randomUUID() + "." + extension;
                Path targetPath = resolveUploadPath(FILE_TYPE_DOCUMENT).resolve(newFileName);
                try {
                    Files.createDirectories(targetPath.getParent());
                    Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
                } catch (IOException e) {
                    throw new FileStorageException("Failed to store file locally: " + originalFileName, e);
                }
                savedFileName = newFileName;
                fileUrl = buildFileUrl(FILE_TYPE_DOCUMENT, newFileName);
                googleDriveFileId = null;
                if (!"FAILED".equals(driveSyncStatus)) {
                    driveSyncStatus = null;
                }
            }
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

        document = documentRepository.save(document);

        if (request.getTags() != null && !request.getTags().isEmpty()) {
            saveTagsForDocument(document, request.getTags());
        }

        // Tự động chunk & index cho tài liệu
        if (FILE_TYPE_DOCUMENT.equals(fileType)) {
            final Long docId = document.getId();
            triggerChunkingAfterCommit(docId);
        }

        return mapToResponse(document);
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
        String userEmail = "";
        if (userId != null) {
            Optional<User> uOpt = userRepository.findById(userId);
            if (uOpt.isPresent()) {
                userEmail = uOpt.get().getEmail();
            }
        }

        List<Document> ownedDocs = (userId != null)
                ? documentRepository.findAllByUserIdAndDeletedFalse(userId)
                : documentRepository.findAllByDeletedFalse();

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
        boolean isAdmin = userRepository.findById(currentUserId)
                .map(u -> u.getRole() == com.lumiedu.user.enums.UserRole.ADMIN)
                .orElse(false);
        if (!isAdmin && !currentUserId.equals(document.getUserId())) {
            throw new SecurityException("You do not have permission to delete this document.");
        }

        // Delete from Google Drive if stored there
        if ("GOOGLE_DRIVE".equalsIgnoreCase(String.valueOf(document.getStorageProvider()))
                || "GOOGLE_DRIVE_STAGING".equalsIgnoreCase(String.valueOf(document.getStorageProvider()))) {
            try {
                googleDriveService.deleteFile(document.getGoogleDriveFileId(), document.getUserId());
            } catch (Exception e) {
                log.error("Failed to delete file from Google Drive for doc ID {}: {}", id, e.getMessage());
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

        Resource resource;
        if (("GOOGLE_DRIVE".equals(document.getStorageProvider()) || "GOOGLE_DRIVE_STAGING".equals(document.getStorageProvider()))
                && document.getGoogleDriveFileId() != null) {
            try {
                resource = googleDriveService.downloadFile(document.getGoogleDriveFileId(), document.getUserId());
            } catch (IOException e) {
                throw new FileStorageException(
                        "Failed to download file from Google Drive ID: " + document.getGoogleDriveFileId(), e);
            }
        } else {
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

    private Long getCurrentUserId() {
        org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            Object details = auth.getDetails();
            if (details instanceof Long) {
                return (Long) details;
            }
        }
        return null;
    }

    private boolean isApprovedDocument(Document document) {
    return document != null
            && document.getModerationStatus() == DocumentStatus.APPROVED;
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

        // 1. Google Drive permission sharing (best-effort)
        if ("GOOGLE_DRIVE".equalsIgnoreCase(document.getStorageProvider()) && document.getGoogleDriveFileId() != null) {
            String gDriveRole = "reader";
            if ("editor".equalsIgnoreCase(role) || "writer".equalsIgnoreCase(role)) {
                gDriveRole = "writer";
            }
            try {
                googleDriveService.shareFile(document.getGoogleDriveFileId(), sharee.getEmail(), gDriveRole, document.getUserId());
            } catch (IOException e) {
                log.warn("Google Drive permission sharing skipped/failed for document {} and collaborator {}: {}",
                        documentId, sharee.getEmail(), e.getMessage());
            } catch (Exception e) {
                log.error("Failed to share file on Google Drive for document {} and collaborator {}: {}",
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
        boolean isAdmin = userRepository.findById(currentUserId)
                .map(u -> u.getRole() == com.lumiedu.user.enums.UserRole.ADMIN)
                .orElse(false);
        if (!isAdmin && !currentUserId.equals(document.getUserId())) {
            throw new IllegalArgumentException("Only the document owner can delete its shares.");
        }

        Optional<DocumentShare> existingShareOpt = documentShareRepository.findByDocumentIdAndShareeEmail(documentId,
                email.trim().toLowerCase());
        if (existingShareOpt.isPresent()) {
            documentShareRepository.delete(existingShareOpt.get());

            if ("GOOGLE_DRIVE".equalsIgnoreCase(document.getStorageProvider()) && document.getGoogleDriveFileId() != null) {
                try {
                    googleDriveService.revokeShare(document.getGoogleDriveFileId(), email.trim().toLowerCase(), document.getUserId());
                } catch (IOException e) {
                    log.warn("Google Drive revoke share skipped/failed for document {} and collaborator {}: {}",
                            documentId, email, e.getMessage());
                } catch (Exception e) {
                    log.error("Failed to revoke file share on Google Drive for document {} and collaborator {}: {}",
                            documentId, email, e.getMessage());
                }
            }
        } else {
            throw new IllegalArgumentException("No share permission found for the given email.");
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
