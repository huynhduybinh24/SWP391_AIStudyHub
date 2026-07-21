package com.lumiedu.workspace.service.impl;

import com.lumiedu.workspace.dto.WorkspaceRequests.*;
import com.lumiedu.workspace.dto.WorkspaceResponses.*;
import com.lumiedu.workspace.entity.SharedWorkspace;
import com.lumiedu.workspace.entity.WorkspaceMember;
import com.lumiedu.workspace.entity.WorkspaceDocument;
import com.lumiedu.workspace.entity.WorkspaceAiReport;
import com.lumiedu.workspace.enums.WorkspaceAccessType;
import com.lumiedu.workspace.enums.WorkspaceMemberRole;
import com.lumiedu.workspace.enums.WorkspaceMemberStatus;
import com.lumiedu.workspace.repository.SharedWorkspaceRepository;
import com.lumiedu.workspace.repository.WorkspaceMemberRepository;
import com.lumiedu.workspace.repository.WorkspaceDocumentRepository;
import com.lumiedu.workspace.repository.WorkspaceAiReportRepository;
import com.lumiedu.workspace.service.WorkspaceService;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.repository.UserRepository;
import com.lumiedu.document.entity.Document;
import com.lumiedu.document.repository.DocumentRepository;
import com.lumiedu.ai.entity.DocumentChunk;
import com.lumiedu.ai.repository.DocumentChunkRepository;
import com.lumiedu.ai.service.GeminiService;
import com.lumiedu.ai.service.OpenAiService.ChatMessageDto;
import com.lumiedu.ai.service.OpenAiService.OpenAiResponse;
import com.lumiedu.notification.service.NotificationService;
import com.lumiedu.notification.dto.request.NotificationRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class WorkspaceServiceImpl implements WorkspaceService {

    private final SharedWorkspaceRepository sharedWorkspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final WorkspaceDocumentRepository workspaceDocumentRepository;
    private final WorkspaceAiReportRepository workspaceAiReportRepository;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final GeminiService geminiService;
    private final NotificationService notificationService;

    @Override
    public WorkspaceResponse createWorkspace(CreateWorkspaceRequest request) {
        User owner = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + request.getUserId()));

        SharedWorkspace workspace = SharedWorkspace.builder()
                .name(request.getName())
                .description(request.getDescription())
                .ownerId(owner.getId())
                .accessType(request.getAccessType() != null ? request.getAccessType() : WorkspaceAccessType.PRIVATE)
                .blockDownloadForViewers(false)
                .build();

        SharedWorkspace savedWorkspace = sharedWorkspaceRepository.save(workspace);

        // Auto-add creator as OWNER
        WorkspaceMember ownerMember = WorkspaceMember.builder()
                .workspaceId(savedWorkspace.getId())
                .userId(owner.getId())
                .email(owner.getEmail())
                .role(WorkspaceMemberRole.OWNER)
                .status(WorkspaceMemberStatus.ACCEPTED)
                .build();
        workspaceMemberRepository.save(ownerMember);

        return getWorkspaceDetails(savedWorkspace);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkspaceResponse> getUserWorkspaces(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("User not found with ID: " + userId);
        }

        List<SharedWorkspace> workspaces = sharedWorkspaceRepository.findAllByMemberUserId(userId);
        return workspaces.stream()
                .map(this::getWorkspaceDetails)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public WorkspaceResponse getWorkspaceById(Long id, Long userId) {
        SharedWorkspace workspace = sharedWorkspaceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found with ID: " + id));

        // Enforce membership checks for PRIVATE workspaces
        if (workspace.getAccessType() == WorkspaceAccessType.PRIVATE) {
            checkMembership(id, userId);
        }

        return getWorkspaceDetails(workspace);
    }

    @Override
    public void inviteMember(Long workspaceId, InviteMemberRequest request) {
        SharedWorkspace workspace = sharedWorkspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found with ID: " + workspaceId));

        // Requester must be OWNER
        checkRole(workspaceId, request.getInviterId(), WorkspaceMemberRole.OWNER);

        String email = request.getEmail().trim().toLowerCase();
        Optional<WorkspaceMember> existingMemberOpt = workspaceMemberRepository.findByWorkspaceIdAndEmail(workspaceId, email);

        if (existingMemberOpt.isPresent()) {
            WorkspaceMember existing = existingMemberOpt.get();
            if (existing.getStatus() == WorkspaceMemberStatus.ACCEPTED) {
                throw new IllegalArgumentException("User is already a member of this workspace.");
            } else if (existing.getStatus() == WorkspaceMemberStatus.PENDING) {
                // Reinstate invite with potentially new role
                existing.setRole(request.getRole() != null ? request.getRole() : WorkspaceMemberRole.VIEWER);
                workspaceMemberRepository.save(existing);
                sendInviteNotification(workspace, email);
                return;
            } else {
                // Invite was rejected earlier, let's reopen it
                existing.setStatus(WorkspaceMemberStatus.PENDING);
                existing.setRole(request.getRole() != null ? request.getRole() : WorkspaceMemberRole.VIEWER);
                workspaceMemberRepository.save(existing);
                sendInviteNotification(workspace, email);
                return;
            }
        }

        // Search for user ID if registered
        Optional<User> targetUserOpt = userRepository.findByEmail(email);
        Long targetUserId = targetUserOpt.map(User::getId).orElse(null);

        WorkspaceMember member = WorkspaceMember.builder()
                .workspaceId(workspaceId)
                .userId(targetUserId)
                .email(email)
                .role(request.getRole() != null ? request.getRole() : WorkspaceMemberRole.VIEWER)
                .status(WorkspaceMemberStatus.PENDING)
                .build();

        workspaceMemberRepository.save(member);
        sendInviteNotification(workspace, email);
    }

    @Override
    public void respondToInvitation(Long workspaceId, Long userId, String action) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        WorkspaceMember member = workspaceMemberRepository.findByWorkspaceIdAndEmail(workspaceId, user.getEmail().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("No invitation found for workspace ID " + workspaceId + " and email " + user.getEmail()));

        if (member.getStatus() != WorkspaceMemberStatus.PENDING) {
            throw new IllegalArgumentException("Invitation has already been responded to.");
        }

        // Link user ID if not linked yet
        if (member.getUserId() == null) {
            member.setUserId(userId);
        }

        if ("ACCEPT".equalsIgnoreCase(action)) {
            member.setStatus(WorkspaceMemberStatus.ACCEPTED);
        } else if ("REJECT".equalsIgnoreCase(action)) {
            member.setStatus(WorkspaceMemberStatus.REJECTED);
        } else {
            throw new IllegalArgumentException("Invalid response action: " + action + ". Use ACCEPT or REJECT.");
        }

        workspaceMemberRepository.save(member);
    }

    @Override
    public void updateMemberRole(Long workspaceId, Long memberId, UpdateMemberRoleRequest request) {
        SharedWorkspace workspace = sharedWorkspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found with ID: " + workspaceId));

        Long editorId = request.getEditorId();
        boolean isOwner = editorId != null && workspace.getOwnerId().equals(editorId);
        if (!isOwner && editorId != null) {
            WorkspaceMember editorMember = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, editorId).orElse(null);
            if (editorMember == null || editorMember.getRole() != WorkspaceMemberRole.OWNER) {
                throw new SecurityException("Only the workspace owner can update member roles.");
            }
        }

        // Try lookup by workspaceId + userId first, then by workspace_member PK id
        WorkspaceMember member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, memberId)
                .filter(m -> m.getWorkspaceId().equals(workspaceId))
                .orElseGet(() -> workspaceMemberRepository.findById(memberId)
                        .filter(m -> m.getWorkspaceId().equals(workspaceId))
                        .orElseThrow(() -> new IllegalArgumentException("Workspace member record not found for ID/userId: " + memberId)));

        // Protect workspace owner's role from being modified
        if (workspace.getOwnerId().equals(member.getUserId()) && request.getRole() != WorkspaceMemberRole.OWNER) {
            throw new IllegalArgumentException("Cannot modify the role of the workspace owner.");
        }

        if (request.getRole() != null) {
            member.setRole(request.getRole());
            workspaceMemberRepository.saveAndFlush(member);
        }
    }

    @Override
    public void removeMember(Long workspaceId, Long memberId, Long requesterId) {
        WorkspaceMember member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, memberId)
                .orElseGet(() -> workspaceMemberRepository.findById(memberId)
                        .orElseThrow(() -> new IllegalArgumentException("Workspace member record not found with ID/userId: " + memberId)));

        if (!member.getWorkspaceId().equals(workspaceId)) {
            throw new IllegalArgumentException("Member record does not belong to this workspace.");
        }

        if (member.getRole() == WorkspaceMemberRole.OWNER) {
            throw new IllegalArgumentException("Cannot remove the owner from the workspace.");
        }

        // Requester must be OWNER or the member themselves (self-leaving)
        boolean isOwner = isUserInRole(workspaceId, requesterId, WorkspaceMemberRole.OWNER);
        boolean isSelf = requesterId.equals(member.getUserId());

        if (!isOwner && !isSelf) {
            throw new SecurityException("Only the workspace owner or the member themselves can perform this action.");
        }

        workspaceMemberRepository.delete(member);
    }

    @Override
    public WorkspaceResponse updateWorkspaceAccess(Long id, UpdateWorkspaceRequest request) {
        SharedWorkspace workspace = sharedWorkspaceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found with ID: " + id));

        // Requester must be OWNER
        checkRole(id, request.getEditorId(), WorkspaceMemberRole.OWNER);

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            workspace.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            workspace.setDescription(request.getDescription().trim());
        }
        if (request.getAccessType() != null) {
            workspace.setAccessType(request.getAccessType());
        }
        if (request.getBlockDownloadForViewers() != null) {
            workspace.setBlockDownloadForViewers(request.getBlockDownloadForViewers());
        }

        SharedWorkspace updated = sharedWorkspaceRepository.save(workspace);
        return getWorkspaceDetails(updated);
    }

    @Override
    public void shareDocumentToWorkspace(Long workspaceId, Long documentId, Long userId) {
        sharedWorkspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found with ID: " + workspaceId));

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with ID: " + documentId));

        // Requester must be COLLABORATOR or OWNER
        WorkspaceMember member = getActiveMember(workspaceId, userId);
        if (member.getRole() != WorkspaceMemberRole.OWNER && member.getRole() != WorkspaceMemberRole.COLLABORATOR) {
            throw new SecurityException("Only owners or collaborators can share documents to the workspace.");
        }

        boolean exists = workspaceDocumentRepository.existsByWorkspaceIdAndDocumentId(workspaceId, documentId);
        if (exists) {
            throw new IllegalArgumentException("Document is already shared in this workspace.");
        }

        WorkspaceDocument workspaceDocument = WorkspaceDocument.builder()
                .workspaceId(workspaceId)
                .documentId(documentId)
                .addedBy(userId)
                .build();

        workspaceDocumentRepository.save(workspaceDocument);
    }

    @Override
    public void removeDocumentFromWorkspace(Long workspaceId, Long documentId, Long userId) {
        sharedWorkspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found with ID: " + workspaceId));

        WorkspaceDocument wd = workspaceDocumentRepository.findByWorkspaceIdAndDocumentId(workspaceId, documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document is not shared in this workspace."));

        // Requester must be COLLABORATOR or OWNER
        WorkspaceMember member = getActiveMember(workspaceId, userId);
        if (member.getRole() != WorkspaceMemberRole.OWNER && member.getRole() != WorkspaceMemberRole.COLLABORATOR) {
            throw new SecurityException("Only owners or collaborators can remove documents from the workspace.");
        }

        workspaceDocumentRepository.delete(wd);
    }

    @Override
    public Document importDocumentToPersonal(Long workspaceId, Long documentId, Long userId) {
        // Enforce membership check
        checkMembership(workspaceId, userId);

        boolean shared = workspaceDocumentRepository.existsByWorkspaceIdAndDocumentId(workspaceId, documentId);
        if (!shared) {
            throw new IllegalArgumentException("Document is not shared in this workspace.");
        }

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with ID: " + documentId));

        // Clone the document into user's personal list
        Document clone = Document.builder()
                .title("Copy of " + document.getTitle())
                .description(document.getDescription())
                .fileName(document.getFileName())
                .originalFileName(document.getOriginalFileName())
                .fileUrl(document.getFileUrl())
                .fileType(document.getFileType())
                .mimeType(document.getMimeType())
                .fileSize(document.getFileSize())
                .subject(document.getSubject())
                .visibility("PRIVATE")
                .userId(userId)
                .deleted(false)
                .build();

        return documentRepository.save(clone);
    }

    @Override
    public WorkspaceAiReportResponse generateWorkspaceAiReport(Long workspaceId, Long userId) {
        SharedWorkspace workspace = sharedWorkspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found with ID: " + workspaceId));

        // Must be member to generate AI report
        checkMembership(workspaceId, userId);

        List<WorkspaceDocument> workspaceDocs = workspaceDocumentRepository.findByWorkspaceId(workspaceId);
        if (workspaceDocs.isEmpty()) {
            throw new IllegalArgumentException("Cannot generate report for an empty workspace. Please share some documents first.");
        }

        // Build context from document summaries and chunks
        StringBuilder contentBuilder = new StringBuilder();
        int docIndex = 1;
        for (WorkspaceDocument wd : workspaceDocs) {
            Document doc = documentRepository.findById(wd.getDocumentId()).orElse(null);
            if (doc != null && !Boolean.TRUE.equals(doc.getDeleted())
                    && (doc.getModerationStatus() == null || doc.getModerationStatus() == com.lumiedu.document.enums.DocumentStatus.APPROVED)) {
                contentBuilder.append("Document #").append(docIndex++).append(": ").append(doc.getTitle()).append("\n");
                if (doc.getSubject() != null) contentBuilder.append("Subject: ").append(doc.getSubject()).append("\n");
                if (doc.getDescription() != null) contentBuilder.append("Description: ").append(doc.getDescription()).append("\n");

                // Get first 3 chunks of content
                List<DocumentChunk> chunks = documentChunkRepository.findByDocumentId(doc.getId());
                if (!chunks.isEmpty()) {
                    contentBuilder.append("Key Content Excerpts:\n");
                    for (int i = 0; i < Math.min(chunks.size(), 3); i++) {
                        contentBuilder.append("- ").append(chunks.get(i).getContent()).append("\n");
                    }
                }
                contentBuilder.append("\n");
            }
        }

        // Build Gemini messages
        List<ChatMessageDto> messages = new ArrayList<>();
        messages.add(ChatMessageDto.builder()
                .role("system")
                .content("You are an advanced academic assistant named LumiEdu AI. "
                        + "Your task is to analyze multiple study documents shared in a collaborative workspace and generate a structured workspace learning report in markdown. "
                        + "You must respond with a JSON object containing exactly two fields: "
                        + "'reportText' (a comprehensive markdown review summarizing core themes, connecting concepts across files, outlining key takeaways, and suggesting next steps/questions) "
                        + "and 'summaryText' (a short, 3-sentence summary of the workspace content).")
                .build());

        messages.add(ChatMessageDto.builder()
                .role("user")
                .content("Workspace Name: " + workspace.getName() + "\n\nShared Documents Content:\n" + contentBuilder.toString())
                .build());

        // Call Gemini
        OpenAiResponse response = geminiService.chat(messages, true);

        String reportText = "";
        String summaryText = "";

        try {
            com.google.gson.JsonObject jsonObj = new com.google.gson.Gson().fromJson(response.getContent(), com.google.gson.JsonObject.class);
            reportText = jsonObj.get("reportText").getAsString();
            summaryText = jsonObj.get("summaryText").getAsString();
        } catch (Exception e) {
            log.error("Failed to parse workspace AI report JSON response: {}", e.getMessage());
            reportText = response.getContent();
            summaryText = "Bản tóm tắt tổng hợp kiến thức từ các tài liệu chia sẻ trong nhóm học tập " + workspace.getName() + ".";
        }

        WorkspaceAiReport report = WorkspaceAiReport.builder()
                .workspaceId(workspaceId)
                .reportText(reportText)
                .summaryText(summaryText)
                .generatedBy(userId)
                .build();

        WorkspaceAiReport saved = workspaceAiReportRepository.save(report);
        User generator = userRepository.findById(userId).orElse(null);
        String generatorName = generator != null ? generator.getFullName() : "User #" + userId;

        return WorkspaceAiReportResponse.fromEntity(saved, generatorName);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkspaceAiReportResponse> getWorkspaceAiReports(Long workspaceId, Long userId) {
        checkMembership(workspaceId, userId);

        List<WorkspaceAiReport> reports = workspaceAiReportRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);
        return reports.stream().map(r -> {
            User generator = userRepository.findById(r.getGeneratedBy()).orElse(null);
            String generatorName = generator != null ? generator.getFullName() : "User #" + r.getGeneratedBy();
            return WorkspaceAiReportResponse.fromEntity(r, generatorName);
        }).collect(Collectors.toList());
    }

    // --- Helpers ---

    private void sendInviteNotification(SharedWorkspace workspace, String email) {
        try {
            NotificationRequest notifRequest = NotificationRequest.builder()
                    .type("shared_file")
                    .title("Lời mời tham gia nhóm học tập")
                    .message("Bạn được mời tham gia không gian học tập nhóm '" + workspace.getName() + "'.")
                    .targetUserEmail(email)
                    .actionType("workspace_invite")
                    .actionText("Chấp nhận")
                    .actionUrl("/dashboard/workspaces/" + workspace.getId())
                    .build();
            notificationService.createNotification(notifRequest);
        } catch (Exception e) {
            log.warn("Failed to deliver workspace invite notification: {}", e.getMessage());
        }
    }

    private WorkspaceResponse getWorkspaceDetails(SharedWorkspace workspace) {
        User owner = userRepository.findById(workspace.getOwnerId()).orElse(null);
        String ownerName = owner != null ? owner.getFullName() : "Unknown";

        // Members
        List<WorkspaceMember> members = workspaceMemberRepository.findByWorkspaceId(workspace.getId());
        List<WorkspaceMemberResponse> memberResponses = members.stream().map(m -> {
            User u = m.getUserId() != null ? userRepository.findById(m.getUserId()).orElse(null) : null;
            String name = u != null ? u.getFullName() : "Invited User";
            return WorkspaceMemberResponse.fromEntity(m, name);
        }).collect(Collectors.toList());

        // Documents
        List<WorkspaceDocument> workspaceDocs = workspaceDocumentRepository.findByWorkspaceId(workspace.getId());
        List<WorkspaceDocumentResponse> docResponses = workspaceDocs.stream().map(wd -> {
            Document doc = documentRepository.findById(wd.getDocumentId()).orElse(null);
            User adder = userRepository.findById(wd.getAddedBy()).orElse(null);
            String adderName = adder != null ? adder.getFullName() : "Unknown";

            if (doc != null && (doc.getModerationStatus() == null
                    || doc.getModerationStatus() == com.lumiedu.document.enums.DocumentStatus.APPROVED)) {
                return WorkspaceDocumentResponse.builder()
                        .id(wd.getId())
                        .workspaceId(workspace.getId())
                        .documentId(doc.getId())
                        .title(doc.getTitle())
                        .fileName(doc.getFileName())
                        .originalFileName(doc.getOriginalFileName())
                        .fileUrl(doc.getFileUrl())
                        .fileType(doc.getFileType())
                        .mimeType(doc.getMimeType())
                        .fileSize(doc.getFileSize())
                        .addedBy(wd.getAddedBy())
                        .addedByName(adderName)
                        .createdAt(wd.getCreatedAt())
                        .build();
            }
            return null;
        }).filter(Objects::nonNull).collect(Collectors.toList());

        return WorkspaceResponse.fromEntity(workspace, ownerName, memberResponses, docResponses);
    }

    private void checkMembership(Long workspaceId, Long userId) {
        SharedWorkspace workspace = sharedWorkspaceRepository.findById(workspaceId).orElse(null);
        if (workspace == null) {
            throw new IllegalArgumentException("Workspace not found with ID: " + workspaceId);
        }

        if (workspace.getOwnerId().equals(userId)) {
            return; // Owner is always a member
        }

        WorkspaceMember member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new SecurityException("Access denied. You are not a member of this workspace."));

        if (member.getStatus() != WorkspaceMemberStatus.ACCEPTED) {
            throw new SecurityException("Access denied. Your membership is pending or has been rejected.");
        }
    }

    private WorkspaceMember getActiveMember(Long workspaceId, Long userId) {
        SharedWorkspace workspace = sharedWorkspaceRepository.findById(workspaceId).orElse(null);
        if (workspace == null) {
            throw new IllegalArgumentException("Workspace not found with ID: " + workspaceId);
        }

        if (workspace.getOwnerId().equals(userId)) {
            // Virtual owner member
            return WorkspaceMember.builder()
                    .workspaceId(workspaceId)
                    .userId(userId)
                    .role(WorkspaceMemberRole.OWNER)
                    .status(WorkspaceMemberStatus.ACCEPTED)
                    .build();
        }

        WorkspaceMember member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new SecurityException("Access denied. You are not a member of this workspace."));

        if (member.getStatus() != WorkspaceMemberStatus.ACCEPTED) {
            throw new SecurityException("Access denied. Your membership is pending or has been rejected.");
        }

        return member;
    }

    private void checkRole(Long workspaceId, Long userId, WorkspaceMemberRole requiredRole) {
        SharedWorkspace workspace = sharedWorkspaceRepository.findById(workspaceId).orElse(null);
        if (workspace == null) {
            throw new IllegalArgumentException("Workspace not found with ID: " + workspaceId);
        }

        if (requiredRole == WorkspaceMemberRole.OWNER) {
            if (workspace.getOwnerId().equals(userId)) {
                return;
            }
            throw new SecurityException("Access denied. Only the workspace owner can perform this action.");
        }

        WorkspaceMember member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new SecurityException("Access denied. You are not a member of this workspace."));

        if (member.getStatus() != WorkspaceMemberStatus.ACCEPTED) {
            throw new SecurityException("Access denied. Your membership status is not active.");
        }

        if (member.getRole() != requiredRole && member.getRole() != WorkspaceMemberRole.OWNER) {
            throw new SecurityException("Access denied. This action requires " + requiredRole + " permissions.");
        }
    }

    private boolean isUserInRole(Long workspaceId, Long userId, WorkspaceMemberRole role) {
        SharedWorkspace workspace = sharedWorkspaceRepository.findById(workspaceId).orElse(null);
        if (workspace == null) return false;

        if (role == WorkspaceMemberRole.OWNER) {
            return workspace.getOwnerId().equals(userId);
        }

        Optional<WorkspaceMember> memberOpt = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId);
        return memberOpt.isPresent() && memberOpt.get().getStatus() == WorkspaceMemberStatus.ACCEPTED && memberOpt.get().getRole() == role;
    }
}
