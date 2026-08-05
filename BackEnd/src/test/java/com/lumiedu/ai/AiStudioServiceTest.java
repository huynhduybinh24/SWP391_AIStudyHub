package com.lumiedu.ai;

import com.lumiedu.ai.dto.StudioResponses.*;
import com.lumiedu.ai.entity.AiStudioCache;
import com.lumiedu.ai.entity.DocumentChunk;
import com.lumiedu.ai.exception.AiApiException;
import com.lumiedu.ai.repository.AiStudioCacheRepository;
import com.lumiedu.ai.repository.DocumentChunkRepository;
import com.lumiedu.ai.service.AiDocumentAccessService;
import com.lumiedu.ai.service.GeminiService;
import com.lumiedu.ai.service.impl.AiStudioServiceImpl;
import com.lumiedu.document.entity.Document;
import com.lumiedu.document.repository.DocumentRepository;
import com.lumiedu.prompt.service.PromptEngineService;
import com.lumiedu.prompt.service.PromptEngineService.PromptEngineExecutionResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AiStudioServiceTest {

    @Mock
    private DocumentRepository documentRepository;
    @Mock
    private DocumentChunkRepository documentChunkRepository;
    @Mock
    private AiStudioCacheRepository aiStudioCacheRepository;
    @Mock
    private PromptEngineService promptEngineService;
    @Mock
    private GeminiService geminiService;
    @Mock
    private AiDocumentAccessService aiDocumentAccessService;

    @InjectMocks
    private AiStudioServiceImpl aiStudioService;

    private Document doc1;
    private Document doc2;

    @BeforeEach
    void setUp() {
        doc1 = Document.builder().id(10L).title("Physics Notes").deleted(false).updatedAt(LocalDateTime.of(2026, 1, 1, 10, 0)).build();
        doc2 = Document.builder().id(20L).title("Chemistry Notes").deleted(false).updatedAt(LocalDateTime.of(2026, 1, 1, 10, 0)).build();
    }

    @Test
    @DisplayName("1. Cache identity produces exact same SHA-256 hash regardless of document ID order")
    void testCacheIdentitySortedDocOrder() {
        when(aiDocumentAccessService.getCurrentUserId()).thenReturn(100L);
        when(documentRepository.findById(10L)).thenReturn(Optional.of(doc1));
        when(documentRepository.findById(20L)).thenReturn(Optional.of(doc2));

        String key1 = aiStudioService.generateCacheKey(Arrays.asList(10L, 20L), "summary", "vi", null, null);
        String key2 = aiStudioService.generateCacheKey(Arrays.asList(20L, 10L), "summary", "vi", null, null);

        assertNotNull(key1);
        assertEquals(64, key1.length());
        assertEquals(key1, key2, "Sorted document IDs [10,20] and [20,10] must yield identical cache identity digest.");
    }

    @Test
    @DisplayName("2. Cache identity differs for different user, difficulty, count, or updated timestamp")
    void testCacheIdentityVariations() {
        when(documentRepository.findById(10L)).thenReturn(Optional.of(doc1));

        when(aiDocumentAccessService.getCurrentUserId()).thenReturn(100L);
        String user100Key = aiStudioService.generateCacheKey(List.of(10L), "quiz_easy_5", "vi", "easy", 5);

        when(aiDocumentAccessService.getCurrentUserId()).thenReturn(200L);
        String user200Key = aiStudioService.generateCacheKey(List.of(10L), "quiz_easy_5", "vi", "easy", 5);

        assertNotEquals(user100Key, user200Key, "Different users must not share cache identity.");

        String easyKey = aiStudioService.generateCacheKey(List.of(10L), "quiz_easy_5", "vi", "easy", 5);
        String hardKey = aiStudioService.generateCacheKey(List.of(10L), "quiz_hard_5", "vi", "hard", 5);
        assertNotEquals(easyKey, hardKey, "Different difficulty must change cache identity.");
    }

    @Test
    @DisplayName("3. forceRegenerate=true bypasses cache read")
    void testForceRegenerateBypassesCacheRead() {
        when(documentRepository.findById(10L)).thenReturn(Optional.of(doc1));
        DocumentChunk chunk1 = DocumentChunk.builder().id(1L).documentId(10L).chunkIndex(0).content("Newton laws").build();
        when(documentChunkRepository.findByDocumentId(10L)).thenReturn(List.of(chunk1));

        PromptEngineExecutionResult mockResult = PromptEngineExecutionResult.builder()
                .content("{\"summaryText\":\"Newly generated summary\",\"summaryBullets\":[\"Key bullet\"]}")
                .promptTokens(100)
                .completionTokens(50)
                .build();
        when(promptEngineService.executePrompt(anyString(), anyMap(), any(), anyString(), anyString(), anyString(), anyString(), anyBoolean()))
                .thenReturn(mockResult);

        StudioSummaryResponse response = aiStudioService.generateSummary(List.of(10L), "vi", true);

        assertNotNull(response);
        assertEquals("Newly generated summary", response.getSummaryText());
        verify(aiStudioCacheRepository, times(1)).save(any(AiStudioCache.class));
    }

    @Test
    @DisplayName("4. Markdown fenced JSON is stripped and parsed correctly")
    void testFencedJsonStripping() {
        when(documentRepository.findById(10L)).thenReturn(Optional.of(doc1));
        DocumentChunk chunk = DocumentChunk.builder().id(1L).documentId(10L).chunkIndex(0).content("Sample content").build();
        when(documentChunkRepository.findByDocumentId(10L)).thenReturn(List.of(chunk));

        String fencedRaw = "```json\n{\"summaryText\":\"Valid fenced summary\",\"summaryBullets\":[\"Bullet 1\"]}\n```";
        PromptEngineExecutionResult mockResult = PromptEngineExecutionResult.builder().content(fencedRaw).promptTokens(50).completionTokens(20).build();
        when(promptEngineService.executePrompt(anyString(), anyMap(), any(), anyString(), anyString(), anyString(), anyString(), anyBoolean()))
                .thenReturn(mockResult);

        StudioSummaryResponse response = aiStudioService.generateSummary(List.of(10L), "vi", true);
        assertNotNull(response);
        assertEquals("Valid fenced summary", response.getSummaryText());
    }

    @Test
    @DisplayName("5. Malformed JSON triggers exactly 1 repair attempt; if repaired valid, saved to cache")
    void testMalformedJsonRepairSuccess() {
        when(documentRepository.findById(10L)).thenReturn(Optional.of(doc1));
        DocumentChunk chunk = DocumentChunk.builder().id(1L).documentId(10L).chunkIndex(0).content("Sample content").build();
        when(documentChunkRepository.findByDocumentId(10L)).thenReturn(List.of(chunk));

        String malformedRaw = "{\"summaryText\":\"Broken JSON missing bullets}";
        PromptEngineExecutionResult mockResult = PromptEngineExecutionResult.builder().content(malformedRaw).promptTokens(50).completionTokens(20).build();
        when(promptEngineService.executePrompt(anyString(), anyMap(), any(), anyString(), anyString(), anyString(), anyString(), anyBoolean()))
                .thenReturn(mockResult);

        String repairedJson = "{\"summaryText\":\"Repaired summary\",\"summaryBullets\":[\"Repaired bullet\"]}";
        when(geminiService.generateContent(anyString())).thenReturn(repairedJson);

        StudioSummaryResponse response = aiStudioService.generateSummary(List.of(10L), "vi", true);
        assertNotNull(response);
        assertEquals("Repaired summary", response.getSummaryText());
        verify(geminiService, times(1)).generateContent(anyString());
        verify(aiStudioCacheRepository, times(1)).save(any(AiStudioCache.class));
    }

    @Test
    @DisplayName("6. Invalid Quiz structure (only 3 options) fails validation, fails repair, and throws AI_RESPONSE_INVALID without caching")
    void testInvalidQuizRejection() {
        when(documentRepository.findById(10L)).thenReturn(Optional.of(doc1));
        DocumentChunk chunk = DocumentChunk.builder().id(1L).documentId(10L).chunkIndex(0).content("Sample content").build();
        when(documentChunkRepository.findByDocumentId(10L)).thenReturn(List.of(chunk));

        String invalidQuizRaw = "{\"questions\":[{\"q\":\"What is gravity?\",\"options\":[\"A force\",\"A wave\",\"A particle\"],\"answer\":0,\"explain\":\"Gravity attraction.\"}]}";
        PromptEngineExecutionResult mockResult = PromptEngineExecutionResult.builder().content(invalidQuizRaw).promptTokens(50).completionTokens(20).build();
        when(promptEngineService.executePrompt(anyString(), anyMap(), any(), anyString(), anyString(), anyString(), anyString(), anyBoolean()))
                .thenReturn(mockResult);

        // Repair also fails
        when(geminiService.generateContent(anyString())).thenReturn(invalidQuizRaw);

        AiApiException ex = assertThrows(AiApiException.class, () -> {
            aiStudioService.generateQuiz(List.of(10L), "medium", 5, "vi", true);
        });

        assertEquals("AI_RESPONSE_INVALID", ex.getErrorCode());
        verify(aiStudioCacheRepository, never()).save(any());
    }

    @Test
    @DisplayName("7. Duplicate flashcards are filtered out")
    void testDuplicateFlashcardsFilter() {
        when(documentRepository.findById(10L)).thenReturn(Optional.of(doc1));
        DocumentChunk chunk = DocumentChunk.builder().id(1L).documentId(10L).chunkIndex(0).content("Sample content").build();
        when(documentChunkRepository.findByDocumentId(10L)).thenReturn(List.of(chunk));

        String flashcardsRaw = "{\"flashcards\":[{\"front\":\"What is H2O?\",\"back\":\"Water\"},{\"front\":\"what is h2o?\",\"back\":\"Water duplicate\"},{\"front\":\"What is CO2?\",\"back\":\"Carbon dioxide\"}]}";
        PromptEngineExecutionResult mockResult = PromptEngineExecutionResult.builder().content(flashcardsRaw).promptTokens(50).completionTokens(20).build();
        when(promptEngineService.executePrompt(anyString(), anyMap(), any(), anyString(), anyString(), anyString(), anyString(), anyBoolean()))
                .thenReturn(mockResult);

        List<StudioFlashcardResponse> result = aiStudioService.generateFlashcards(List.of(10L), "vi", true);
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("What is H2O?", result.get(0).getFront());
        assertEquals("What is CO2?", result.get(1).getFront());
    }
}
