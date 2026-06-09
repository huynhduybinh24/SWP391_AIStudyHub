package com.lumiedu.document.service.impl;

import com.lumiedu.document.dto.request.DocumentCreateRequest;
import com.lumiedu.document.dto.request.DocumentUpdateRequest;
import com.lumiedu.document.dto.response.DocumentResponse;
import com.lumiedu.document.entity.AudioRecord;
import com.lumiedu.document.entity.Document;
import com.lumiedu.document.entity.DocumentDownload;
import com.lumiedu.document.entity.DocumentTag;
import com.lumiedu.document.exception.DocumentNotFoundException;
import com.lumiedu.document.exception.FileStorageException;
import com.lumiedu.document.exception.InvalidFileTypeException;
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
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
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
    private final DocumentTagRepository documentTagRepository;
    private final DocumentDownloadRepository documentDownloadRepository;
    private final AudioRecordRepository audioRecordRepository;
    private final GoogleDriveService googleDriveService;
    private final DocumentChunkingService documentChunkingService;

    private final com.lumiedu.workspace.repository.WorkspaceDocumentRepository workspaceDocumentRepository;
    private final com.lumiedu.workspace.repository.WorkspaceMemberRepository workspaceMemberRepository;
    private final com.lumiedu.workspace.repository.SharedWorkspaceRepository sharedWorkspaceRepository;

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
            // Tài liệu: lưu trên Google Drive thật, tự động tạo thư mục theo môn học
            try {
                String subjectFolder = (request.getSubject() != null && !request.getSubject().isBlank())
                        ? request.getSubject().trim()
                        : "Khác";
                googleDriveFileId = googleDriveService.uploadFile(file, subjectFolder);
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
        List<Document> documents = (userId != null)
                ? documentRepository.findAllByUserIdAndDeletedFalse(userId)
                : documentRepository.findAllByDeletedFalse();

        return documents.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentResponse getDocumentById(Long id) {
        Document document = documentRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new DocumentNotFoundException(id));
        return mapToResponse(document);
    }

    @Override
    public DocumentResponse updateDocument(Long id, DocumentUpdateRequest request) {
        Document document = documentRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new DocumentNotFoundException(id));

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
            // Replace all existing tags
            List<DocumentTag> existingTags = documentTagRepository.findAllByDocumentId(id);
            documentTagRepository.deleteAll(existingTags);
            saveTagsForDocument(document, request.getTags());
        }

        return mapToResponse(document);
    }

    @Override
    public void deleteDocument(Long id) {
        Document document = documentRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new DocumentNotFoundException(id));
        document.setDeleted(true);
        documentRepository.save(document);
    }

    // -------------------------------------------------------------------------
    // Download / Preview
    // -------------------------------------------------------------------------

    @Override
    public Resource downloadDocument(Long id, Long userId) {
        Document document = documentRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new DocumentNotFoundException(id));

        // Enforce block download for viewers in shared workspaces
        if (userId != null && !userId.equals(document.getUserId())) {
            List<com.lumiedu.workspace.entity.WorkspaceDocument> workspaceDocs = workspaceDocumentRepository.findByDocumentId(id);
            for (com.lumiedu.workspace.entity.WorkspaceDocument wd : workspaceDocs) {
                com.lumiedu.workspace.entity.SharedWorkspace workspace = sharedWorkspaceRepository.findById(wd.getWorkspaceId()).orElse(null);
                if (workspace != null && Boolean.TRUE.equals(workspace.getBlockDownloadForViewers())) {
                    Optional<com.lumiedu.workspace.entity.WorkspaceMember> memberOpt = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspace.getId(), userId);
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
                .userId(userId)
                .build();
        documentDownloadRepository.save(download);

        return resource;
    }

    @Override
    @Transactional(readOnly = true)
    public Resource previewDocument(Long id) {
        Document document = documentRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new DocumentNotFoundException(id));
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
                .tags(tags)
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .build();
    }
}
