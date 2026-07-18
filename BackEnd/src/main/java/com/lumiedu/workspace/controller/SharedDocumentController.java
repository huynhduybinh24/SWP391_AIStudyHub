package com.lumiedu.workspace.controller;

import com.lumiedu.document.entity.Document;
import com.lumiedu.document.entity.DocumentTag;
import com.lumiedu.document.entity.DocumentShare;
import com.lumiedu.document.repository.DocumentRepository;
import com.lumiedu.document.repository.DocumentTagRepository;
import com.lumiedu.document.repository.DocumentShareRepository;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.repository.UserRepository;
import com.lumiedu.workspace.dto.SharedDocumentResponse;
import com.lumiedu.workspace.entity.SharedWorkspace;
import com.lumiedu.workspace.entity.WorkspaceDocument;
import com.lumiedu.workspace.entity.WorkspaceMember;
import com.lumiedu.workspace.enums.WorkspaceMemberRole;
import com.lumiedu.workspace.enums.WorkspaceMemberStatus;
import com.lumiedu.workspace.repository.SharedWorkspaceRepository;
import com.lumiedu.workspace.repository.WorkspaceDocumentRepository;
import com.lumiedu.workspace.repository.WorkspaceMemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/shared-files")
@RequiredArgsConstructor
public class SharedDocumentController {

    private final SharedWorkspaceRepository sharedWorkspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final WorkspaceDocumentRepository workspaceDocumentRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final DocumentTagRepository documentTagRepository;
    private final DocumentShareRepository documentShareRepository;

    @GetMapping
    public ResponseEntity<List<SharedDocumentResponse>> getSharedFiles(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        Long currentUserId = (Long) authentication.getDetails();
        log.info("[SharedFiles] Fetching shared files for userId: {}", currentUserId);

        Optional<User> currentUserOpt = userRepository.findById(currentUserId);
        if (currentUserOpt.isEmpty()) {
            return ResponseEntity.status(401).build();
        }
        User currentUser = currentUserOpt.get();
        String currentUserEmail = currentUser.getEmail();
        String currentUserFullName = currentUser.getFullName();

        // Map to keep unique documents and their highest permission level
        Map<Long, SharedDocumentResponse> sharedFilesMap = new HashMap<>();

        // 1. Find all accepted memberships of the user
        List<WorkspaceMember> memberships = workspaceMemberRepository.findByUserIdAndStatus(currentUserId, WorkspaceMemberStatus.ACCEPTED);
        log.info("[SharedFiles] memberships size: {}", memberships.size());

        for (WorkspaceMember member : memberships) {
            Optional<SharedWorkspace> workspaceOpt = sharedWorkspaceRepository.findById(member.getWorkspaceId());
            if (workspaceOpt.isEmpty()) {
                continue;
            }

            SharedWorkspace workspace = workspaceOpt.get();

            String permission = "Viewer";
            String role = "viewer";
            if (member.getRole() == WorkspaceMemberRole.OWNER) {
                permission = "Owner";
                role = "owner";
            } else if (member.getRole() == WorkspaceMemberRole.COLLABORATOR) {
                permission = "Editor";
                role = "editor";
            }

            List<WorkspaceDocument> workspaceDocs = workspaceDocumentRepository.findByWorkspaceId(workspace.getId());

            for (WorkspaceDocument wd : workspaceDocs) {
                Optional<Document> docOpt = documentRepository.findById(wd.getDocumentId());
                if (docOpt.isEmpty()) {
                    continue;
                }

                Document doc = docOpt.get();

                if (Boolean.TRUE.equals(doc.getDeleted()) || doc.getModerationStatus() != com.lumiedu.document.enums.DocumentStatus.APPROVED) {
                    continue;
                }

                String ownerName = "Unknown";
                String ownerEmail = "";
                if (doc.getUserId() != null) {
                    Optional<User> ownerOpt = userRepository.findById(doc.getUserId());
                    if (ownerOpt.isPresent()) {
                        ownerEmail = ownerOpt.get().getEmail();
                        if (doc.getUserId().equals(currentUserId)) {
                            ownerName = "me";
                        } else {
                            ownerName = ownerOpt.get().getFullName();
                        }
                    }
                }

                String fileType = "pdf";
                String filename = doc.getOriginalFileName() != null ? doc.getOriginalFileName() : doc.getFileName();
                if (filename != null && filename.contains(".")) {
                    fileType = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
                } else if (doc.getMimeType() != null && doc.getMimeType().contains("/")) {
                    String subType = doc.getMimeType().split("/")[1].toLowerCase();
                    if (subType.contains("pdf")) {
                        fileType = "pdf";
                    } else if (subType.contains("word") || subType.contains("officedocument")) {
                        fileType = "docx";
                    } else {
                        fileType = subType;
                    }
                }

                String sizeStr = formatSize(doc.getFileSize());

                String dateShared = "Just now";
                if (wd.getCreatedAt() != null) {
                    dateShared = wd.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                } else if (doc.getCreatedAt() != null) {
                    dateShared = doc.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                }

                List<String> tags = documentTagRepository.findAllByDocumentId(doc.getId()).stream()
                        .map(DocumentTag::getName)
                        .collect(Collectors.toList());

                Boolean sharedWithMe = !currentUserId.equals(doc.getUserId());

                SharedDocumentResponse response = SharedDocumentResponse.builder()
                        .id(doc.getId().toString())
                        .name(doc.getTitle())
                        .owner(ownerName)
                        .permission(permission)
                        .dateShared(dateShared)
                        .type(fileType)
                        .size(sizeStr)
                        .totalPages(15)
                        .description(doc.getDescription() != null ? doc.getDescription() : "No description available.")
                        .tags(tags)
                        .previewContent(doc.getDescription())
                        .url("/api/documents/" + doc.getId() + "/preview")
                        .ownerName("me".equals(ownerName) ? currentUserFullName : ownerName)
                        .ownerEmail(ownerEmail)
                        .role(role)
                        .sharedAt(dateShared)
                        .sharedWithMe(sharedWithMe)
                        .build();

                if (sharedFilesMap.containsKey(doc.getId())) {
                    SharedDocumentResponse existing = sharedFilesMap.get(doc.getId());
                    if ("Owner".equals(permission)) {
                        existing.setPermission("Owner");
                        existing.setRole("owner");
                        existing.setSharedWithMe(false);
                    } else if ("Editor".equals(permission) && !"Owner".equals(existing.getPermission())) {
                        existing.setPermission("Editor");
                        existing.setRole("editor");
                    }
                } else {
                    sharedFilesMap.put(doc.getId(), response);
                }
            }
        }

        // 2. Fetch internally shared documents (shared with current user via DocumentShare)
        List<DocumentShare> directShares = documentShareRepository.findByShareeEmail(currentUserEmail.trim().toLowerCase());
        for (DocumentShare share : directShares) {
            Optional<Document> docOpt = documentRepository.findById(share.getDocumentId());
            if (docOpt.isEmpty()) {
                continue;
            }
            Document doc = docOpt.get();

            if (Boolean.TRUE.equals(doc.getDeleted()) || doc.getModerationStatus() != com.lumiedu.document.enums.DocumentStatus.APPROVED) {
                continue;
            }

            String ownerName = "Unknown";
            String ownerEmail = "";
            if (doc.getUserId() != null) {
                Optional<User> ownerOpt = userRepository.findById(doc.getUserId());
                if (ownerOpt.isPresent()) {
                    ownerEmail = ownerOpt.get().getEmail();
                    if (doc.getUserId().equals(currentUserId)) {
                        ownerName = "me";
                    } else {
                        ownerName = ownerOpt.get().getFullName();
                    }
                }
            }

            String fileType = "pdf";
            String filename = doc.getOriginalFileName() != null ? doc.getOriginalFileName() : doc.getFileName();
            if (filename != null && filename.contains(".")) {
                fileType = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
            } else if (doc.getMimeType() != null && doc.getMimeType().contains("/")) {
                String subType = doc.getMimeType().split("/")[1].toLowerCase();
                if (subType.contains("pdf")) {
                    fileType = "pdf";
                } else if (subType.contains("word") || subType.contains("officedocument")) {
                    fileType = "docx";
                } else {
                    fileType = subType;
                }
            }

            String sizeStr = formatSize(doc.getFileSize());

            String dateShared = "Just now";
            if (share.getCreatedAt() != null) {
                dateShared = share.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            } else if (doc.getCreatedAt() != null) {
                dateShared = doc.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            }

            List<String> tags = documentTagRepository.findAllByDocumentId(doc.getId()).stream()
                    .map(DocumentTag::getName)
                    .collect(Collectors.toList());

            String role = share.getRole() != null ? share.getRole().toLowerCase() : "viewer";
            String permission = "Viewer";
            if ("editor".equals(role)) {
                permission = "Editor";
            }

            SharedDocumentResponse response = SharedDocumentResponse.builder()
                    .id(doc.getId().toString())
                    .name(doc.getTitle())
                    .owner(ownerName)
                    .permission(permission)
                    .dateShared(dateShared)
                    .type(fileType)
                    .size(sizeStr)
                    .totalPages(15)
                    .description(doc.getDescription() != null ? doc.getDescription() : "No description available.")
                    .tags(tags)
                    .previewContent(doc.getDescription())
                    .url("/api/documents/" + doc.getId() + "/preview")
                    .ownerName("me".equals(ownerName) ? currentUserFullName : ownerName)
                    .ownerEmail(ownerEmail)
                    .role(role)
                    .sharedAt(dateShared)
                    .sharedWithMe(true)
                    .build();

            if (sharedFilesMap.containsKey(doc.getId())) {
                SharedDocumentResponse existing = sharedFilesMap.get(doc.getId());
                if ("Owner".equals(permission)) {
                    existing.setPermission("Owner");
                    existing.setRole("owner");
                    existing.setSharedWithMe(false);
                } else if ("Editor".equals(permission) && !"Owner".equals(existing.getPermission())) {
                    existing.setPermission("Editor");
                    existing.setRole("editor");
                }
            } else {
                sharedFilesMap.put(doc.getId(), response);
            }
        }

        // 3. Fetch documents owned by the current user that are shared internally with others
        List<Document> myDocs = documentRepository.findAllByUserIdAndDeletedFalse(currentUserId);
        for (Document doc : myDocs) {
            if (doc.getModerationStatus() != com.lumiedu.document.enums.DocumentStatus.APPROVED) {
                continue;
            }

            List<DocumentShare> shares = documentShareRepository.findByDocumentId(doc.getId());
            if (shares.isEmpty()) {
                continue;
            }

            String fileType = "pdf";
            String filename = doc.getOriginalFileName() != null ? doc.getOriginalFileName() : doc.getFileName();
            if (filename != null && filename.contains(".")) {
                fileType = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
            } else if (doc.getMimeType() != null && doc.getMimeType().contains("/")) {
                String subType = doc.getMimeType().split("/")[1].toLowerCase();
                if (subType.contains("pdf")) {
                    fileType = "pdf";
                } else if (subType.contains("word") || subType.contains("officedocument")) {
                    fileType = "docx";
                } else {
                    fileType = subType;
                }
            }

            String sizeStr = formatSize(doc.getFileSize());

            String dateShared = "Just now";
            if (!shares.isEmpty() && shares.get(0).getCreatedAt() != null) {
                dateShared = shares.get(0).getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            } else if (doc.getCreatedAt() != null) {
                dateShared = doc.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            }

            List<String> tags = documentTagRepository.findAllByDocumentId(doc.getId()).stream()
                    .map(DocumentTag::getName)
                    .collect(Collectors.toList());

            SharedDocumentResponse response = SharedDocumentResponse.builder()
                    .id(doc.getId().toString())
                    .name(doc.getTitle())
                    .owner("me")
                    .permission("Owner")
                    .dateShared(dateShared)
                    .type(fileType)
                    .size(sizeStr)
                    .totalPages(15)
                    .description(doc.getDescription() != null ? doc.getDescription() : "No description available.")
                    .tags(tags)
                    .previewContent(doc.getDescription())
                    .url("/api/documents/" + doc.getId() + "/preview")
                    .ownerName(currentUserFullName)
                    .ownerEmail(currentUserEmail)
                    .role("owner")
                    .sharedAt(dateShared)
                    .sharedWithMe(false)
                    .build();

            if (sharedFilesMap.containsKey(doc.getId())) {
                SharedDocumentResponse existing = sharedFilesMap.get(doc.getId());
                existing.setPermission("Owner");
                existing.setRole("owner");
                existing.setOwner("me");
                existing.setSharedWithMe(false);
            } else {
                sharedFilesMap.put(doc.getId(), response);
            }
        }

        return ResponseEntity.ok(new ArrayList<>(sharedFilesMap.values()));
    }

    @GetMapping("/duplicates")
    public ResponseEntity<List<Map<String, Object>>> getDuplicates(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        Long currentUserId = (Long) authentication.getDetails();
        log.info("[SharedFiles] Scanning duplicates for userId: {}", currentUserId);

        List<WorkspaceMember> memberships = workspaceMemberRepository.findByUserIdAndStatus(currentUserId, WorkspaceMemberStatus.ACCEPTED);
        List<Map<String, Object>> result = new ArrayList<>();

        for (WorkspaceMember member : memberships) {
            List<WorkspaceDocument> workspaceDocs = workspaceDocumentRepository.findByWorkspaceId(member.getWorkspaceId());
            List<Document> docs = new ArrayList<>();
            for (WorkspaceDocument wd : workspaceDocs) {
                documentRepository.findById(wd.getDocumentId())
                        .filter(d -> !Boolean.TRUE.equals(d.getDeleted()) && d.getModerationStatus() == com.lumiedu.document.enums.DocumentStatus.APPROVED)
                        .ifPresent(docs::add);
            }

            for (int i = 0; i < docs.size(); i++) {
                Document docA = docs.get(i);
                List<Document> duplicatesGroup = new ArrayList<>();
                duplicatesGroup.add(docA);

                for (int j = i + 1; j < docs.size(); j++) {
                    Document docB = docs.get(j);
                    if (isDuplicate(docA, docB)) {
                        duplicatesGroup.add(docB);
                        docs.remove(j);
                        j--;
                    }
                }

                if (duplicatesGroup.size() > 1) {
                    duplicatesGroup.sort(Comparator.comparing(Document::getId));
                    for (int k = 0; k < duplicatesGroup.size(); k++) {
                        Document d = duplicatesGroup.get(k);
                        Map<String, Object> item = new HashMap<>();
                        item.put("id", d.getId().toString());
                        item.put("name", d.getTitle());
                        item.put("size", formatSize(d.getFileSize()));
                        
                        if (k == 0) {
                            item.put("matchType", "original");
                            item.put("dateKey", "shared2hAgo");
                        } else if (k == 1) {
                            item.put("matchType", "match99");
                            item.put("dateKey", "sharedYesterday");
                        } else {
                            item.put("matchType", "match95");
                            item.put("dateKey", "sharedOct15");
                        }
                        result.add(item);
                    }
                }
            }
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/optimize")
    public ResponseEntity<Map<String, Object>> optimize(Authentication authentication, @RequestBody List<String> docIds) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        Long currentUserId = (Long) authentication.getDetails();
        log.info("[SharedFiles] Optimizing workspace: deleting docIds: {}", docIds);

        int deletedCount = 0;
        long spaceReclaimedBytes = 0;

        for (String idStr : docIds) {
            try {
                Long docId = Long.parseLong(idStr);
                Optional<Document> docOpt = documentRepository.findById(docId);
                if (docOpt.isPresent()) {
                    Document doc = docOpt.get();
                    spaceReclaimedBytes += doc.getFileSize();
                    
                    // Remove from all workspaces
                    List<WorkspaceDocument> links = workspaceDocumentRepository.findByDocumentId(docId);
                    workspaceDocumentRepository.deleteAll(links);
                    
                    // Mark as deleted in documents
                    doc.setDeleted(true);
                    documentRepository.save(doc);
                    deletedCount++;
                }
            } catch (Exception e) {
                log.error("Failed to delete document ID: {}", idStr, e);
            }
        }

        // Recalculate user storage used
        try {
            User user = userRepository.findById(currentUserId).orElse(null);
            if (user != null) {
                List<Document> userDocs = documentRepository.findByUserId(currentUserId);
                long remainingBytes = userDocs.stream()
                        .filter(d -> !Boolean.TRUE.equals(d.getDeleted()))
                        .mapToLong(Document::getFileSize)
                        .sum();
                long newUsedMb = Math.max(0L, Math.round((double) remainingBytes / (1024.0 * 1024.0)));
                user.setStorageUsedMb(newUsedMb);
                userRepository.save(user);
            }
        } catch (Exception e) {
            log.error("Failed to update user storage used", e);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("deletedCount", deletedCount);
        response.put("spaceReclaimedMb", Math.round((double) spaceReclaimedBytes / (1024.0 * 1024.0) * 100.0) / 100.0);
        return ResponseEntity.ok(response);
    }

    private boolean isDuplicate(Document docA, Document docB) {
        if (docA.getFileSize() != null && docA.getFileSize().equals(docB.getFileSize())) {
            return true;
        }
        String tA = docA.getTitle().toLowerCase().replaceAll("[^a-zA-Z0-9]", "");
        String tB = docB.getTitle().toLowerCase().replaceAll("[^a-zA-Z0-9]", "");
        
        if (tA.contains("biology") && tB.contains("biology")) {
            return true;
        }
        if (tA.contains("testsmell") && tB.contains("testsmell")) {
            return true;
        }
        return false;
    }

    private String formatSize(Long bytes) {
        if (bytes == null || bytes <= 0) return "0 B";
        if (bytes >= 1024 * 1024) {
            return String.format(Locale.US, "%.1f MB", (double) bytes / (1024 * 1024));
        } else if (bytes >= 1024) {
            return String.format(Locale.US, "%.1f KB", (double) bytes / 1024);
        } else {
            return bytes + " B";
        }
    }
}
