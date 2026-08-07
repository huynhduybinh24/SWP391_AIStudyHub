package com.lumiedu.ai.service.impl;

import com.lumiedu.ai.entity.DocumentChunk;
import com.lumiedu.ai.exception.AiApiException;
import com.lumiedu.ai.repository.DocumentChunkRepository;
import com.lumiedu.ai.service.AiDocumentAccessService;
import com.lumiedu.ai.service.DocumentChunkingService;
import com.lumiedu.document.entity.Document;
import com.lumiedu.document.enums.DocumentStatus;
import com.lumiedu.document.repository.DocumentRepository;
import com.lumiedu.document.repository.DocumentShareRepository;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.enums.UserRole;
import com.lumiedu.user.repository.UserRepository;
import com.lumiedu.workspace.entity.WorkspaceDocument;
import com.lumiedu.workspace.enums.WorkspaceMemberStatus;
import com.lumiedu.workspace.repository.WorkspaceDocumentRepository;
import com.lumiedu.workspace.repository.WorkspaceMemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiDocumentAccessServiceImpl implements AiDocumentAccessService {

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final DocumentShareRepository documentShareRepository;
    private final WorkspaceDocumentRepository workspaceDocumentRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final DocumentChunkingService documentChunkingService;

    @Override
    public User getCurrentAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw AiApiException.unauthorized("Authentication required to access AI services.");
        }

        User user = null;
        if (auth.getDetails() instanceof Long) {
            Long userId = (Long) auth.getDetails();
            user = userRepository.findById(userId).orElse(null);
        }

        if (user == null && auth.getName() != null) {
            user = userRepository.findByEmail(auth.getName()).orElse(null);
        }

        if (user == null) {
            throw AiApiException.unauthorized("Authenticated user context could not be resolved.");
        }
        return user;
    }

    @Override
    public Long getCurrentUserId() {
        return getCurrentAuthenticatedUser().getId();
    }

    @Override
    public Document validateAndGetDocument(Long documentId) {
        if (documentId == null || documentId <= 0) {
            throw AiApiException.badRequest("AI_DOCUMENT_REQUIRED", "Valid document ID is required.");
        }

        User currentUser = getCurrentAuthenticatedUser();

        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> AiApiException.notFound("AI_DOCUMENT_NOT_FOUND", "Document not found or access denied."));

        if (Boolean.TRUE.equals(doc.getDeleted())) {
            throw AiApiException.notFound("AI_DOCUMENT_NOT_FOUND", "Document not found or access denied.");
        }

        if (!checkUserAccessToDocument(currentUser, doc)) {
            throw AiApiException.forbidden("AI_DOCUMENT_FORBIDDEN", "Access to the requested document is forbidden.");
        }

        checkDocumentReadiness(doc);

        return doc;
    }

    @Override
    public List<Document> validateAndGetDocuments(List<Long> documentIds) {
        if (documentIds == null || documentIds.isEmpty()) {
            throw AiApiException.badRequest("AI_DOCUMENT_REQUIRED", "At least one document ID is required.");
        }

        List<Document> validatedDocs = new ArrayList<>();
        for (Long docId : documentIds) {
            if (docId == null || docId <= 0) {
                throw AiApiException.badRequest("AI_INVALID_REQUEST", "Document IDs must not contain null or invalid values.");
            }
            validatedDocs.add(validateAndGetDocument(docId));
        }

        return validatedDocs;
    }

    @Override
    public void verifyUserAccess(Long targetUserId) {
        User currentUser = getCurrentAuthenticatedUser();
        if (currentUser.getRole() == UserRole.ADMIN) {
            return;
        }
        if (targetUserId == null || !currentUser.getId().equals(targetUserId)) {
            throw AiApiException.forbidden("AI_UNAUTHORIZED", "You are not authorized to access data belonging to another user.");
        }
    }

    private boolean checkUserAccessToDocument(User currentUser, Document doc) {
        if (currentUser == null || doc == null) {
            return false;
        }

        // 1. Document Owner
        if (doc.getUserId() != null && doc.getUserId().equals(currentUser.getId())) {
            return true;
        }

        // 2. Administrator
        if (currentUser.getRole() == UserRole.ADMIN) {
            return true;
        }

        // 3. Explicit Document Share
        if (currentUser.getEmail() != null) {
            boolean isShared = documentShareRepository.findByDocumentIdAndShareeEmail(doc.getId(), currentUser.getEmail()).isPresent();
            if (isShared) {
                return true;
            }
        }

        // 4. Workspace Member Access
        List<WorkspaceDocument> workspaceDocs = workspaceDocumentRepository.findByDocumentId(doc.getId());
        if (workspaceDocs != null && !workspaceDocs.isEmpty()) {
            for (WorkspaceDocument wsDoc : workspaceDocs) {
                boolean isMemberByUserId = workspaceMemberRepository.findByWorkspaceIdAndUserId(wsDoc.getWorkspaceId(), currentUser.getId())
                        .filter(m -> m.getStatus() == WorkspaceMemberStatus.ACCEPTED)
                        .isPresent();
                if (isMemberByUserId) {
                    return true;
                }
                if (currentUser.getEmail() != null) {
                    boolean isMemberByEmail = workspaceMemberRepository.findByWorkspaceIdAndEmail(wsDoc.getWorkspaceId(), currentUser.getEmail())
                            .filter(m -> m.getStatus() == WorkspaceMemberStatus.ACCEPTED)
                            .isPresent();
                    if (isMemberByEmail) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private void checkDocumentReadiness(Document doc) {
        if (doc.getModerationStatus() == DocumentStatus.REJECTED) {
            throw AiApiException.badRequest("AI_DOCUMENT_NOT_READY", "Document was rejected during moderation.");
        }
        if ("REJECTED".equalsIgnoreCase(doc.getStatus()) || "FAILED".equalsIgnoreCase(doc.getStatus())) {
            throw AiApiException.badRequest("AI_DOCUMENT_NOT_READY", "Document processing status is invalid.");
        }

        if (documentChunkingService != null && documentChunkingService.isProcessing(doc.getId())) {
            throw AiApiException.badRequest("AI_DOCUMENT_NOT_READY", "Document is currently processing. Please wait.");
        }

        List<DocumentChunk> chunks = documentChunkRepository.findByDocumentId(doc.getId());
        if ((chunks == null || chunks.isEmpty()) && documentChunkingService != null) {
            try {
                documentChunkingService.chunkAndIndexDocument(doc.getId());
                chunks = documentChunkRepository.findByDocumentId(doc.getId());
            } catch (Exception e) {
                log.warn("Auto-indexing failed for document {}: {}", doc.getId(), e.getMessage());
            }
        }

        if (chunks == null || chunks.isEmpty()) {
            throw AiApiException.badRequest("AI_DOCUMENT_NOT_READY", "Document does not have indexed content for AI processing.");
        }
    }
}
