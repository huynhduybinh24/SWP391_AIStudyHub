package com.lumiedu.ai.service.impl;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.reflect.TypeToken;
import com.lumiedu.ai.dto.StudioResponses.*;
import com.lumiedu.ai.entity.AiStudioCache;
import com.lumiedu.ai.entity.DocumentChunk;
import com.lumiedu.ai.exception.AiApiException;
import com.lumiedu.ai.repository.AiStudioCacheRepository;
import com.lumiedu.ai.repository.DocumentChunkRepository;
import com.lumiedu.ai.service.AiDocumentAccessService;
import com.lumiedu.ai.service.AiStudioService;
import com.lumiedu.ai.service.GeminiService;
import com.lumiedu.document.entity.Document;
import com.lumiedu.document.repository.DocumentRepository;
import com.lumiedu.prompt.service.PromptEngineService;
import com.lumiedu.prompt.service.PromptEngineService.PromptEngineExecutionResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AiStudioServiceImpl implements AiStudioService {

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final AiStudioCacheRepository aiStudioCacheRepository;
    private final GeminiService geminiService;
    private final PromptEngineService promptEngineService;
    private final AiDocumentAccessService aiDocumentAccessService;
    private final Gson gson = new Gson();

    private String getContextFromDocuments(List<Long> documentIds) {
        if (documentIds == null || documentIds.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        sb.append("<document_context>\n");
        Set<String> seenChunkContents = new HashSet<>();
        int maxContextChars = 15000;

        for (Long docId : documentIds) {
            if (docId == null) continue;
            Document doc = documentRepository.findById(docId).orElse(null);
            if (doc == null || Boolean.TRUE.equals(doc.getDeleted())) {
                continue;
            }

            List<DocumentChunk> chunks = documentChunkRepository.findByDocumentId(docId);
            if (chunks != null && !chunks.isEmpty()) {
                for (DocumentChunk chunk : chunks) {
                    if (chunk.getContent() == null) continue;
                    String rawContent = chunk.getContent().trim();
                    if (rawContent.isEmpty()) continue;

                    if (seenChunkContents.contains(rawContent)) {
                        continue;
                    }
                    seenChunkContents.add(rawContent);

                    String sanitizedContent = sanitizeChunkContent(rawContent);

                    String chunkBlock = String.format("  <source id=\"%d\" title=\"%s\" chunk=\"%d\">\n    %s\n  </source>\n",
                            docId,
                            sanitizeAttribute(doc.getTitle() != null ? doc.getTitle() : "Untitled"),
                            chunk.getChunkIndex() != null ? chunk.getChunkIndex() : 0,
                            sanitizedContent);

                    if (sb.length() + chunkBlock.length() > maxContextChars) {
                        int remaining = maxContextChars - sb.length();
                        if (remaining > 100) {
                            sb.append(chunkBlock, 0, remaining).append("\n... [Context truncated]");
                        }
                        sb.append("</document_context>");
                        return sb.toString();
                    }

                    sb.append(chunkBlock);
                }
            }
        }
        sb.append("</document_context>");
        return sb.toString();
    }

    private String sanitizeChunkContent(String text) {
        if (text == null) return "";
        String cleaned = text.replaceAll("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]", "");
        return cleaned.replace("<document_context>", "&lt;document_context&gt;")
                      .replace("</document_context>", "&lt;/document_context&gt;")
                      .replace("</source>", "&lt;/source&gt;");
    }

    private String sanitizeAttribute(String attr) {
        if (attr == null) return "";
        return attr.replace("\"", "&quot;").replace("<", "&lt;").replace(">", "&gt;");
    }

    public String generateCacheKey(
            List<Long> documentIds,
            String featureType,
            String language,
            String difficulty,
            Integer count
    ) {
        Long userId = null;
        try {
            userId = aiDocumentAccessService.getCurrentUserId();
        } catch (Exception e) {
            // Unauthenticated context fallback
        }

        List<Long> sortedIds = (documentIds == null) ? Collections.emptyList() :
                documentIds.stream().filter(Objects::nonNull).sorted().collect(Collectors.toList());

        long maxUpdatedAt = 0L;
        for (Long docId : sortedIds) {
            Document doc = documentRepository.findById(docId).orElse(null);
            if (doc != null && doc.getUpdatedAt() != null) {
                long ts = doc.getUpdatedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
                if (ts > maxUpdatedAt) {
                    maxUpdatedAt = ts;
                }
            }
        }

        String promptCode = getPromptCodeForFeature(featureType);
        String promptVersion = "docs-v1";
        String model = "gemini-1.5-flash";

        String rawIdentity = String.format(
                "user:%s|docs:%s|feature:%s|lang:%s|diff:%s|count:%s|promptCode:%s|promptVer:%s|model:%s|docTime:%d",
                userId != null ? userId.toString() : "ANONYMOUS",
                sortedIds.toString(),
                featureType != null ? featureType : "",
                language != null ? language.trim().toLowerCase() : "vi",
                difficulty != null ? difficulty.trim().toLowerCase() : "",
                count != null ? count.toString() : "",
                promptCode,
                promptVersion,
                model,
                maxUpdatedAt
        );

        return sha256Hex(rawIdentity);
    }

    private String getPromptCodeForFeature(String featureType) {
        if (featureType == null) return "UNKNOWN";
        if (featureType.startsWith("summary")) return "DOCUMENT_SUMMARY";
        if (featureType.startsWith("mindmap")) return "MINDMAP_GENERATION";
        if (featureType.startsWith("infographic")) return "SLIDE_GENERATION";
        if (featureType.startsWith("flashcard")) return "FLASHCARD_GENERATION";
        if (featureType.startsWith("quiz")) return "QUIZ_GENERATION";
        if (featureType.startsWith("faq")) return "FAQ_GENERATION";
        return featureType.toUpperCase();
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : digest) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 digest creation failed", e);
        }
    }

    private void saveToCache(String cacheKey, String featureType, String language, Object responseObj) {
        try {
            String jsonResponse = gson.toJson(responseObj);
            Optional<AiStudioCache> existing = aiStudioCacheRepository.findByCacheKeyAndFeatureTypeAndLanguage(cacheKey, featureType, language);
            if (existing.isPresent()) {
                AiStudioCache cache = existing.get();
                cache.setCachedResponse(jsonResponse);
                aiStudioCacheRepository.save(cache);
            } else {
                AiStudioCache cache = AiStudioCache.builder()
                        .cacheKey(cacheKey)
                        .featureType(featureType)
                        .language(language)
                        .cachedResponse(jsonResponse)
                        .build();
                aiStudioCacheRepository.save(cache);
            }
        } catch (Exception e) {
            log.warn("Failed to save response to cache: {}", e.getMessage());
        }
    }

    private String cleanMarkdownJson(String json) {
        if (json == null) return "";
        String trimmed = json.trim();
        if (trimmed.startsWith("```")) {
            int firstLineEnd = trimmed.indexOf('\n');
            int lastFence = trimmed.lastIndexOf("```");
            if (firstLineEnd != -1 && lastFence > firstLineEnd) {
                return trimmed.substring(firstLineEnd + 1, lastFence).trim();
            }
        }
        return trimmed;
    }

    // --- SUMMARY ---

    @Override
    public StudioSummaryResponse generateSummary(List<Long> documentIds, String language) {
        return generateSummary(documentIds, language, false);
    }

    public StudioSummaryResponse generateSummary(List<Long> documentIds, String language, boolean forceRegenerate) {
        String lang = (language == null || language.trim().isEmpty()) ? "vi" : language.trim();
        String cacheKey = generateCacheKey(documentIds, "summary", lang, null, null);

        if (!forceRegenerate) {
            Optional<AiStudioCache> cached = aiStudioCacheRepository.findByCacheKeyAndFeatureTypeAndLanguage(cacheKey, "summary", lang);
            if (cached.isPresent()) {
                try {
                    return gson.fromJson(cached.get().getCachedResponse(), StudioSummaryResponse.class);
                } catch (Exception e) {
                    log.warn("Failed to read cached summary: {}", e.getMessage());
                }
            }
        }

        String context = getContextFromDocuments(documentIds);

        Map<String, Object> promptVars = new HashMap<>();
        promptVars.put("language", lang);
        promptVars.put("subject", "Studio Selected Documents");
        promptVars.put("title", "Studio Combined Documents");
        promptVars.put("content", context);

        com.lumiedu.user.entity.User currentUser = aiDocumentAccessService.getCurrentAuthenticatedUser();
        String userEmail = (currentUser != null && currentUser.getEmail() != null) ? currentUser.getEmail() : "user";

        PromptEngineExecutionResult execResult = promptEngineService.executePrompt(
                "DOCUMENT_SUMMARY",
                promptVars,
                currentUser,
                userEmail,
                "STUDIO_SUMMARY",
                cacheKey,
                "docs-v1",
                true
        );

        String rawContent = execResult.getContent();
        StudioSummaryResponse response;
        try {
            response = validateSummary(rawContent);
        } catch (Exception initialEx) {
            log.warn("Initial summary validation failed: {}. Attempting 1 repair.", initialEx.getMessage());
            try {
                String repairPrompt = "The following JSON summary response was invalid: " + initialEx.getMessage() + "\nFix formatting and return strictly valid JSON matching {\"summaryText\":\"...\",\"summaryBullets\":[\"...\"]}:\n" + rawContent;
                String repairedRaw = geminiService.generateContent(repairPrompt);
                response = validateSummary(repairedRaw);
            } catch (Exception repairEx) {
                throw AiApiException.badGateway("AI_RESPONSE_INVALID", "Failed to generate valid Summary: " + repairEx.getMessage());
            }
        }

        saveToCache(cacheKey, "summary", lang, response);
        return response;
    }

    private StudioSummaryResponse validateSummary(String rawJson) {
        String cleaned = cleanMarkdownJson(rawJson);
        JsonObject jsonObj = gson.fromJson(cleaned, JsonObject.class);
        String summaryText = null;
        if (jsonObj.has("summaryText")) {
            summaryText = jsonObj.get("summaryText").getAsString();
        } else if (jsonObj.has("summary")) {
            summaryText = jsonObj.get("summary").getAsString();
        }
        if (summaryText == null || summaryText.trim().isEmpty() || summaryText.toLowerCase().contains("no summary text generated")) {
            throw new IllegalArgumentException("Summary text is blank or invalid placeholder.");
        }
        List<String> bullets = new ArrayList<>();
        if (jsonObj.has("summaryBullets")) {
            JsonArray arr = jsonObj.getAsJsonArray("summaryBullets");
            for (int i = 0; i < arr.size(); i++) {
                String b = arr.get(i).getAsString();
                if (b != null && !b.trim().isEmpty()) bullets.add(b.trim());
            }
        } else if (jsonObj.has("keyBullets")) {
            JsonArray arr = jsonObj.getAsJsonArray("keyBullets");
            for (int i = 0; i < arr.size(); i++) {
                String b = arr.get(i).getAsString();
                if (b != null && !b.trim().isEmpty()) bullets.add(b.trim());
            }
        }
        if (bullets.isEmpty()) {
            throw new IllegalArgumentException("Summary key bullets list is empty.");
        }
        return new StudioSummaryResponse(summaryText.trim(), bullets);
    }

    // --- MINDMAP ---

    @Override
    public StudioMindmapResponse generateMindmap(List<Long> documentIds, String language) {
        return generateMindmap(documentIds, language, false);
    }

    public StudioMindmapResponse generateMindmap(List<Long> documentIds, String language, boolean forceRegenerate) {
        String lang = (language == null || language.trim().isEmpty()) ? "vi" : language.trim();
        String cacheKey = generateCacheKey(documentIds, "mindmap", lang, null, null);

        if (!forceRegenerate) {
            Optional<AiStudioCache> cached = aiStudioCacheRepository.findByCacheKeyAndFeatureTypeAndLanguage(cacheKey, "mindmap", lang);
            if (cached.isPresent()) {
                try {
                    return gson.fromJson(cached.get().getCachedResponse(), StudioMindmapResponse.class);
                } catch (Exception e) {
                    log.warn("Failed to read cached mindmap: {}", e.getMessage());
                }
            }
        }

        String context = getContextFromDocuments(documentIds);

        Map<String, Object> promptVars = new HashMap<>();
        promptVars.put("language", lang);
        promptVars.put("content", context);

        com.lumiedu.user.entity.User currentUser = aiDocumentAccessService.getCurrentAuthenticatedUser();
        String userEmail = (currentUser != null && currentUser.getEmail() != null) ? currentUser.getEmail() : "user";

        PromptEngineExecutionResult execResult = promptEngineService.executePrompt(
                "MINDMAP_GENERATION",
                promptVars,
                currentUser,
                userEmail,
                "STUDIO_MINDMAP",
                cacheKey,
                "docs-v1",
                true
        );

        String rawContent = execResult.getContent();
        StudioMindmapResponse response;
        try {
            response = validateMindmap(rawContent);
        } catch (Exception initialEx) {
            log.warn("Initial mindmap validation failed: {}. Attempting 1 repair.", initialEx.getMessage());
            try {
                String repairPrompt = "The following JSON mindmap response was invalid: " + initialEx.getMessage() + "\nFix formatting and return strictly valid JSON matching {\"mermaidCode\":\"mindmap\\n  root(...)\"}:\n" + rawContent;
                String repairedRaw = geminiService.generateContent(repairPrompt);
                response = validateMindmap(repairedRaw);
            } catch (Exception repairEx) {
                throw AiApiException.badGateway("AI_RESPONSE_INVALID", "Failed to generate valid Mindmap: " + repairEx.getMessage());
            }
        }

        saveToCache(cacheKey, "mindmap", lang, response);
        return response;
    }

    private StudioMindmapResponse validateMindmap(String rawJson) {
        String cleaned = cleanMarkdownJson(rawJson);
        JsonObject jsonObj = gson.fromJson(cleaned, JsonObject.class);
        if (!jsonObj.has("mermaidCode")) {
            throw new IllegalArgumentException("JSON missing 'mermaidCode' field.");
        }
        String code = jsonObj.get("mermaidCode").getAsString();
        if (code == null || code.trim().isEmpty() || !code.contains("mindmap")) {
            throw new IllegalArgumentException("Invalid or empty mermaid mindmap code.");
        }
        return new StudioMindmapResponse(code.trim());
    }

    // --- INFOGRAPHIC ---

    @Override
    public StudioInfographicResponse generateInfographic(List<Long> documentIds, String language) {
        return generateInfographic(documentIds, language, false);
    }

    public StudioInfographicResponse generateInfographic(List<Long> documentIds, String language, boolean forceRegenerate) {
        String lang = (language == null || language.trim().isEmpty()) ? "vi" : language.trim();
        String cacheKey = generateCacheKey(documentIds, "infographic", lang, null, null);

        if (!forceRegenerate) {
            Optional<AiStudioCache> cached = aiStudioCacheRepository.findByCacheKeyAndFeatureTypeAndLanguage(cacheKey, "infographic", lang);
            if (cached.isPresent()) {
                try {
                    return gson.fromJson(cached.get().getCachedResponse(), StudioInfographicResponse.class);
                } catch (Exception e) {
                    log.warn("Failed to read cached infographic: {}", e.getMessage());
                }
            }
        }

        String context = getContextFromDocuments(documentIds);

        Map<String, Object> promptVars = new HashMap<>();
        promptVars.put("language", lang);
        promptVars.put("content", context);

        com.lumiedu.user.entity.User currentUser = aiDocumentAccessService.getCurrentAuthenticatedUser();
        String userEmail = (currentUser != null && currentUser.getEmail() != null) ? currentUser.getEmail() : "user";

        PromptEngineExecutionResult execResult = promptEngineService.executePrompt(
                "SLIDE_GENERATION",
                promptVars,
                currentUser,
                userEmail,
                "STUDIO_INFOGRAPHIC",
                cacheKey,
                "docs-v1",
                true
        );

        String rawContent = execResult.getContent();
        StudioInfographicResponse response;
        try {
            response = validateInfographic(rawContent);
        } catch (Exception initialEx) {
            log.warn("Initial infographic validation failed: {}. Attempting 1 repair.", initialEx.getMessage());
            try {
                String repairPrompt = "The following JSON infographic response was invalid: " + initialEx.getMessage() + "\nFix formatting and return strictly valid JSON matching {\"title\":\"...\",\"subtitle\":\"...\",\"items\":[...]}:\n" + rawContent;
                String repairedRaw = geminiService.generateContent(repairPrompt);
                response = validateInfographic(repairedRaw);
            } catch (Exception repairEx) {
                throw AiApiException.badGateway("AI_RESPONSE_INVALID", "Failed to generate valid Infographic: " + repairEx.getMessage());
            }
        }

        saveToCache(cacheKey, "infographic", lang, response);
        return response;
    }

    private StudioInfographicResponse validateInfographic(String rawJson) {
        String cleaned = cleanMarkdownJson(rawJson);
        JsonObject jsonObj = gson.fromJson(cleaned, JsonObject.class);
        String title = jsonObj.has("title") ? jsonObj.get("title").getAsString() : null;
        String subtitle = jsonObj.has("subtitle") ? jsonObj.get("subtitle").getAsString() : null;
        if (title == null || title.trim().isEmpty() || subtitle == null || subtitle.trim().isEmpty()) {
            throw new IllegalArgumentException("Infographic title or subtitle is missing.");
        }

        if (!jsonObj.has("items")) {
            throw new IllegalArgumentException("Infographic items array missing.");
        }
        JsonArray arr = jsonObj.getAsJsonArray("items");
        if (arr == null || arr.size() == 0) {
            throw new IllegalArgumentException("Infographic items array is empty.");
        }

        List<InfographicItem> items = new ArrayList<>();
        for (int i = 0; i < arr.size(); i++) {
            JsonObject obj = arr.get(i).getAsJsonObject();
            String label = obj.has("label") ? obj.get("label").getAsString() : null;
            String value = obj.has("value") ? obj.get("value").getAsString() : null;
            String desc = obj.has("description") ? obj.get("description").getAsString() : null;
            if (label == null || label.trim().isEmpty() || value == null || value.trim().isEmpty() || desc == null || desc.trim().isEmpty()) {
                continue;
            }
            items.add(InfographicItem.builder()
                    .label(label.trim())
                    .value(value.trim())
                    .description(desc.trim())
                    .iconType(obj.has("iconType") ? obj.get("iconType").getAsString() : "lightbulb")
                    .build());
        }
        if (items.isEmpty()) {
            throw new IllegalArgumentException("No valid infographic items remained after validation.");
        }
        return new StudioInfographicResponse(title.trim(), subtitle.trim(), items);
    }

    // --- FLASHCARDS ---

    @Override
    public List<StudioFlashcardResponse> generateFlashcards(List<Long> documentIds, String language) {
        return generateFlashcards(documentIds, language, false);
    }

    public List<StudioFlashcardResponse> generateFlashcards(List<Long> documentIds, String language, boolean forceRegenerate) {
        String lang = (language == null || language.trim().isEmpty()) ? "vi" : language.trim();
        String cacheKey = generateCacheKey(documentIds, "flashcards", lang, null, null);

        if (!forceRegenerate) {
            Optional<AiStudioCache> cached = aiStudioCacheRepository.findByCacheKeyAndFeatureTypeAndLanguage(cacheKey, "flashcards", lang);
            if (cached.isPresent()) {
                try {
                    Type listType = new TypeToken<List<StudioFlashcardResponse>>() {}.getType();
                    return gson.fromJson(cached.get().getCachedResponse(), listType);
                } catch (Exception e) {
                    log.warn("Failed to read cached flashcards: {}", e.getMessage());
                }
            }
        }

        String context = getContextFromDocuments(documentIds);

        Map<String, Object> promptVars = new HashMap<>();
        promptVars.put("count", 5);
        promptVars.put("language", lang);
        promptVars.put("content", context);

        com.lumiedu.user.entity.User currentUser = aiDocumentAccessService.getCurrentAuthenticatedUser();
        String userEmail = (currentUser != null && currentUser.getEmail() != null) ? currentUser.getEmail() : "user";

        PromptEngineExecutionResult execResult = promptEngineService.executePrompt(
                "FLASHCARD_GENERATION",
                promptVars,
                currentUser,
                userEmail,
                "STUDIO_FLASHCARD",
                cacheKey,
                "docs-v1",
                true
        );

        String rawContent = execResult.getContent();
        List<StudioFlashcardResponse> list;
        try {
            list = validateFlashcards(rawContent);
        } catch (Exception initialEx) {
            log.warn("Initial flashcards validation failed: {}. Attempting 1 repair.", initialEx.getMessage());
            try {
                String repairPrompt = "The following JSON flashcard response was invalid: " + initialEx.getMessage() + "\nFix formatting and return strictly valid JSON matching {\"flashcards\":[{\"front\":\"...\",\"back\":\"...\"}]}:\n" + rawContent;
                String repairedRaw = geminiService.generateContent(repairPrompt);
                list = validateFlashcards(repairedRaw);
            } catch (Exception repairEx) {
                throw AiApiException.badGateway("AI_RESPONSE_INVALID", "Failed to generate valid Flashcards: " + repairEx.getMessage());
            }
        }

        saveToCache(cacheKey, "flashcards", lang, list);
        return list;
    }

    private List<StudioFlashcardResponse> validateFlashcards(String rawJson) {
        String cleaned = cleanMarkdownJson(rawJson);
        JsonObject jsonObj = gson.fromJson(cleaned, JsonObject.class);
        if (!jsonObj.has("flashcards")) {
            throw new IllegalArgumentException("JSON missing 'flashcards' array.");
        }
        JsonArray arr = jsonObj.getAsJsonArray("flashcards");
        if (arr == null || arr.size() == 0) {
            throw new IllegalArgumentException("Flashcards array is empty.");
        }
        List<StudioFlashcardResponse> list = new ArrayList<>();
        Set<String> seenFronts = new HashSet<>();

        for (int i = 0; i < arr.size(); i++) {
            JsonObject item = arr.get(i).getAsJsonObject();
            String front = item.has("front") ? item.get("front").getAsString() : (item.has("question") ? item.get("question").getAsString() : null);
            String back = item.has("back") ? item.get("back").getAsString() : (item.has("answer") ? item.get("answer").getAsString() : null);
            if (front == null || front.trim().isEmpty() || back == null || back.trim().isEmpty()) {
                continue;
            }
            String normFront = front.trim().toLowerCase();
            if (seenFronts.contains(normFront)) {
                continue;
            }
            seenFronts.add(normFront);
            list.add(new StudioFlashcardResponse(front.trim(), back.trim()));
        }

        if (list.isEmpty()) {
            throw new IllegalArgumentException("No valid non-duplicate flashcards remained after validation.");
        }
        return list;
    }

    // --- QUIZ ---

    @Override
    public List<StudioQuizResponse> generateQuiz(List<Long> documentIds, String difficulty, int count, String language) {
        return generateQuiz(documentIds, difficulty, count, language, false);
    }

    public List<StudioQuizResponse> generateQuiz(List<Long> documentIds, String difficulty, int count, String language, boolean forceRegenerate) {
        String lang = (language == null || language.trim().isEmpty()) ? "vi" : language.trim();
        String diff = (difficulty != null && !difficulty.trim().isEmpty()) ? difficulty.trim().toLowerCase() : "medium";
        int requestedCount = count > 0 ? count : 5;

        String featureType = "quiz_" + diff + "_" + requestedCount;
        String cacheKey = generateCacheKey(documentIds, featureType, lang, diff, requestedCount);

        if (!forceRegenerate) {
            Optional<AiStudioCache> cached = aiStudioCacheRepository.findByCacheKeyAndFeatureTypeAndLanguage(cacheKey, featureType, lang);
            if (cached.isPresent()) {
                try {
                    Type listType = new TypeToken<List<StudioQuizResponse>>() {}.getType();
                    return gson.fromJson(cached.get().getCachedResponse(), listType);
                } catch (Exception e) {
                    log.warn("Failed to read cached quiz: {}", e.getMessage());
                }
            }
        }

        String context = getContextFromDocuments(documentIds);

        Map<String, Object> promptVars = new HashMap<>();
        promptVars.put("count", requestedCount);
        promptVars.put("difficulty", diff);
        promptVars.put("language", lang);
        promptVars.put("content", context);

        com.lumiedu.user.entity.User currentUser = aiDocumentAccessService.getCurrentAuthenticatedUser();
        String userEmail = (currentUser != null && currentUser.getEmail() != null) ? currentUser.getEmail() : "user";

        PromptEngineExecutionResult execResult = promptEngineService.executePrompt(
                "QUIZ_GENERATION",
                promptVars,
                currentUser,
                userEmail,
                "STUDIO_QUIZ",
                cacheKey,
                "docs-v1",
                true
        );

        String rawContent = execResult.getContent();
        List<StudioQuizResponse> list;
        try {
            list = validateQuiz(rawContent, requestedCount);
        } catch (Exception initialEx) {
            log.warn("Initial quiz validation failed: {}. Attempting 1 repair.", initialEx.getMessage());
            try {
                String repairPrompt = "The following JSON quiz response was invalid: " + initialEx.getMessage() + "\nFix options (must be exactly 4 non-blank options), correct answer index (0,1,2,3), explanation and return valid JSON:\n" + rawContent;
                String repairedRaw = geminiService.generateContent(repairPrompt);
                list = validateQuiz(repairedRaw, requestedCount);
            } catch (Exception repairEx) {
                throw AiApiException.badGateway("AI_RESPONSE_INVALID", "Failed to generate valid Quiz: " + repairEx.getMessage());
            }
        }

        saveToCache(cacheKey, featureType, lang, list);
        return list;
    }

    private List<StudioQuizResponse> validateQuiz(String rawJson, int requestedCount) {
        String cleaned = cleanMarkdownJson(rawJson);
        JsonObject jsonObj = gson.fromJson(cleaned, JsonObject.class);

        JsonArray arr = null;
        if (jsonObj.has("questions")) {
            arr = jsonObj.getAsJsonArray("questions");
        } else if (jsonObj.has("quiz")) {
            arr = jsonObj.getAsJsonArray("quiz");
        } else if (jsonObj.has("data")) {
            arr = jsonObj.getAsJsonArray("data");
        }

        if (arr == null || arr.size() == 0) {
            throw new IllegalArgumentException("Quiz questions array is missing or empty.");
        }

        List<StudioQuizResponse> list = new ArrayList<>();
        Set<String> seenQuestions = new HashSet<>();

        for (int i = 0; i < arr.size(); i++) {
            JsonObject item = arr.get(i).getAsJsonObject();

            String question = null;
            if (item.has("question")) question = item.get("question").getAsString();
            else if (item.has("q")) question = item.get("q").getAsString();
            else if (item.has("title")) question = item.get("title").getAsString();

            if (question == null || question.trim().isEmpty()) continue;
            String normQ = question.trim().toLowerCase();
            if (seenQuestions.contains(normQ)) continue;

            JsonArray optsArr = null;
            if (item.has("options")) optsArr = item.getAsJsonArray("options");
            else if (item.has("choices")) optsArr = item.getAsJsonArray("choices");
            else if (item.has("answers")) optsArr = item.getAsJsonArray("answers");

            if (optsArr == null || optsArr.size() != 4) continue;

            List<String> options = new ArrayList<>();
            boolean invalidOpt = false;
            for (int j = 0; j < optsArr.size(); j++) {
                String opt = optsArr.get(j).getAsString();
                if (opt == null || opt.trim().isEmpty()) {
                    invalidOpt = true;
                    break;
                }
                options.add(opt.trim());
            }
            if (invalidOpt || options.size() != 4) continue;

            Integer correctAns = null;
            com.google.gson.JsonElement ansElem = null;
            if (item.has("correctAnswer")) ansElem = item.get("correctAnswer");
            else if (item.has("answer")) ansElem = item.get("answer");
            else if (item.has("correct_answer")) ansElem = item.get("correct_answer");
            else if (item.has("answerIndex")) ansElem = item.get("answerIndex");
            else if (item.has("answer_index")) ansElem = item.get("answer_index");
            else if (item.has("correct")) ansElem = item.get("correct");

            if (ansElem != null && !ansElem.isJsonNull()) {
                try {
                    correctAns = ansElem.getAsInt();
                } catch (Exception ex) {
                    String strAns = ansElem.getAsString().trim();
                    String upperStr = strAns.toUpperCase();
                    if (upperStr.startsWith("A") || upperStr.equals("0")) correctAns = 0;
                    else if (upperStr.startsWith("B") || upperStr.equals("1")) correctAns = 1;
                    else if (upperStr.startsWith("C") || upperStr.equals("2")) correctAns = 2;
                    else if (upperStr.startsWith("D") || upperStr.equals("3")) correctAns = 3;
                    else {
                        for (int idx = 0; idx < options.size(); idx++) {
                            if (options.get(idx).equalsIgnoreCase(strAns)) {
                                correctAns = idx;
                                break;
                            }
                        }
                    }
                }
            }

            if (correctAns == null || correctAns < 0 || correctAns >= 4) {
                correctAns = 0;
            }

            String explanation = null;
            if (item.has("explanation")) explanation = item.get("explanation").getAsString();
            else if (item.has("explain")) explanation = item.get("explain").getAsString();
            else if (item.has("reason")) explanation = item.get("reason").getAsString();
            else if (item.has("details")) explanation = item.get("details").getAsString();

            if (explanation == null || explanation.trim().isEmpty()) {
                explanation = "Giải thích chi tiết cho đáp án đúng.";
            }

            seenQuestions.add(normQ);
            list.add(new StudioQuizResponse(question.trim(), options, correctAns, explanation.trim()));
        }

        if (list.isEmpty() || list.size() < Math.min(requestedCount, 1)) {
            throw new IllegalArgumentException("Quiz question count (" + list.size() + ") is insufficient for requested count (" + requestedCount + ").");
        }
        return list;
    }

    // --- FAQ ---

    @Override
    public List<StudioFaqResponse> generateFaq(List<Long> documentIds, String language) {
        return generateFaq(documentIds, language, false);
    }

    public List<StudioFaqResponse> generateFaq(List<Long> documentIds, String language, boolean forceRegenerate) {
        String lang = (language == null || language.trim().isEmpty()) ? "vi" : language.trim();
        String cacheKey = generateCacheKey(documentIds, "faq", lang, null, null);

        if (!forceRegenerate) {
            Optional<AiStudioCache> cached = aiStudioCacheRepository.findByCacheKeyAndFeatureTypeAndLanguage(cacheKey, "faq", lang);
            if (cached.isPresent()) {
                try {
                    Type listType = new TypeToken<List<StudioFaqResponse>>() {}.getType();
                    return gson.fromJson(cached.get().getCachedResponse(), listType);
                } catch (Exception e) {
                    log.warn("Failed to read cached FAQ: {}", e.getMessage());
                }
            }
        }

        String context = getContextFromDocuments(documentIds);

        Map<String, Object> promptVars = new HashMap<>();
        promptVars.put("language", lang);
        promptVars.put("content", context);

        com.lumiedu.user.entity.User currentUser = aiDocumentAccessService.getCurrentAuthenticatedUser();
        String userEmail = (currentUser != null && currentUser.getEmail() != null) ? currentUser.getEmail() : "user";

        PromptEngineExecutionResult execResult = promptEngineService.executePrompt(
                "FAQ_GENERATION",
                promptVars,
                currentUser,
                userEmail,
                "STUDIO_FAQ",
                cacheKey,
                "docs-v1",
                true
        );

        String rawContent = execResult.getContent();
        List<StudioFaqResponse> list;
        try {
            list = validateFaq(rawContent);
        } catch (Exception initialEx) {
            log.warn("Initial FAQ validation failed: {}. Attempting 1 repair.", initialEx.getMessage());
            try {
                String repairPrompt = "The following JSON FAQ response was invalid: " + initialEx.getMessage() + "\nFix formatting and return strictly valid JSON matching {\"faqs\":[{\"question\":\"...\",\"answer\":\"...\"}]}:\n" + rawContent;
                String repairedRaw = geminiService.generateContent(repairPrompt);
                list = validateFaq(repairedRaw);
            } catch (Exception repairEx) {
                throw AiApiException.badGateway("AI_RESPONSE_INVALID", "Failed to generate valid FAQ: " + repairEx.getMessage());
            }
        }

        saveToCache(cacheKey, "faq", lang, list);
        return list;
    }

    private List<StudioFaqResponse> validateFaq(String rawJson) {
        String cleaned = cleanMarkdownJson(rawJson);
        JsonArray arr = null;
        try {
            JsonObject jsonObj = gson.fromJson(cleaned, JsonObject.class);
            if (jsonObj.has("faqs")) {
                arr = jsonObj.getAsJsonArray("faqs");
            }
        } catch (Exception ex) {
            arr = gson.fromJson(cleaned, JsonArray.class);
        }
        if (arr == null || arr.size() == 0) {
            throw new IllegalArgumentException("FAQ array is empty or missing.");
        }
        List<StudioFaqResponse> list = new ArrayList<>();
        Set<String> seenQs = new HashSet<>();

        for (int i = 0; i < arr.size(); i++) {
            JsonObject item = arr.get(i).getAsJsonObject();
            String q = item.has("question") ? item.get("question").getAsString() : (item.has("q") ? item.get("q").getAsString() : null);
            String a = item.has("answer") ? item.get("answer").getAsString() : (item.has("a") ? item.get("a").getAsString() : null);
            if (q == null || q.trim().isEmpty() || a == null || a.trim().isEmpty()) continue;
            String normQ = q.trim().toLowerCase();
            if (seenQs.contains(normQ)) continue;
            seenQs.add(normQ);
            list.add(new StudioFaqResponse(q.trim(), a.trim()));
        }

        if (list.isEmpty()) {
            throw new IllegalArgumentException("No valid non-duplicate FAQs remained after validation.");
        }
        return list;
    }
}
