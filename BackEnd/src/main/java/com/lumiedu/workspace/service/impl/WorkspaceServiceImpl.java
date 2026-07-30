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
import com.lumiedu.document.entity.Subject;
import com.lumiedu.document.repository.DocumentRepository;
import com.lumiedu.document.repository.SubjectRepository;
import com.lumiedu.document.service.GoogleDriveService;
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
    private final com.lumiedu.prompt.service.PromptEngineService promptEngineService;
    private final SubjectRepository subjectRepository;
    private final GoogleDriveService googleDriveService;
    private final com.lumiedu.email.service.EmailService emailService;

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

        // Auto-create workspace group folder "Nhóm <WorkspaceName>" on Owner's Google Drive
        try {
            String targetFolderName = "Nhóm " + savedWorkspace.getName();
            googleDriveService.getOrCreateFolder(targetFolderName, owner.getId());
            log.info("Created workspace group folder '{}' on Google Drive for owner ID {}", targetFolderName, owner.getId());
        } catch (Exception e) {
            log.warn("Failed to create workspace group folder on Google Drive during workspace creation: {}", e.getMessage());
        }

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
    public List<WorkspaceResponse> getPendingInvitations(Long userId) {
        if (userId == null || !userRepository.existsById(userId)) {
            return Collections.emptyList();
        }
        User user = userRepository.findById(userId).orElse(null);
        String userEmail = user != null ? user.getEmail() : null;

        List<WorkspaceMember> pendingMemberships = workspaceMemberRepository.findByUserIdAndStatus(userId, WorkspaceMemberStatus.PENDING);
        if (userEmail != null && !userEmail.isBlank()) {
            List<WorkspaceMember> emailPending = workspaceMemberRepository.findByEmailAndStatus(userEmail.trim().toLowerCase(), WorkspaceMemberStatus.PENDING);
            for (WorkspaceMember em : emailPending) {
                if (!pendingMemberships.contains(em)) {
                    pendingMemberships.add(em);
                }
            }
        }

        List<WorkspaceResponse> responses = new ArrayList<>();
        for (WorkspaceMember wm : pendingMemberships) {
            sharedWorkspaceRepository.findById(wm.getWorkspaceId()).ifPresent(ws -> {
                responses.add(getWorkspaceDetails(ws));
            });
        }

        return responses;
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

        // Verify user account exists in system before sending invitation
        User targetUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Email '" + email + "' chưa đăng ký tài khoản trên hệ thống LumiEdu!"));

        if (targetUser.getId().equals(request.getInviterId())) {
            throw new IllegalArgumentException("Bạn không thể tự mời chính mình vào nhóm.");
        }

        WorkspaceMember member = WorkspaceMember.builder()
                .workspaceId(workspaceId)
                .userId(targetUser.getId())
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
            workspaceMemberRepository.save(member);

            // Execute Google Drive sync and notification delivery asynchronously in background
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                try {
                    SharedWorkspace workspace = sharedWorkspaceRepository.findById(workspaceId).orElse(null);
                    if (workspace != null) {
                        String targetFolderName = "Nhóm " + workspace.getName();
                        Long ownerId = workspace.getOwnerId();
                        String folderId = googleDriveService.getOrCreateFolder(targetFolderName, ownerId);
                        if (folderId != null && !folderId.startsWith("gdrive_") && member.getEmail() != null && !member.getEmail().isBlank()) {
                            String gDriveRole = (member.getRole() == WorkspaceMemberRole.OWNER || member.getRole() == WorkspaceMemberRole.COLLABORATOR) ? "writer" : "reader";
                            googleDriveService.shareFile(folderId, member.getEmail(), gDriveRole, ownerId);
                            log.info("Shared workspace group folder '{}' with newly accepted member {} ({})", targetFolderName, member.getEmail(), gDriveRole);
                        }
                    }
                } catch (Exception e) {
                    log.warn("Failed to share workspace group folder with member {}: {}", user.getEmail(), e.getMessage());
                }

                // Sync all existing workspace documents with the newly accepted member
                try {
                    List<WorkspaceDocument> wDocs = workspaceDocumentRepository.findByWorkspaceId(workspaceId);
                    for (WorkspaceDocument wd : wDocs) {
                        Document doc = documentRepository.findById(wd.getDocumentId()).orElse(null);
                        if (doc != null) {
                            syncWorkspaceDocumentToGoogleDrive(workspaceId, doc);
                        }
                    }
                } catch (Exception syncEx) {
                    log.warn("Failed async document sync for workspace {}: {}", workspaceId, syncEx.getMessage());
                }

                // Send in-app notification and email to Owner and other members when a new member joins
                try {
                    SharedWorkspace workspace = sharedWorkspaceRepository.findById(workspaceId).orElse(null);
                    if (workspace != null) {
                        String joinedName = user.getFullName() != null && !user.getFullName().isBlank() ? user.getFullName() : user.getEmail();
                        String wsName = workspace.getName();

                        List<WorkspaceMember> allMembers = workspaceMemberRepository.findByWorkspaceIdAndStatus(workspaceId, WorkspaceMemberStatus.ACCEPTED);
                        for (WorkspaceMember m : allMembers) {
                            if (m.getEmail() != null && !m.getEmail().isBlank() && (m.getUserId() == null || !m.getUserId().equals(userId))) {
                                String targetEmail = m.getEmail().trim().toLowerCase();

                                // 1. In-app notification
                                try {
                                    notificationService.createNotification(NotificationRequest.builder()
                                            .targetUserEmail(targetEmail)
                                            .title("Thành viên mới tham gia nhóm / New Workspace Member")
                                            .message(joinedName + " vừa gia nhập vào nhóm '" + wsName + "'.")
                                            .type("SYSTEM")
                                            .build());
                                } catch (Exception ne) {
                                    log.warn("Failed to send notification for new member to {}: {}", targetEmail, ne.getMessage());
                                }

                                // 2. Email notification
                                try {
                                    String emailSubject = "[LumiEdu] Thành viên mới '" + joinedName + "' vừa gia nhập nhóm '" + wsName + "'";
                                    String htmlBody = "<div style='font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #1e293b;'>" +
                                            "<h2 style='color: #10b981;'>Thành viên mới tham gia nhóm học tập</h2>" +
                                            "<p>Chào bạn,</p>" +
                                            "<p>Thành viên <strong>" + joinedName + "</strong> vừa gia nhập nhóm học tập <strong>" + wsName + "</strong>.</p>" +
                                            "<p>Hãy chào đón thành viên mới và cùng nhau học tập hiệu quả trên LumiEdu!</p>" +
                                            "<hr style='border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;' />" +
                                            "<p style='font-size: 12px; color: #64748b;'>Đây là email tự động từ hệ thống LumiEdu StudyHub.</p>" +
                                            "</div>";
                                    emailService.sendEmail(targetEmail, emailSubject, htmlBody, true);
                                } catch (Exception ee) {
                                    log.warn("Failed to send email for new member to {}: {}", targetEmail, ee.getMessage());
                                }
                            }
                        }
                    }
                } catch (Exception memberNotifyEx) {
                    log.warn("Failed to notify members of new member accept: {}", memberNotifyEx.getMessage());
                }
            });
        } else if ("REJECT".equalsIgnoreCase(action)) {
            member.setStatus(WorkspaceMemberStatus.REJECTED);
            workspaceMemberRepository.save(member);
        } else {
            throw new IllegalArgumentException("Invalid response action: " + action + ". Use ACCEPT or REJECT.");
        }
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

        // Sync & share document into Google Drive group folder
        syncWorkspaceDocumentToGoogleDrive(workspaceId, document);

        // Gửi thông báo in-app và email đến TẤT CẢ thành viên nhóm khi có tài liệu mới được thêm vào
        try {
            SharedWorkspace workspace = sharedWorkspaceRepository.findById(workspaceId).orElse(null);
            User uploaderUser = userRepository.findById(userId).orElse(null);
            String uploaderName = uploaderUser != null ? (uploaderUser.getFullName() != null && !uploaderUser.getFullName().isBlank() ? uploaderUser.getFullName() : uploaderUser.getEmail()) : "Thành viên nhóm";
            String wsName = workspace != null ? workspace.getName() : "Workspace";
            String docTitle = document.getTitle() != null && !document.getTitle().isBlank() ? document.getTitle() : (document.getOriginalFileName() != null ? document.getOriginalFileName() : document.getFileName());

            List<WorkspaceMember> members = workspaceMemberRepository.findByWorkspaceIdAndStatus(workspaceId, WorkspaceMemberStatus.ACCEPTED);
            for (WorkspaceMember m : members) {
                if (m.getEmail() != null && !m.getEmail().isBlank() && (m.getUserId() == null || !m.getUserId().equals(userId))) {
                    String targetEmail = m.getEmail().trim().toLowerCase();

                    // 1. In-app Notification
                    try {
                        notificationService.createNotification(NotificationRequest.builder()
                                .targetUserEmail(targetEmail)
                                .title("Tài liệu mới trong nhóm / New Workspace Document")
                                .message(uploaderName + " vừa thêm tài liệu mới '" + docTitle + "' vào nhóm '" + wsName + "'.")
                                .type("SHARED_FILE")
                                .documentId(document.getId())
                                .documentName(docTitle)
                                .build());
                    } catch (Exception ne) {
                        log.warn("Failed to send notification for shared doc to {}: {}", targetEmail, ne.getMessage());
                    }

                    // 2. Email Notification
                    try {
                        String emailSubject = "[LumiEdu] Tài liệu mới '" + docTitle + "' vừa được thêm vào nhóm '" + wsName + "'";
                        String htmlBody = "<div style='font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #1e293b;'>" +
                                "<h2 style='color: #2563eb;'>Tài liệu mới trong nhóm học tập</h2>" +
                                "<p>Chào bạn,</p>" +
                                "<p>Thành viên <strong>" + uploaderName + "</strong> vừa thêm tài liệu mới <strong>" + docTitle + "</strong> vào nhóm học tập <strong>" + wsName + "</strong>.</p>" +
                                "<p>Bạn có thể truy cập Workspace nhóm trên LumiEdu để xem và học tập cùng nhóm ngay bây giờ.</p>" +
                                "<hr style='border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;' />" +
                                "<p style='font-size: 12px; color: #64748b;'>Đây là email tự động từ hệ thống LumiEdu StudyHub.</p>" +
                                "</div>";
                        emailService.sendEmail(targetEmail, emailSubject, htmlBody, true);
                    } catch (Exception ee) {
                        log.warn("Failed to send email for shared doc to {}: {}", targetEmail, ee.getMessage());
                    }
                }
            }
        } catch (Exception notifyEx) {
            log.warn("Failed to process workspace document share notifications: {}", notifyEx.getMessage());
        }
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

        // Thu hồi quyền Google Drive và gửi thông báo + email cho các thành viên trong nhóm
        Document doc = documentRepository.findById(documentId).orElse(null);
        SharedWorkspace ws = sharedWorkspaceRepository.findById(workspaceId).orElse(null);
        User deleterUser = userRepository.findById(userId).orElse(null);
        String deleterName = deleterUser != null ? (deleterUser.getFullName() != null ? deleterUser.getFullName() : deleterUser.getEmail()) : "Thành viên nhóm";
        String wsName = ws != null ? ws.getName() : "Workspace";
        String docTitle = doc != null ? (doc.getTitle() != null && !doc.getTitle().isBlank() ? doc.getTitle() : doc.getFileName()) : "Tài liệu";

        List<WorkspaceMember> members = workspaceMemberRepository.findByWorkspaceIdAndStatus(workspaceId, WorkspaceMemberStatus.ACCEPTED);
        for (WorkspaceMember m : members) {
            if (m.getEmail() != null && !m.getEmail().isBlank()) {
                String memberEmail = m.getEmail().trim().toLowerCase();

                // 1. Revoke Google Drive share for member
                if (doc != null && doc.getGoogleDriveFileId() != null && !doc.getGoogleDriveFileId().startsWith("gdrive_")) {
                    Long ownerId = ws != null ? ws.getOwnerId() : userId;
                    try {
                        googleDriveService.revokeShare(doc.getGoogleDriveFileId(), memberEmail, ownerId);
                        log.info("Revoked Google Drive share for doc {} and member {}", doc.getId(), memberEmail);
                    } catch (Exception e) {
                        log.warn("Failed to revoke Google Drive share for doc {} and member {}: {}", doc.getId(), memberEmail, e.getMessage());
                    }
                }

                // 2. Send in-app notification and email to all workspace members except deleter
                if (m.getUserId() != null && !m.getUserId().equals(userId)) {
                    try {
                        notificationService.createNotification(NotificationRequest.builder()
                                .targetUserEmail(memberEmail)
                                .title("Tài liệu trong nhóm đã bị xóa / Document Deleted")
                                .message(deleterName + " đã xóa tài liệu '" + docTitle + "' khỏi nhóm '" + wsName + "'.")
                                .type("SHARED_FILE")
                                .documentName(docTitle)
                                .build());
                    } catch (Exception ne) {
                        log.warn("Failed to send in-app notification to member {}: {}", memberEmail, ne.getMessage());
                    }

                    try {
                        String emailSubject = "[LumiEdu] Thông báo: Tài liệu '" + docTitle + "' đã bị xóa khỏi nhóm '" + wsName + "'";
                        String htmlBody = "<div style='font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #1e293b;'>" +
                                "<h2 style='color: #dc2626;'>Tài liệu trong nhóm đã bị xóa</h2>" +
                                "<p>Chào bạn,</p>" +
                                "<p>Thành viên <strong>" + deleterName + "</strong> đã xóa tài liệu <strong>" + docTitle + "</strong> khỏi nhóm học tập <strong>" + wsName + "</strong>.</p>" +
                                "<p>Tài liệu này không còn khả dụng trong Workspace nhóm của bạn.</p>" +
                                "<hr style='border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;' />" +
                                "<p style='font-size: 12px; color: #64748b;'>Đây là email tự động từ hệ thống LumiEdu StudyHub.</p>" +
                                "</div>";
                        emailService.sendEmail(memberEmail, emailSubject, htmlBody, true);
                    } catch (Exception ee) {
                        log.warn("Failed to send email notification to member {}: {}", memberEmail, ee.getMessage());
                    }
                }
            }
        }

        // Khi xóa tài liệu khỏi Workspace, chỉ xóa file ở thư mục Nhóm Google Drive (getGoogleDriveFileId)
        if (doc != null && doc.getGoogleDriveFileId() != null && !doc.getGoogleDriveFileId().startsWith("gdrive_")) {
            try {
                googleDriveService.deleteFile(doc.getGoogleDriveFileId(), userId);
                log.info("Deleted Google Drive group file {} on workspace document remove", doc.getGoogleDriveFileId());
            } catch (Exception e) {
                log.warn("Failed to delete Google Drive group file {} on workspace document remove: {}", doc.getGoogleDriveFileId(), e.getMessage());
            }
            doc.setGoogleDriveFileId(null);
            documentRepository.save(doc);
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

        Map<String, Object> promptVars = new HashMap<>();
        promptVars.put("language", "vi");
        promptVars.put("subject", workspace.getName());
        promptVars.put("title", "Workspace " + workspace.getName() + " Report");
        promptVars.put("content", contentBuilder.toString());

        User user = userRepository.findById(userId).orElse(null);

        com.lumiedu.prompt.service.PromptEngineService.PromptEngineExecutionResult execResult = promptEngineService.executePrompt(
                "DOCUMENT_SUMMARY",
                promptVars,
                user,
                user != null ? user.getEmail() : null,
                "WORKSPACE_REPORT",
                String.valueOf(workspaceId),
                "workspace-v" + workspaceId,
                true
        );

        String reportText = "";
        String summaryText = "";

        try {
            com.google.gson.JsonObject jsonObj = new com.google.gson.Gson().fromJson(execResult.getContent(), com.google.gson.JsonObject.class);
            if (jsonObj.has("summaryText")) {
                summaryText = jsonObj.get("summaryText").getAsString();
                reportText = summaryText;
            }
            if (jsonObj.has("summaryBullets")) {
                com.google.gson.JsonArray arr = jsonObj.getAsJsonArray("summaryBullets");
                StringBuilder bulletsSb = new StringBuilder("\n\n### Key Takeaways:\n");
                for (int i = 0; i < arr.size(); i++) {
                    bulletsSb.append("- ").append(arr.get(i).getAsString()).append("\n");
                }
                reportText += bulletsSb.toString();
            }
        } catch (Exception e) {
            log.error("Failed to parse workspace AI report JSON response: {}", e.getMessage());
            reportText = execResult.getContent();
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
            // 1. In-app notification
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

            // 2. Real Email Notification
            if (emailService != null) {
                User owner = userRepository.findById(workspace.getOwnerId()).orElse(null);
                String ownerName = owner != null ? owner.getFullName() : "Một thành viên";
                String subject = "[LumiEdu] Lời mời tham gia nhóm học tập: " + workspace.getName();

                String bodyHtml = "<p>Xin chào,</p>" +
                        "<p>Bạn vừa nhận được lời mời tham gia nhóm học tập <strong>" + workspace.getName() + "</strong> từ <strong>" + ownerName + "</strong> trên LumiEdu StudyHub.</p>" +
                        "<div class=\"highlight-card\">" +
                        "  <p style=\"margin: 0; font-weight: 600;\">Tên Nhóm: " + workspace.getName() + "</p>" +
                        (workspace.getDescription() != null && !workspace.getDescription().isBlank() ? "  <p style=\"margin: 4px 0 0 0; color: #6e6e73;\">" + workspace.getDescription() + "</p>" : "") +
                        "</div>" +
                        "<p>Hãy đăng nhập vào hệ thống LumiEdu StudyHub để xem chi tiết và chấp nhận lời mời tham gia nhóm nhé!</p>";

                String htmlContent = emailService.buildHtmlTemplate(subject, "Lời Mời Tham Gia Nhóm Học Tập", bodyHtml);
                emailService.sendEmail(email, subject, htmlContent, true);
                log.info("Sent workspace invitation email to {}", email);
            }
        } catch (Exception e) {
            log.warn("Failed to deliver workspace invite notification or email to {}: {}", email, e.getMessage());
        }
    }

    private WorkspaceResponse getWorkspaceDetails(SharedWorkspace workspace) {
        User owner = userRepository.findById(workspace.getOwnerId()).orElse(null);
        String ownerName = owner != null ? owner.getFullName() : "Unknown";

        // Members
        List<WorkspaceMember> members = workspaceMemberRepository.findByWorkspaceId(workspace.getId());
        List<WorkspaceMemberResponse> memberResponses = members.stream().map(m -> {
            User u = m.getUserId() != null ? userRepository.findById(m.getUserId()).orElse(null) : null;
            if (u == null && m.getEmail() != null && !m.getEmail().isBlank()) {
                u = userRepository.findByEmail(m.getEmail().trim().toLowerCase()).orElse(null);
            }
            String name = (u != null && u.getFullName() != null && !u.getFullName().isBlank()) ? u.getFullName() : (m.getEmail() != null ? m.getEmail() : "Invited User");
            return WorkspaceMemberResponse.fromEntity(m, name);
        }).collect(Collectors.toList());

        // Documents
        List<WorkspaceDocument> workspaceDocs = workspaceDocumentRepository.findByWorkspaceId(workspace.getId());

        List<WorkspaceDocumentResponse> docResponses = workspaceDocs.stream().map(wd -> {
            Document doc = documentRepository.findById(wd.getDocumentId()).orElse(null);
            User adder = userRepository.findById(wd.getAddedBy()).orElse(null);
            String adderName = adder != null ? adder.getFullName() : "Unknown";

            if (doc != null && !Boolean.TRUE.equals(doc.getDeleted()) && (doc.getModerationStatus() == null || doc.getModerationStatus() == com.lumiedu.document.enums.DocumentStatus.APPROVED)) {
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

    @Override
    @Transactional
    public void deleteWorkspace(Long workspaceId, Long userId) {
        SharedWorkspace workspace = sharedWorkspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found with ID: " + workspaceId));

        if (!workspace.getOwnerId().equals(userId)) {
            throw new SecurityException("Only the workspace owner can delete the workspace.");
        }

        String workspaceName = workspace.getName();
        String targetFolderName = "Nhóm " + workspaceName;

        List<WorkspaceMember> members = workspaceMemberRepository.findByWorkspaceId(workspaceId);
        List<WorkspaceDocument> docs = workspaceDocumentRepository.findByWorkspaceId(workspaceId);

        // Revoke Google Drive shares for all members on workspace documents & folder, and send notifications/emails
        User ownerUser = userRepository.findById(userId).orElse(null);
        String ownerName = ownerUser != null ? (ownerUser.getFullName() != null ? ownerUser.getFullName() : ownerUser.getEmail()) : "Chủ nhóm";

        try {
            String folderId = googleDriveService.getOrCreateFolder(targetFolderName, userId);
            for (WorkspaceMember member : members) {
                if (member.getEmail() != null && !member.getEmail().isBlank()) {
                    String memberEmail = member.getEmail().trim().toLowerCase();

                    // Send in-app notification and email to members (except owner)
                    if (member.getUserId() != null && !member.getUserId().equals(userId)) {
                        try {
                            notificationService.createNotification(NotificationRequest.builder()
                                    .targetUserEmail(memberEmail)
                                    .title("Nhóm học tập đã bị xóa / Workspace Deleted")
                                    .message("Chủ nhóm " + ownerName + " đã xóa nhóm học tập '" + workspaceName + "'. Tất cả tài liệu dùng chung trong nhóm đã được gỡ bỏ.")
                                    .type("SYSTEM")
                                    .build());
                        } catch (Exception ne) {
                            log.warn("Failed to send in-app notification for workspace delete to member {}: {}", memberEmail, ne.getMessage());
                        }

                        try {
                            String emailSubject = "[LumiEdu] Thông báo: Nhóm học tập '" + workspaceName + "' đã bị giải thể";
                            String htmlBody = "<div style='font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #1e293b;'>" +
                                    "<h2 style='color: #dc2626;'>Nhóm học tập đã bị giải thể</h2>" +
                                    "<p>Chào bạn,</p>" +
                                    "<p>Chủ nhóm <strong>" + ownerName + "</strong> đã xóa nhóm học tập <strong>" + workspaceName + "</strong> khỏi hệ thống LumiEdu.</p>" +
                                    "<p>Tất cả tài liệu và dữ liệu trao đổi trong nhóm này đã bị gỡ bỏ khỏi Workspace nhóm.</p>" +
                                    "<hr style='border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;' />" +
                                    "<p style='font-size: 12px; color: #64748b;'>Đây là email tự động từ hệ thống LumiEdu StudyHub.</p>" +
                                    "</div>";
                            emailService.sendEmail(memberEmail, emailSubject, htmlBody, true);
                        } catch (Exception ee) {
                            log.warn("Failed to send email notification for workspace delete to member {}: {}", memberEmail, ee.getMessage());
                        }
                    }

                    // Revoke file shares
                    for (WorkspaceDocument wd : docs) {
                        documentRepository.findById(wd.getDocumentId()).ifPresent(doc -> {
                            if (doc.getGoogleDriveFileId() != null && !doc.getGoogleDriveFileId().startsWith("gdrive_")) {
                                try {
                                    googleDriveService.revokeShare(doc.getGoogleDriveFileId(), memberEmail, userId);
                                } catch (Exception e) {
                                    log.warn("Failed to revoke Google Drive file share for doc {} and member {}: {}", doc.getId(), memberEmail, e.getMessage());
                                }
                            }
                        });
                    }

                    // Revoke workspace folder share
                    if (folderId != null && !folderId.startsWith("gdrive_")) {
                        try {
                            googleDriveService.revokeShare(folderId, memberEmail, userId);
                        } catch (Exception e) {
                            log.warn("Failed to revoke Google Drive workspace folder share for member {}: {}", memberEmail, e.getMessage());
                        }
                    }
                }
            }

            // Xóa luôn thư mục nhóm trên Google Drive của Chủ nhóm khi xóa Workspace
            if (folderId != null && !folderId.startsWith("gdrive_")) {
                try {
                    googleDriveService.deleteFile(folderId, userId);
                    log.info("Deleted workspace group folder '{}' (ID: {}) from Owner's Google Drive", targetFolderName, folderId);
                } catch (Exception delEx) {
                    log.warn("Failed to delete workspace group folder from Google Drive: {}", delEx.getMessage());
                }
            }
        } catch (Exception e) {
            log.warn("Google Drive cleanup on workspace delete skipped/failed: {}", e.getMessage());
        }

        workspaceMemberRepository.deleteAll(members);
        workspaceDocumentRepository.deleteAll(docs);

        List<WorkspaceAiReport> reports = workspaceAiReportRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);
        workspaceAiReportRepository.deleteAll(reports);

        sharedWorkspaceRepository.delete(workspace);
    }

    private List<String> getLumiEduHierarchyForDocument(Document document) {
        List<String> hierarchy = new ArrayList<>();
        hierarchy.add("LumiEdu StudyHub");

        String subjectStr = document.getSubject();
        if (subjectStr == null || subjectStr.isBlank() || "GENERAL".equalsIgnoreCase(subjectStr)) {
            hierarchy.add("Chung");
            return hierarchy;
        }

        String cleanSubject = subjectStr.trim().toUpperCase();
        Optional<Subject> subjectOpt = Optional.empty();
        if (document.getUserId() != null) {
            subjectOpt = subjectRepository.findByCodeAndUserId(cleanSubject, document.getUserId());
        }
        if (subjectOpt.isEmpty()) {
            subjectOpt = subjectRepository.findByCodeAndUserIdIsNull(cleanSubject);
        }
        if (subjectOpt.isEmpty()) {
            List<Subject> matches = subjectRepository.findByCodeContainingIgnoreCase(cleanSubject);
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

    private void syncWorkspaceDocumentToGoogleDrive(Long workspaceId, Document document) {
        try {
            SharedWorkspace workspace = sharedWorkspaceRepository.findById(workspaceId).orElse(null);
            String workspaceName = workspace != null ? workspace.getName() : "Workspace_" + workspaceId;
            String targetFolderName = workspaceName.startsWith("Nhóm ") ? workspaceName : ("Nhóm " + workspaceName);
            Long workspaceOwnerId = workspace != null ? workspace.getOwnerId() : document.getUserId();
            Long documentOwnerId = document.getUserId();

            // First check userGoogleDriveFileId if googleDriveFileId is missing
            String gDriveFileId = document.getGoogleDriveFileId();
            if (gDriveFileId == null || gDriveFileId.startsWith("gdrive_")) {
                if (document.getUserGoogleDriveFileId() != null && !document.getUserGoogleDriveFileId().startsWith("gdrive_")) {
                    gDriveFileId = document.getUserGoogleDriveFileId();
                }
            }

            // Get or create the workspace group folder "Nhóm <WorkspaceName>" on Owner's Drive
            String folderId = googleDriveService.getOrCreateFolder(targetFolderName, workspaceOwnerId);

            // Read file bytes if local file exists
            byte[] fileData = null;
            try {
                String fileTypeStr = document.getFileType() != null ? document.getFileType() : "DOCUMENT";
                String subFolder = "DOCUMENT".equalsIgnoreCase(fileTypeStr) ? "documents" : fileTypeStr.toLowerCase();
                java.nio.file.Path localFilePath = java.nio.file.Paths.get("uploads", subFolder, document.getFileName()).toAbsolutePath().normalize();
                java.io.File localFile = localFilePath.toFile();
                if (!localFile.exists()) {
                    localFilePath = java.nio.file.Paths.get("uploads", document.getFileName()).toAbsolutePath().normalize();
                    localFile = localFilePath.toFile();
                }

                if (localFile.exists()) {
                    fileData = java.nio.file.Files.readAllBytes(localFilePath);
                } else {
                    String docTitleStr = document.getOriginalFileName() != null ? document.getOriginalFileName() : (document.getTitle() != null ? document.getTitle() : "Document");
                    String placeholder = "LumiEdu StudyHub - Workspace Document: " + docTitleStr + "\nDescription: " + (document.getDescription() != null ? document.getDescription() : "No description");
                    fileData = placeholder.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                }
            } catch (Exception fe) {
                log.warn("Could not read local file bytes for document {}: {}", document.getId(), fe.getMessage());
            }

            // Save copy to LumiEdu Personal Folder on Uploader/Sharer's Personal Google Drive & System Drive
            List<String> lumiEduHierarchy = getLumiEduHierarchyForDocument(document);
            String docNameStr = document.getOriginalFileName() != null ? document.getOriginalFileName() : (document.getTitle() != null ? document.getTitle() : "Document.pdf");

            // 1. Save to Uploader's Personal Drive in LumiEdu hierarchy if connected
            if (documentOwnerId != null && googleDriveService.isUserDriveConnected(documentOwnerId) && fileData != null && fileData.length > 0) {
                try {
                    String uploaderLumiEduFileId = googleDriveService.uploadFile(fileData, docNameStr, document.getMimeType(), lumiEduHierarchy, documentOwnerId);
                    log.info("Saved copy of shared doc {} to Uploader's Personal Drive under LumiEdu hierarchy {} with ID {}", document.getId(), lumiEduHierarchy, uploaderLumiEduFileId);

                    String uploaderGroupFileId = googleDriveService.uploadFile(fileData, docNameStr, document.getMimeType(), List.of(targetFolderName), documentOwnerId);
                    log.info("Saved copy of shared doc {} to Uploader's Personal Drive Group Folder with ID {}", document.getId(), uploaderGroupFileId);
                } catch (Exception uEx) {
                    log.warn("Failed to save copy to Uploader's Personal Google Drive: {}", uEx.getMessage());
                }
            }

            // 2. Save copy to System Mail Drive under LumiEdu hierarchy
            if (fileData != null && fileData.length > 0) {
                try {
                    String systemLumiEduFileId = googleDriveService.uploadFile(fileData, docNameStr, document.getMimeType(), lumiEduHierarchy);
                    log.info("Saved copy of shared doc {} to System Mail Drive under LumiEdu hierarchy {} with ID {}", document.getId(), lumiEduHierarchy, systemLumiEduFileId);
                } catch (Exception sysEx) {
                    log.warn("Failed to save copy to System Mail Drive under LumiEdu hierarchy: {}", sysEx.getMessage());
                }
            }

            // 3. Place / Upload inside Workspace Group Folder "Nhóm <WorkspaceName>" on Owner's Drive
            boolean validDriveFile = false;
            if (gDriveFileId != null && !gDriveFileId.startsWith("gdrive_") && folderId != null && !folderId.startsWith("gdrive_")) {
                try {
                    googleDriveService.moveFileToFolder(gDriveFileId, folderId, workspaceOwnerId);
                    if (documentOwnerId != null && !workspaceOwnerId.equals(documentOwnerId)) {
                        googleDriveService.moveFileToFolder(gDriveFileId, folderId, documentOwnerId);
                    }
                    validDriveFile = true;
                    document.setGoogleDriveFileId(gDriveFileId);
                    document.setStorageProvider("GOOGLE_DRIVE");
                    documentRepository.save(document);
                    log.info("Placed Google Drive file {} inside workspace folder {}", gDriveFileId, folderId);
                } catch (Exception moveEx) {
                    log.warn("Failed to move existing Google Drive file {} into folder {}: {}. Will re-upload if needed.", gDriveFileId, folderId, moveEx.getMessage());
                    if (moveEx.getMessage() != null && moveEx.getMessage().contains("404")) {
                        gDriveFileId = null;
                    }
                }
            }

            if (!validDriveFile || gDriveFileId == null || gDriveFileId.startsWith("gdrive_")) {
                try {
                    if (fileData != null && fileData.length > 0) {
                        String uploadedFileId = googleDriveService.uploadFile(fileData, docNameStr, document.getMimeType(), targetFolderName, workspaceOwnerId);
                        if (uploadedFileId != null && !uploadedFileId.startsWith("gdrive_")) {
                            document.setGoogleDriveFileId(uploadedFileId);
                            document.setFileUrl("https://drive.google.com/file/d/" + uploadedFileId + "/view");
                            document.setStorageProvider("GOOGLE_DRIVE");
                            documentRepository.save(document);
                            gDriveFileId = uploadedFileId;
                            log.info("Auto-uploaded workspace document {} to Google Drive folder {} with ID {}", document.getId(), targetFolderName, uploadedFileId);
                        }
                    }
                } catch (Exception e) {
                    log.warn("Failed to auto-upload document {} to Google Drive for workspace {}: {}", document.getId(), workspaceName, e.getMessage());
                }
            }

            // 4. Auto-share Google Drive files with workspace members
            if (gDriveFileId != null && !gDriveFileId.startsWith("gdrive_")) {
                final String workspaceOwnerEmail = userRepository.findById(workspaceOwnerId).map(User::getEmail).orElse("");
                List<WorkspaceMember> members = workspaceMemberRepository.findByWorkspaceIdAndStatus(workspaceId, WorkspaceMemberStatus.ACCEPTED);

                for (WorkspaceMember m : members) {
                    if (m.getEmail() != null && !m.getEmail().isBlank()) {
                        String gDriveRole = (m.getRole() == WorkspaceMemberRole.OWNER || m.getRole() == WorkspaceMemberRole.COLLABORATOR) ? "writer" : "reader";
                        try {
                            if (folderId != null && !folderId.startsWith("gdrive_")) {
                                googleDriveService.shareFile(folderId, m.getEmail(), gDriveRole, workspaceOwnerId);
                            }
                            if (!m.getEmail().equalsIgnoreCase(workspaceOwnerEmail)) {
                                googleDriveService.shareFile(gDriveFileId, m.getEmail(), gDriveRole, workspaceOwnerId);
                            }
                            log.info("Shared Google Drive file {} and folder '{}' with member {} ({})", gDriveFileId, targetFolderName, m.getEmail(), gDriveRole);
                        } catch (Exception e) {
                            log.warn("Failed to share Google Drive file/folder with member {}: {}", m.getEmail(), e.getMessage());
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error syncing document {} to Google Drive for workspace {}: {}", document.getId(), workspaceId, e.getMessage());
        }
    }


}
