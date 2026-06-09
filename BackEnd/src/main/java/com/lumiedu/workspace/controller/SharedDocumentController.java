package com.lumiedu.workspace.controller;

import com.lumiedu.document.entity.Document;
import com.lumiedu.document.entity.DocumentTag;
import com.lumiedu.document.repository.DocumentRepository;
import com.lumiedu.document.repository.DocumentTagRepository;
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

    @GetMapping
    public ResponseEntity<List<SharedDocumentResponse>> getSharedFiles(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        Long currentUserId = (Long) authentication.getDetails();
        log.info("[SharedFiles] Fetching shared files for userId: {}", currentUserId);

        // 1. Find all accepted memberships of the user
        List<WorkspaceMember> memberships = workspaceMemberRepository.findByUserIdAndStatus(currentUserId, WorkspaceMemberStatus.ACCEPTED);
        log.info("[SharedFiles] memberships size: {}", memberships.size());
        for (WorkspaceMember m : memberships) {
            log.info("[SharedFiles] member: id={}, role={}, status={}, workspaceId={}", m.getId(), m.getRole(), m.getStatus(), m.getWorkspaceId());
        }

        // Map to keep unique documents and their highest permission level
        // (If the same document is in multiple workspaces, B gets the highest permission)
        Map<Long, SharedDocumentResponse> sharedFilesMap = new HashMap<>();

        for (WorkspaceMember member : memberships) {
            // Check if workspace exists
            Optional<SharedWorkspace> workspaceOpt = sharedWorkspaceRepository.findById(member.getWorkspaceId());
            if (workspaceOpt.isEmpty()) {
                continue;
            }

            SharedWorkspace workspace = workspaceOpt.get();

            // Filter out workspaces owned by the user (as they are personal/owned, not shared *with* them)
            if (workspace.getOwnerId().equals(currentUserId) || member.getRole() == WorkspaceMemberRole.OWNER) {
                continue;
            }

            // Determine permission string
            String permission = "Viewer";
            if (member.getRole() == WorkspaceMemberRole.COLLABORATOR) {
                permission = "Editor";
            }

            // Find all documents in this workspace
            List<WorkspaceDocument> workspaceDocs = workspaceDocumentRepository.findByWorkspaceId(workspace.getId());

            for (WorkspaceDocument wd : workspaceDocs) {
                Optional<Document> docOpt = documentRepository.findById(wd.getDocumentId());
                if (docOpt.isEmpty()) {
                    continue;
                }

                Document doc = docOpt.get();

                // Skip deleted documents or not approved documents (e.g. pending/rejected)
                if (Boolean.TRUE.equals(doc.getDeleted()) || doc.getModerationStatus() != com.lumiedu.document.enums.DocumentStatus.APPROVED) {
                    continue;
                }

                // Get owner of the document
                String ownerName = "Unknown";
                if (doc.getUserId() != null) {
                    Optional<User> ownerOpt = userRepository.findById(doc.getUserId());
                    if (ownerOpt.isPresent()) {
                        ownerName = ownerOpt.get().getFullName();
                    }
                }

                // Convert file type to FE expected standard
                String fileType = doc.getFileType() != null ? doc.getFileType().toLowerCase() : "pdf";

                // Format file size
                String sizeStr = formatSize(doc.getFileSize());

                // Format date shared (using creation of workspace document linkage or document creation date)
                String dateShared = "Just now";
                if (wd.getCreatedAt() != null) {
                    dateShared = wd.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                } else if (doc.getCreatedAt() != null) {
                    dateShared = doc.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                }

                // Retrieve tags
                List<String> tags = documentTagRepository.findAllByDocumentId(doc.getId()).stream()
                        .map(DocumentTag::getName)
                        .collect(Collectors.toList());

                // Build response object
                SharedDocumentResponse response = SharedDocumentResponse.builder()
                        .id(doc.getId().toString())
                        .name(doc.getTitle())
                        .owner(ownerName)
                        .permission(permission)
                        .dateShared(dateShared)
                        .type(fileType)
                        .size(sizeStr)
                        .totalPages(15) // mock total pages
                        .description(doc.getDescription() != null ? doc.getDescription() : "No description available.")
                        .tags(tags)
                        .previewContent(doc.getDescription())
                        .url("/api/documents/" + doc.getId() + "/preview")
                        .build();

                // Store or merge with existing if already added from another workspace (take higher permission)
                if (sharedFilesMap.containsKey(doc.getId())) {
                    SharedDocumentResponse existing = sharedFilesMap.get(doc.getId());
                    if ("Editor".equals(permission) && !"Editor".equals(existing.getPermission())) {
                        existing.setPermission("Editor");
                    }
                } else {
                    sharedFilesMap.put(doc.getId(), response);
                }
            }
        }

        return ResponseEntity.ok(new ArrayList<>(sharedFilesMap.values()));
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
