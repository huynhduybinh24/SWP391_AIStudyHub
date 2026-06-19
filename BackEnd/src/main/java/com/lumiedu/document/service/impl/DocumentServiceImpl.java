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
import com.lumiedu.document.entity.DocumentShare;
import com.lumiedu.document.repository.DocumentShareRepository;
import com.lumiedu.document.repository.AudioRecordRepository;
import com.lumiedu.document.repository.DocumentDownloadRepository;
import com.lumiedu.document.repository.DocumentRepository;
import com.lumiedu.document.repository.DocumentTagRepository;
import com.lumiedu.document.service.DocumentService;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.repository.UserRepository;
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
    private final UserRepository userRepository;
    private final DocumentShareRepository documentShareRepository;

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

        String newFileName = UUID.randomUUID() + "." + extension;
        Path targetPath = resolveUploadPath(fileType).resolve(newFileName);

        try {
            Files.createDirectories(targetPath.getParent());
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new FileStorageException("Failed to store file: " + originalFileName, e);
        }

        String fileUrl = buildFileUrl(fileType, newFileName);

        Document document = Document.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .subject(request.getSubject())
                .visibility(request.getVisibility() != null ? request.getVisibility() : "PRIVATE")
                .userId(request.getUserId())
                .fileName(newFileName)
                .originalFileName(originalFileName)
                .fileUrl(fileUrl)
                .fileType(fileType)
                .mimeType(file.getContentType())
                .fileSize(file.getSize())
                .deleted(false)
                .build();

        document = documentRepository.save(document);

        if (request.getTags() != null && !request.getTags().isEmpty()) {
            saveTagsForDocument(document, request.getTags());
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

        Resource resource = loadFileAsResource(document.getFileType(), document.getFileName());

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
                .fileType(document.getFileType())
                .mimeType(document.getMimeType())
                .fileSize(document.getFileSize())
                .subject(document.getSubject())
                .visibility(document.getVisibility())
                .userId(document.getUserId())
                .ownerName(ownerName)
                .ownerEmail(ownerEmail)
                .tags(tags)
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentShare> getDocumentShares(Long documentId) {
        return documentShareRepository.findByDocumentId(documentId);
    }

    @Override
    public DocumentShare addOrUpdateDocumentShare(Long documentId, String email, String role) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Sharee email must not be null or empty");
        }
        String normalizedEmail = email.trim().toLowerCase();

        String normalizedRole = "viewer";
        if (role != null) {
            String roleLower = role.trim().toLowerCase();
            if ("editor".equals(roleLower) || "viewer".equals(roleLower)) {
                normalizedRole = roleLower;
            }
        }

        Optional<DocumentShare> existingOpt = documentShareRepository.findByDocumentIdAndShareeEmail(documentId, normalizedEmail);
        DocumentShare documentShare;
        if (existingOpt.isPresent()) {
            documentShare = existingOpt.get();
            documentShare.setRole(normalizedRole);
        } else {
            documentShare = DocumentShare.builder()
                    .documentId(documentId)
                    .shareeEmail(normalizedEmail)
                    .role(normalizedRole)
                    .build();
        }

        return documentShareRepository.save(documentShare);
    }

    @Override
    public void deleteDocumentShare(Long documentId, String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Sharee email must not be null or empty");
        }
        String normalizedEmail = email.trim().toLowerCase();
        documentShareRepository.findByDocumentIdAndShareeEmail(documentId, normalizedEmail)
                .ifPresent(share -> documentShareRepository.delete(share));
    }
}
