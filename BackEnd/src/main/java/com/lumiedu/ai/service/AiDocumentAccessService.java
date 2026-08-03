package com.lumiedu.ai.service;

import com.lumiedu.document.entity.Document;
import com.lumiedu.user.entity.User;

import java.util.List;

public interface AiDocumentAccessService {

    /**
     * Obtains the currently authenticated user from Spring Security context.
     * Throws AiApiException (401) if unauthenticated.
     */
    User getCurrentAuthenticatedUser();

    /**
     * Obtains the currently authenticated user's ID.
     */
    Long getCurrentUserId();

    /**
     * Validates that the current authenticated user has access to the specified document
     * and that the document is ready for AI processing.
     * Returns the validated Document entity.
     */
    Document validateAndGetDocument(Long documentId);

    /**
     * Validates that the current authenticated user has access to ALL specified documents
     * and that each document is ready for AI processing.
     * Returns the list of validated Document entities.
     */
    List<Document> validateAndGetDocuments(List<Long> documentIds);

    /**
     * Asserts that the path/request userId matches the authenticated user or admin role.
     */
    void verifyUserAccess(Long targetUserId);
}
