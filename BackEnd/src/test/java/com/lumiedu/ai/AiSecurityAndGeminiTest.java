package com.lumiedu.ai;

import com.lumiedu.ai.entity.DocumentChunk;
import com.lumiedu.ai.exception.AiApiException;
import com.lumiedu.ai.repository.DocumentChunkRepository;
import com.lumiedu.ai.service.DocumentChunkingService;
import com.lumiedu.ai.service.GeminiService;
import com.lumiedu.ai.service.impl.AiDocumentAccessServiceImpl;
import com.lumiedu.document.entity.Document;
import com.lumiedu.document.enums.DocumentStatus;
import com.lumiedu.document.repository.DocumentRepository;
import com.lumiedu.document.repository.DocumentShareRepository;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.enums.UserRole;
import com.lumiedu.user.repository.UserRepository;
import com.lumiedu.workspace.repository.WorkspaceDocumentRepository;
import com.lumiedu.workspace.repository.WorkspaceMemberRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class AiSecurityAndGeminiTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private DocumentRepository documentRepository;
    @Mock
    private DocumentShareRepository documentShareRepository;
    @Mock
    private WorkspaceDocumentRepository workspaceDocumentRepository;
    @Mock
    private WorkspaceMemberRepository workspaceMemberRepository;
    @Mock
    private DocumentChunkRepository documentChunkRepository;
    @Mock
    private DocumentChunkingService documentChunkingService;

    @InjectMocks
    private AiDocumentAccessServiceImpl documentAccessService;

    private User testUser;
    private User adminUser;
    private Document testDoc;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();

        testUser = User.builder()
                .id(100L)
                .email("student@lumiedu.com")
                .role(UserRole.USER)
                .build();

        adminUser = User.builder()
                .id(999L)
                .email("admin@lumiedu.com")
                .role(UserRole.ADMIN)
                .build();

        testDoc = Document.builder()
                .id(500L)
                .userId(100L)
                .title("Calculus Notes")
                .visibility("PRIVATE")
                .moderationStatus(DocumentStatus.APPROVED)
                .deleted(false)
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("1. Unauthenticated request should throw 401 AI_UNAUTHORIZED")
    void testUnauthenticatedAccess() {
        AiApiException ex = assertThrows(AiApiException.class, () -> {
            documentAccessService.getCurrentAuthenticatedUser();
        });
        assertEquals(401, ex.getStatus().value());
        assertEquals("AI_UNAUTHORIZED", ex.getErrorCode());
    }

    @Test
    @DisplayName("2. Owner document access should succeed when chunks exist")
    void testOwnerDocumentAccessSuccess() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("student@lumiedu.com", null, Collections.emptyList());
        auth.setDetails(100L);
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(userRepository.findById(100L)).thenReturn(Optional.of(testUser));
        when(documentRepository.findById(500L)).thenReturn(Optional.of(testDoc));

        DocumentChunk chunk = new DocumentChunk();
        chunk.setDocumentId(500L);
        when(documentChunkRepository.findByDocumentId(500L)).thenReturn(List.of(chunk));

        Document doc = documentAccessService.validateAndGetDocument(500L);
        assertNotNull(doc);
        assertEquals(500L, doc.getId());
    }

    @Test
    @DisplayName("3. Non-owner private document access should throw 403 AI_DOCUMENT_FORBIDDEN")
    void testNonOwnerForbiddenAccess() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("other@lumiedu.com", null, Collections.emptyList());
        auth.setDetails(200L);
        SecurityContextHolder.getContext().setAuthentication(auth);

        User otherUser = User.builder().id(200L).email("other@lumiedu.com").role(UserRole.USER).build();
        when(userRepository.findById(200L)).thenReturn(Optional.of(otherUser));
        when(documentRepository.findById(500L)).thenReturn(Optional.of(testDoc));

        AiApiException ex = assertThrows(AiApiException.class, () -> {
            documentAccessService.validateAndGetDocument(500L);
        });

        assertEquals(403, ex.getStatus().value());
        assertEquals("AI_DOCUMENT_FORBIDDEN", ex.getErrorCode());
    }

    @Test
    @DisplayName("4. Admin user can access any document")
    void testAdminAccessAnyDocument() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("admin@lumiedu.com", null, Collections.emptyList());
        auth.setDetails(999L);
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(userRepository.findById(999L)).thenReturn(Optional.of(adminUser));
        when(documentRepository.findById(500L)).thenReturn(Optional.of(testDoc));
        when(documentChunkRepository.findByDocumentId(500L)).thenReturn(List.of(new DocumentChunk()));

        Document doc = documentAccessService.validateAndGetDocument(500L);
        assertNotNull(doc);
        assertEquals(500L, doc.getId());
    }

    @Test
    @DisplayName("5. Document with no chunks or processing error throws 400 AI_DOCUMENT_NOT_READY")
    void testDocumentNotReady() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("student@lumiedu.com", null, Collections.emptyList());
        auth.setDetails(100L);
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(userRepository.findById(100L)).thenReturn(Optional.of(testUser));
        when(documentRepository.findById(500L)).thenReturn(Optional.of(testDoc));
        when(documentChunkRepository.findByDocumentId(500L)).thenReturn(Collections.emptyList());

        AiApiException ex = assertThrows(AiApiException.class, () -> {
            documentAccessService.validateAndGetDocument(500L);
        });

        assertEquals(400, ex.getStatus().value());
        assertEquals("AI_DOCUMENT_NOT_READY", ex.getErrorCode());
    }
}
