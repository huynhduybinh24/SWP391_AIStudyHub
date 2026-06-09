package com.lumiedu.document;

import com.lumiedu.document.dto.request.DocumentCreateRequest;
import com.lumiedu.document.dto.request.DocumentUpdateRequest;
import com.lumiedu.document.dto.response.DocumentResponse;
import com.lumiedu.document.entity.Document;
import com.lumiedu.document.entity.DocumentTag;
import com.lumiedu.document.exception.DocumentNotFoundException;
import com.lumiedu.document.exception.InvalidFileTypeException;
import com.lumiedu.document.repository.AudioRecordRepository;
import com.lumiedu.document.repository.DocumentDownloadRepository;
import com.lumiedu.document.repository.DocumentRepository;
import com.lumiedu.document.repository.DocumentTagRepository;
import com.lumiedu.document.service.impl.DocumentServiceImpl;
import com.lumiedu.document.service.GoogleDriveService;
import com.lumiedu.ai.service.DocumentChunkingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DocumentServiceTest {

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private DocumentTagRepository documentTagRepository;

    @Mock
    private DocumentDownloadRepository documentDownloadRepository;

    @Mock
    private AudioRecordRepository audioRecordRepository;

    @Mock
    private GoogleDriveService googleDriveService;

    @Mock
    private DocumentChunkingService documentChunkingService;

    @InjectMocks
    private DocumentServiceImpl documentService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(documentService, "uploadDir", "test-uploads");
    }

    @AfterEach
    void tearDown() throws IOException {
        Path tempDir = Paths.get("test-uploads");
        if (Files.exists(tempDir)) {
            try (var stream = Files.walk(tempDir)) {
                stream.sorted(Comparator.reverseOrder())
                      .map(Path::toFile)
                      .forEach(java.io.File::delete);
            }
        }
    }

    @Test
    void testUploadDocument_Success() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "lecture1.pdf",
                "application/pdf",
                "PDF content".getBytes()
        );

        DocumentCreateRequest request = DocumentCreateRequest.builder()
                .title("Lecture 1")
                .description("Intro to Java")
                .subject("PRJ301")
                .visibility("PUBLIC")
                .userId(1L)
                .tags(List.of("java", "oop"))
                .build();

        Document mockSavedDoc = Document.builder()
                .id(100L)
                .title("Lecture 1")
                .description("Intro to Java")
                .fileName("uuid-filename.pdf")
                .originalFileName("lecture1.pdf")
                .fileType("DOCUMENT")
                .mimeType("application/pdf")
                .fileSize(11L)
                .subject("PRJ301")
                .visibility("PUBLIC")
                .userId(1L)
                .googleDriveFileId("mock-drive-id")
                .storageProvider("GOOGLE_DRIVE")
                .deleted(false)
                .build();

        when(googleDriveService.uploadFile(any(), any())).thenReturn("mock-drive-id");
        when(documentRepository.save(any(Document.class))).thenReturn(mockSavedDoc);
        when(documentTagRepository.findAllByDocumentId(100L)).thenReturn(
                List.of(
                        DocumentTag.builder().name("java").build(),
                        DocumentTag.builder().name("oop").build()
                )
        );

        DocumentResponse response = documentService.uploadDocument(file, request);

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals("Lecture 1", response.getTitle());
        assertEquals("DOCUMENT", response.getFileType());
        assertEquals(2, response.getTags().size());
        assertTrue(response.getTags().contains("java"));

        verify(documentRepository, times(1)).save(any(Document.class));
        verify(documentTagRepository, times(2)).save(any(DocumentTag.class));
    }

    @Test
    void testUploadDocument_InvalidExtension() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "malicious.exe",
                "application/octet-stream",
                "Executable content".getBytes()
        );

        DocumentCreateRequest request = DocumentCreateRequest.builder()
                .title("Cheat Sheet")
                .userId(1L)
                .build();

        assertThrows(InvalidFileTypeException.class, () -> {
            documentService.uploadDocument(file, request);
        });

        verify(documentRepository, never()).save(any(Document.class));
    }

    @Test
    void testGetDocumentById_Success() {
        Document document = Document.builder()
                .id(1L)
                .title("Test Doc")
                .deleted(false)
                .build();

        when(documentRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(document));
        when(documentTagRepository.findAllByDocumentId(1L)).thenReturn(Collections.emptyList());

        DocumentResponse response = documentService.getDocumentById(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Test Doc", response.getTitle());
    }

    @Test
    void testGetDocumentById_NotFound() {
        when(documentRepository.findByIdAndDeletedFalse(999L)).thenReturn(Optional.empty());

        assertThrows(DocumentNotFoundException.class, () -> {
            documentService.getDocumentById(999L);
        });
    }

    @Test
    void testUpdateDocument_Success() {
        Document existingDoc = Document.builder()
                .id(1L)
                .title("Old Title")
                .deleted(false)
                .build();

        DocumentUpdateRequest updateRequest = DocumentUpdateRequest.builder()
                .title("New Title")
                .tags(List.of("updated-tag"))
                .build();

        when(documentRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(existingDoc));
        when(documentRepository.save(any(Document.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DocumentResponse response = documentService.updateDocument(1L, updateRequest);

        assertNotNull(response);
        assertEquals("New Title", response.getTitle());
        verify(documentTagRepository, times(1)).deleteAll(any());
        verify(documentTagRepository, times(1)).save(any(DocumentTag.class));
    }

    @Test
    void testDeleteDocument_SoftDelete() {
        Document existingDoc = Document.builder()
                .id(1L)
                .title("Target Doc")
                .deleted(false)
                .build();

        when(documentRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(existingDoc));

        documentService.deleteDocument(1L);

        assertTrue(existingDoc.getDeleted());
        verify(documentRepository, times(1)).save(existingDoc);
    }
}
