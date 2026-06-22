package com.lumiedu.document.service.impl;

import com.lumiedu.document.dto.request.DocumentCreateRequest;
import com.lumiedu.document.dto.request.DocumentUpdateRequest;
import com.lumiedu.document.dto.response.DocumentResponse;
import com.lumiedu.document.dto.response.SubjectStatsResponse;
import com.lumiedu.document.dto.response.DocumentShareResponse;
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
import com.lumiedu.user.entity.User;
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

import java.io.IOException;
import java.io.InputStream;
import java.io.File;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
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
            "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt"
    );

    private static final Set<String> ALLOWED_MEDIA_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "mp4", "mp3", "wav"
    );

    private static final Set<String> ALLOWED_AUDIO_EXTENSIONS = Set.of(
            "mp3", "wav", "webm", "m4a"
    );

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

    private final QuizAttemptRepository quizAttemptRepository;
    private final StudyPlanRepository studyPlanRepository;
    private final ObjectMapper objectMapper;

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

        String originalFileName = StringUtils.cleanPath(
                Objects.requireNonNull(file.getOriginalFilename(), "Original filename must not be null")
        );
        String extension = getExtension(originalFileName).toLowerCase();

        if (!allowedExtensions.contains(extension)) {
            throw new InvalidFileTypeException(extension, fileType);
        }

        // Upload lên Google Drive
        String googleDriveFileId = null;
        String fileUrl = null;
        String savedFileName = null;

        if (FILE_TYPE_DOCUMENT.equals(fileType)) {
            // Tài liệu: lưu trên Google Drive thật, tự động tạo thư mục theo Ngành -> Kỳ -> Môn học
            try {
                java.util.List<String> folderHierarchy = getGoogleDriveHierarchy(request.getSubject());
                googleDriveFileId = googleDriveService.uploadFile(file, folderHierarchy);
                savedFileName = googleDriveFileId + "." + extension;
                fileUrl = "https://drive.google.com/file/d/" + googleDriveFileId + "/view";
            } catch (IOException e) {
                throw new FileStorageException("Lỗi upload lên Google Drive: " + originalFileName, e);
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
                .storageProvider(googleDriveFileId != null ? "GOOGLE_DRIVE" : "LOCAL")
                .checksum(calculateChecksum(file))
                .deleted(false)
                .build();

        document = documentRepository.save(document);

        if (request.getTags() != null && !request.getTags().isEmpty()) {
            saveTagsForDocument(document, request.getTags());
        }

        // Tự động chunk & index cho tài liệu
        if (FILE_TYPE_DOCUMENT.equals(fileType)) {
            final Long docId = document.getId();
            documentChunkingService.chunkAndIndexDocument(docId);
        }

        return mapToResponse(document);
    }

    @Override
    public DocumentResponse recordAudio(MultipartFile file, Long documentId) {
        validateFile(file);

        Document document = documentRepository.findByIdAndDeletedFalse(documentId)
                .orElseThrow(() -> new DocumentNotFoundException(documentId));

        String originalFileName = StringUtils.cleanPath(
                Objects.requireNonNull(file.getOriginalFilename(), "Original filename must not be null")
        );
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
            if (seenIds.add(d.getId())) {
                DocumentResponse res = mapToResponse(d);
                res.setRole("owner");
                responseList.add(res);
            }
        }

        Map<Long, String> sharedRoleMap = shares.stream()
                .collect(Collectors.toMap(
                        DocumentShare::getDocumentId,
                        DocumentShare::getRole,
                        (r1, r2) -> r1
                ));

        for (Document d : sharedDocs) {
            if (seenIds.add(d.getId())) {
                DocumentResponse res = mapToResponse(d);
                res.setRole(sharedRoleMap.getOrDefault(d.getId(), "viewer"));
                responseList.add(res);
            }
        }

        return responseList;
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
        checkDocumentAccess(document, currentUserId);

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
        checkDocumentAccess(document, currentUserId);

        // Delete from Google Drive if stored there
        if ("GOOGLE_DRIVE".equalsIgnoreCase(String.valueOf(document.getStorageProvider()))) {
            try {
                googleDriveService.deleteFile(document.getGoogleDriveFileId());
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
            List<com.lumiedu.workspace.entity.WorkspaceDocument> workspaceDocs = workspaceDocumentRepository.findByDocumentId(id);
            for (com.lumiedu.workspace.entity.WorkspaceDocument wd : workspaceDocs) {
                com.lumiedu.workspace.entity.SharedWorkspace workspace = sharedWorkspaceRepository.findById(wd.getWorkspaceId()).orElse(null);
                if (workspace != null && Boolean.TRUE.equals(workspace.getBlockDownloadForViewers())) {
                    Optional<com.lumiedu.workspace.entity.WorkspaceMember> memberOpt = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspace.getId(), currentUserId);
                    if (memberOpt.isPresent() && memberOpt.get().getStatus() == com.lumiedu.workspace.enums.WorkspaceMemberStatus.ACCEPTED) {
                        if (memberOpt.get().getRole() == com.lumiedu.workspace.enums.WorkspaceMemberRole.VIEWER) {
                            throw new SecurityException("Downloading and printing documents is blocked for viewers in this workspace.");
                        }
                    }
                }
            }
        }

        Resource resource;
        if ("GOOGLE_DRIVE".equals(document.getStorageProvider()) && document.getGoogleDriveFileId() != null) {
            try {
                resource = googleDriveService.downloadFile(document.getGoogleDriveFileId());
            } catch (IOException e) {
                throw new FileStorageException("Failed to download file from Google Drive ID: " + document.getGoogleDriveFileId(), e);
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

        String filename = document.getOriginalFileName() != null ? document.getOriginalFileName() : document.getFileName();
        String ext = "";
        if (filename != null && filename.contains(".")) {
            ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        }

        if ("pdf".equals(ext)) {
            try {
                String extractedText = "";
                if ("GOOGLE_DRIVE".equals(document.getStorageProvider()) && document.getGoogleDriveFileId() != null) {
                    Resource driveRes = googleDriveService.downloadFile(document.getGoogleDriveFileId());
                    try (InputStream is = driveRes.getInputStream()) {
                        try (PDDocument pdDoc = PDDocument.load(is)) {
                            PDFTextStripper stripper = new PDFTextStripper();
                            extractedText = stripper.getText(pdDoc);
                        }
                    }
                } else {
                    Path filePath = resolveUploadPath(document.getFileType()).resolve(document.getFileName()).normalize();
                    File file = filePath.toFile();
                    if (file.exists()) {
                        try (PDDocument pdDoc = PDDocument.load(file)) {
                            PDFTextStripper stripper = new PDFTextStripper();
                            extractedText = stripper.getText(pdDoc);
                        }
                    }
                }

                if (extractedText != null && !extractedText.trim().isEmpty()) {
                    return new org.springframework.core.io.ByteArrayResource(extractedText.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                }
            } catch (Exception e) {
                System.err.println("Failed to extract preview text from PDF: " + e.getMessage());
            }
        }

        if ("GOOGLE_DRIVE".equals(document.getStorageProvider()) && document.getGoogleDriveFileId() != null) {
            try {
                return googleDriveService.downloadFile(document.getGoogleDriveFileId());
            } catch (IOException e) {
                throw new FileStorageException("Failed to load preview from Google Drive ID: " + document.getGoogleDriveFileId(), e);
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
                if (hex.length() == 1) hexString.append('0');
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
                .tags(tags)
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .build();
    }

    private java.util.List<String> getGoogleDriveHierarchy(String subject) {
        if (subject == null || subject.isBlank() || "GENERAL".equalsIgnoreCase(subject)) {
            return java.util.List.of("General");
        }

        String cleanSubject = subject.trim().toUpperCase();

        // Cấu trúc phân cấp: Ngành học -> Kỳ học -> Môn học
        String majorName = null;
        String semesterName = null;
        String subjectDisplayName = null;

        // Bản đồ môn học
        // K1
        if ("PRF192".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 1"; subjectDisplayName = "PRF192 - Programming Fundamentals"; }
        else if ("MAE101".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 1"; subjectDisplayName = "MAE101 - Mathematics for Engineering"; }
        else if ("CEA201".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 1"; subjectDisplayName = "CEA201 - Computer Organization"; }
        else if ("CSI104".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 1"; subjectDisplayName = "CSI104 - Introduction to Computer Science"; }
        else if ("MGT103".equals(cleanSubject)) { majorName = "Quản trị kinh doanh (BA)"; semesterName = "Học kỳ 1"; subjectDisplayName = "MGT103 - Introduction to Management"; }
        else if ("ECO111".equals(cleanSubject)) { majorName = "Quản trị kinh doanh (BA)"; semesterName = "Học kỳ 1"; subjectDisplayName = "ECO111 - Microeconomics"; }
        else if ("FMA101".equals(cleanSubject)) { majorName = "Quản trị kinh doanh (BA)"; semesterName = "Học kỳ 1"; subjectDisplayName = "FMA101 - Financial Mathematics"; }

        // K2
        else if ("PRO192".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 2"; subjectDisplayName = "PRO192 - Object-Oriented Programming"; }
        else if ("MAD101".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 2"; subjectDisplayName = "MAD101 - Discrete Mathematics"; }
        else if ("OSG202".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 2"; subjectDisplayName = "OSG202 - Operating Systems"; }
        else if ("SSG104".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 2"; subjectDisplayName = "SSG104 - Communication Skills"; }
        else if ("MKT101".equals(cleanSubject)) { majorName = "Quản trị kinh doanh (BA)"; semesterName = "Học kỳ 2"; subjectDisplayName = "MKT101 - Basic Marketing"; }
        else if ("ECO121".equals(cleanSubject)) { majorName = "Quản trị kinh doanh (BA)"; semesterName = "Học kỳ 2"; subjectDisplayName = "ECO121 - Macroeconomics"; }
        else if ("AMG111".equals(cleanSubject)) { majorName = "Quản trị kinh doanh (BA)"; semesterName = "Học kỳ 2"; subjectDisplayName = "AMG111 - Art Management"; }

        // K3
        else if ("CSD201".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 3"; subjectDisplayName = "CSD201 - Data Structures and Algorithms"; }
        else if ("DBI202".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 3"; subjectDisplayName = "DBI202 - Database Systems"; }
        else if ("LAB211".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 3"; subjectDisplayName = "LAB211 - OOP Java Lab"; }
        else if ("AIL302M".equals(cleanSubject)) { majorName = "Trí tuệ nhân tạo (AI)"; semesterName = "Học kỳ 3"; subjectDisplayName = "AIL302M - Machine Learning"; }
        else if ("ACC101".equals(cleanSubject)) { majorName = "Quản trị kinh doanh (BA)"; semesterName = "Học kỳ 3"; subjectDisplayName = "ACC101 - Principles of Accounting"; }
        else if ("FIN201".equals(cleanSubject)) { majorName = "Quản trị kinh doanh (BA)"; semesterName = "Học kỳ 3"; subjectDisplayName = "FIN201 - Corporate Finance"; }
        else if ("BUL201".equals(cleanSubject)) { majorName = "Quản trị kinh doanh (BA)"; semesterName = "Học kỳ 3"; subjectDisplayName = "BUL201 - Business Law"; }

        // K4
        else if ("PRN211".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 4"; subjectDisplayName = "PRN211 - Basic Cross-Platform Application (.NET)"; }
        else if ("SWE201".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 4"; subjectDisplayName = "SWE201 - Introduction to Software Engineering"; }
        else if ("JPD113".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 4"; subjectDisplayName = "JPD113 - Japanese Language 1"; }
        else if ("AIP301".equals(cleanSubject)) { majorName = "Trí tuệ nhân tạo (AI)"; semesterName = "Học kỳ 4"; subjectDisplayName = "AIP301 - Artificial Intelligence Project"; }
        else if ("MTH202".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 4"; subjectDisplayName = "MTH202 - Probability and Statistics"; }
        else if ("HRM201".equals(cleanSubject)) { majorName = "Quản trị kinh doanh (BA)"; semesterName = "Học kỳ 4"; subjectDisplayName = "HRM201 - Human Resource Management"; }
        else if ("OBH201".equals(cleanSubject)) { majorName = "Quản trị kinh doanh (BA)"; semesterName = "Học kỳ 4"; subjectDisplayName = "OBH201 - Organizational Behavior"; }
        else if ("MRF301".equals(cleanSubject)) { majorName = "Quản trị kinh doanh (BA)"; semesterName = "Học kỳ 4"; subjectDisplayName = "MRF301 - Marketing Research"; }

        // K5
        else if ("SWP391".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 5"; subjectDisplayName = "SWP391 - Software Development Project"; }
        else if ("SWD392".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 5"; subjectDisplayName = "SWD392 - Software Architecture and Design"; }
        else if ("SWT301".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 5"; subjectDisplayName = "SWT301 - Software Testing"; }
        else if ("DLN301".equals(cleanSubject)) { majorName = "Trí tuệ nhân tạo (AI)"; semesterName = "Học kỳ 5"; subjectDisplayName = "DLN301 - Deep Learning"; }
        else if ("BIS301".equals(cleanSubject)) { majorName = "Quản trị kinh doanh (BA)"; semesterName = "Học kỳ 5"; subjectDisplayName = "BIS301 - Business Information Systems"; }
        else if ("ENT301".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 5"; subjectDisplayName = "ENT301 - Entrepreneurship"; }
        else if ("POM201".equals(cleanSubject)) { majorName = "Quản trị kinh doanh (BA)"; semesterName = "Học kỳ 5"; subjectDisplayName = "POM201 - Production and Operations Management"; }

        // K6
        else if ("OJT202".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 6"; subjectDisplayName = "OJT202 - On-the-Job Training (OJT)"; }

        // K7
        else if ("PRM392".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 7"; subjectDisplayName = "PRM392 - Mobile Programming"; }
        else if ("PRN221".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 7"; subjectDisplayName = "PRN221 - Advanced Cross-Platform Application (.NET)"; }
        else if ("WDP301".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 7"; subjectDisplayName = "WDP301 - Web Development Project"; }
        else if ("NLP301".equals(cleanSubject)) { majorName = "Trí tuệ nhân tạo (AI)"; semesterName = "Học kỳ 7"; subjectDisplayName = "NLP301 - Natural Language Processing"; }
        else if ("CVP301".equals(cleanSubject)) { majorName = "Trí tuệ nhân tạo (AI)"; semesterName = "Học kỳ 7"; subjectDisplayName = "CVP301 - Computer Vision Project"; }
        else if ("IBM301".equals(cleanSubject)) { majorName = "Quản trị kinh doanh (BA)"; semesterName = "Học kỳ 7"; subjectDisplayName = "IBM301 - International Business Management"; }
        else if ("SCM301".equals(cleanSubject)) { majorName = "Quản trị kinh doanh (BA)"; semesterName = "Học kỳ 7"; subjectDisplayName = "SCM301 - Supply Chain Management"; }
        else if ("BRM301".equals(cleanSubject)) { majorName = "Quản trị kinh doanh (BA)"; semesterName = "Học kỳ 7"; subjectDisplayName = "BRM301 - Business Research Methods"; }

        // K8
        else if ("SEP490".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 8"; subjectDisplayName = "SEP490 - Capstone Project Preparation (SE)"; }
        else if ("CAP490".equals(cleanSubject)) { majorName = "Trí tuệ nhân tạo (AI)"; semesterName = "Học kỳ 8"; subjectDisplayName = "CAP490 - Capstone Project Preparation (AI)"; }
        else if ("BAP490".equals(cleanSubject)) { majorName = "Quản trị kinh doanh (BA)"; semesterName = "Học kỳ 8"; subjectDisplayName = "BAP490 - Capstone Project Preparation (BA)"; }
        else if ("EXE101".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 8"; subjectDisplayName = "EXE101 - Experiential Entrepreneurship 1"; }
        else if ("IAS301".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 8"; subjectDisplayName = "IAS301 - Information Assurance & Security"; }
        else if ("BDA301".equals(cleanSubject)) { majorName = "Trí tuệ nhân tạo (AI)"; semesterName = "Học kỳ 8"; subjectDisplayName = "BDA301 - Big Data Analytics"; }
        else if ("SMA301".equals(cleanSubject)) { majorName = "Quản trị kinh doanh (BA)"; semesterName = "Học kỳ 8"; subjectDisplayName = "SMA301 - Strategic Management"; }

        // K9
        else if ("SEP490_DEF".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 9"; subjectDisplayName = "SEP490_DEF - Capstone Project Graduation (SE)"; }
        else if ("CAP490_DEF".equals(cleanSubject)) { majorName = "Trí tuệ nhân tạo (AI)"; semesterName = "Học kỳ 9"; subjectDisplayName = "CAP490_DEF - Capstone Project Graduation (AI)"; }
        else if ("BAP490_DEF".equals(cleanSubject)) { majorName = "Quản trị kinh doanh (BA)"; semesterName = "Học kỳ 9"; subjectDisplayName = "BAP490_DEF - Capstone Project Graduation (BA)"; }
        else if ("EXE201".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 9"; subjectDisplayName = "EXE201 - Experiential Entrepreneurship 2"; }
        else if ("PMG201".equals(cleanSubject)) { majorName = "Kỹ thuật phần mềm (SE)"; semesterName = "Học kỳ 9"; subjectDisplayName = "PMG201 - Project Management"; }
        else if ("EBU301".equals(cleanSubject)) { majorName = "Quản trị kinh doanh (BA)"; semesterName = "Học kỳ 9"; subjectDisplayName = "EBU301 - E-Business"; }

        if (majorName == null) {
            return java.util.List.of("Khác", subject);
        }
        return java.util.List.of(majorName, semesterName, subjectDisplayName);
    }

    private void checkDocumentAccess(Document document, Long userId) {
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
        if ("PUBLIC".equalsIgnoreCase(document.getVisibility())) {
            return;
        }
        List<com.lumiedu.workspace.entity.WorkspaceDocument> workspaceDocs = workspaceDocumentRepository.findByDocumentId(document.getId());
        for (com.lumiedu.workspace.entity.WorkspaceDocument wd : workspaceDocs) {
            Optional<com.lumiedu.workspace.entity.WorkspaceMember> memberOpt = workspaceMemberRepository.findByWorkspaceIdAndUserId(wd.getWorkspaceId(), userId);
            if (memberOpt.isPresent() && memberOpt.get().getStatus() == com.lumiedu.workspace.enums.WorkspaceMemberStatus.ACCEPTED) {
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
        List<com.lumiedu.ai.entity.QuizAttempt> userAttempts = quizAttemptRepository.findAllByUserIdAndSubject(userId, subjectId);
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
        List<com.lumiedu.ai.entity.StudyPlan> plans = studyPlanRepository.findByUserIdAndSubjectOrderByCreatedAtDesc(userId, subjectId);
        boolean progressCalculated = false;
        if (!plans.isEmpty()) {
            com.lumiedu.ai.entity.StudyPlan plan = plans.get(0);
            try {
                String curriculumJson = plan.getCurriculumJson();
                String completedJson = plan.getCompletedLessonsJson();
                if (curriculumJson != null && !curriculumJson.isBlank()) {
                    List<?> totalLessons = objectMapper.readValue(curriculumJson, List.class);
                    int totalCount = totalLessons.size();
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
            aiRec = "Kết quả luyện tập còn thấp (" + averageScore + "/10). Hãy xem lại tài liệu môn học và thực hiện lại các Quiz để ôn tập kiến thức cơ bản.";
        } else if (averageScore < 8.0) {
            aiRec = "Tiến độ học tập khá tốt (" + averageScore + "/10). Hãy tiếp tục làm thêm các bài Quiz của môn học và xem lại các câu trả lời sai để tối ưu điểm số.";
        } else {
            aiRec = "Tuyệt vời! Bạn đang dẫn đầu với điểm trung bình " + averageScore + "/10. Hãy thử sức tạo các Quiz nâng cao hoặc giúp đỡ các bạn cùng lớp học tập.";
        }

        return SubjectStatsResponse.builder()
                .studyProgress(studyProgress)
                .averageScore(averageScore)
                .rank(rankStr)
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
    public DocumentShareResponse addOrUpdateDocumentShare(Long documentId, String email, String role, Long currentUserId) {
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
                .orElseThrow(() -> new IllegalArgumentException("Collaborator email must belong to an existing registered user."));

        if (sharee.getId().equals(document.getUserId())) {
            throw new IllegalArgumentException("You cannot share a document with yourself.");
        }

        Optional<DocumentShare> existingShareOpt = documentShareRepository.findByDocumentIdAndShareeEmail(documentId, sharee.getEmail());
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

        Optional<DocumentShare> existingShareOpt = documentShareRepository.findByDocumentIdAndShareeEmail(documentId, email.trim().toLowerCase());
        if (existingShareOpt.isPresent()) {
            documentShareRepository.delete(existingShareOpt.get());
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
        if (subject == null) return "Hãy ôn tập tài liệu học tập thường xuyên và sử dụng tính năng tạo Quiz tự động bằng AI để củng cố kiến thức tốt nhất.";
        String cleanSubject = subject.trim().toUpperCase();
        return switch (cleanSubject) {
            case "PRF192", "PRO192" -> "Tập trung ôn tập các khái niệm lập trình cơ bản, cú pháp Java/C, cấu trúc điều khiển và thực hành viết code trên giấy.";
            case "CSD201" -> "Ôn tập kỹ các cấu trúc dữ liệu cơ bản (Danh sách liên kết, Cây nhị phân) và các thuật toán sắp xếp để chuẩn bị tốt cho bài thi PE.";
            case "DBI202" -> "Luyện tập viết các câu truy vấn SQL phức tạp (JOIN, Subquery, Group By) và vẽ sơ đồ thực thể mối quan hệ ERD.";
            case "SWP391" -> "Đảm bảo tiến độ sprint của nhóm trên Jira. Xem lại tài liệu thiết kế hệ thống và tích hợp liên tục (CI/CD) cho sản phẩm.";
            case "PRN211", "PRN221" -> "Thực hành các ứng dụng WinForms, WPF hoặc ASP.NET Core MVC. Đảm bảo hiểu rõ lập trình hướng sự kiện và kết nối Entity Framework.";
            case "AIL302M", "DLN301" -> "Ôn tập toán tối ưu, đại số tuyến tính cho Machine Learning và thiết lập kiến trúc mạng Neural (CNN, RNN) trong PyTorch/TensorFlow.";
            case "MKT101" -> "Nghiên cứu mô hình 4P/7P và phân tích hành vi khách hàng. Chuẩn bị slide thuyết trình cho dự án nghiên cứu thị trường nhóm.";
            default -> "Hãy ôn tập tài liệu học tập thường xuyên và sử dụng tính năng tạo Quiz tự động bằng AI để củng cố kiến thức tốt nhất.";
        };
    }
}
