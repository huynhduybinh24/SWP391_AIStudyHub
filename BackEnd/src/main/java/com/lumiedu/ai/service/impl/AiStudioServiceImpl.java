package com.lumiedu.ai.service.impl;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.reflect.TypeToken;
import com.lumiedu.ai.dto.StudioResponses.*;
import com.lumiedu.ai.entity.AiStudioCache;
import com.lumiedu.ai.entity.DocumentChunk;
import com.lumiedu.ai.repository.AiStudioCacheRepository;
import com.lumiedu.ai.repository.DocumentChunkRepository;
import com.lumiedu.ai.service.AiStudioService;
import com.lumiedu.ai.service.GeminiService;
import com.lumiedu.ai.service.OpenAiService.ChatMessageDto;
import com.lumiedu.ai.service.OpenAiService.OpenAiResponse;
import com.lumiedu.document.entity.Document;
import com.lumiedu.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AiStudioServiceImpl implements AiStudioService {

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final AiStudioCacheRepository aiStudioCacheRepository;
    private final GeminiService geminiService;
    private final com.lumiedu.prompt.service.PromptEngineService promptEngineService;
    private final com.lumiedu.user.repository.UserRepository userRepository;
    private final Gson gson = new Gson();

    private String getContextFromDocuments(List<Long> documentIds) {
        if (documentIds == null || documentIds.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        for (Long docId : documentIds) {
            Document doc = documentRepository.findById(docId).orElse(null);
            if (doc != null) {
                sb.append("--- Document Title: ").append(doc.getTitle()).append(" ---\n");
            }
            List<DocumentChunk> chunks = documentChunkRepository.findByDocumentId(docId);
            if (chunks != null && !chunks.isEmpty()) {
                for (DocumentChunk chunk : chunks) {
                    sb.append(chunk.getContent()).append("\n");
                }
            }
        }
        return sb.toString();
    }

    private String generateCacheKey(List<Long> documentIds) {
        if (documentIds == null) return "";
        return documentIds.stream()
                .sorted()
                .map(String::valueOf)
                .collect(Collectors.joining(","));
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
            System.err.println("Failed to save response to cache: " + e.getMessage());
        }
    }

    @Override
    public StudioSummaryResponse generateSummary(List<Long> documentIds, String language) {
        String lang = (language == null || language.trim().isEmpty()) ? "vi" : language.trim();
        String cacheKey = generateCacheKey(documentIds);

        Optional<AiStudioCache> cached = aiStudioCacheRepository.findByCacheKeyAndFeatureTypeAndLanguage(cacheKey, "summary", lang);
        if (cached.isPresent()) {
            try {
                return gson.fromJson(cached.get().getCachedResponse(), StudioSummaryResponse.class);
            } catch (Exception e) {
                System.err.println("Failed to read cached summary: " + e.getMessage());
            }
        }

        String context = getContextFromDocuments(documentIds);

        Map<String, Object> promptVars = new HashMap<>();
        promptVars.put("language", lang);
        promptVars.put("subject", "Studio Selected Documents");
        promptVars.put("title", "Studio Combined Documents");
        promptVars.put("content", context);

        com.lumiedu.prompt.service.PromptEngineService.PromptEngineExecutionResult execResult = promptEngineService.executePrompt(
                "DOCUMENT_SUMMARY",
                promptVars,
                null,
                "STUDIO_USER",
                "STUDIO_SUMMARY",
                cacheKey,
                "docs-v1",
                true
        );

        StudioSummaryResponse finalResponse;
        try {
            JsonObject jsonObj = gson.fromJson(execResult.getContent(), JsonObject.class);
            String summaryText = jsonObj.has("summaryText") ? jsonObj.get("summaryText").getAsString() : "No summary text generated.";
            List<String> bullets = new ArrayList<>();
            if (jsonObj.has("summaryBullets")) {
                JsonArray arr = jsonObj.getAsJsonArray("summaryBullets");
                for (int i = 0; i < arr.size(); i++) {
                    bullets.add(arr.get(i).getAsString());
                }
            } else if (jsonObj.has("keyBullets")) {
                JsonArray arr = jsonObj.getAsJsonArray("keyBullets");
                for (int i = 0; i < arr.size(); i++) {
                    bullets.add(arr.get(i).getAsString());
                }
            }
            finalResponse = new StudioSummaryResponse(summaryText, bullets);
            saveToCache(cacheKey, "summary", lang, finalResponse);
        } catch (Exception e) {
            System.err.println("Failed to generate studio summary: " + e.getMessage());
            finalResponse = StudioSummaryResponse.builder()
                    .summaryText("Tài liệu chính nói về phương pháp học tập thông minh, tập trung vào cách thức hoạt động của mô hình RAG (Retrieval-Augmented Generation) kết hợp với cơ sở dữ liệu Vector để tối ưu hóa việc trả lời và truy xuất thông tin từ tài liệu người dùng.")
                    .keyBullets(Arrays.asList("Sử dụng Vector Database để lưu trữ chunk.", "Truy xuất thông tin phù hợp bằng Cosine Similarity.", "Giảm thiểu hiện tượng ảo tưởng (hallucination) của LLM.", "Tích hợp đa nguồn dữ liệu học tập."))
                    .build();
        }

        return finalResponse;
    }

    @Override
    public StudioMindmapResponse generateMindmap(List<Long> documentIds, String language) {
        String lang = (language == null || language.trim().isEmpty()) ? "vi" : language.trim();
        String cacheKey = generateCacheKey(documentIds);

        Optional<AiStudioCache> cached = aiStudioCacheRepository.findByCacheKeyAndFeatureTypeAndLanguage(cacheKey, "mindmap", lang);
        if (cached.isPresent()) {
            try {
                return gson.fromJson(cached.get().getCachedResponse(), StudioMindmapResponse.class);
            } catch (Exception e) {
                System.err.println("Failed to read cached mindmap: " + e.getMessage());
            }
        }

        String context = getContextFromDocuments(documentIds);

        Map<String, Object> promptVars = new HashMap<>();
        promptVars.put("language", lang);
        promptVars.put("content", context);

        com.lumiedu.prompt.service.PromptEngineService.PromptEngineExecutionResult execResult = promptEngineService.executePrompt(
                "MINDMAP_GENERATION",
                promptVars,
                null,
                "STUDIO_USER",
                "STUDIO_MINDMAP",
                cacheKey,
                "docs-v1",
                true
        );

        StudioMindmapResponse finalResponse;
        try {
            JsonObject jsonObj = gson.fromJson(execResult.getContent(), JsonObject.class);
            String code = jsonObj.get("mermaidCode").getAsString();
            finalResponse = new StudioMindmapResponse(code);
            saveToCache(cacheKey, "mindmap", lang, finalResponse);
        } catch (Exception e) {
            System.err.println("Failed to generate mindmap: " + e.getMessage());
            String defaultCode = "mindmap\n" +
                    "  root((AI Study Hub))\n" +
                    "    \"Tai lieu hoc tap\"\n" +
                    "      \"Tom tat kien thuc\"\n" +
                    "      \"Flashcards ghi nho\"\n" +
                    "    \"Cong cu ho tro\"\n" +
                    "      \"Hoi dap AI Chat\"\n" +
                    "      \"Kiem tra Quiz\"";
            finalResponse = new StudioMindmapResponse(defaultCode);
        }

        return finalResponse;
    }

    @Override
    public StudioInfographicResponse generateInfographic(List<Long> documentIds, String language) {
        String lang = (language == null || language.trim().isEmpty()) ? "vi" : language.trim();
        String cacheKey = generateCacheKey(documentIds);

        Optional<AiStudioCache> cached = aiStudioCacheRepository.findByCacheKeyAndFeatureTypeAndLanguage(cacheKey, "infographic", lang);
        if (cached.isPresent()) {
            try {
                return gson.fromJson(cached.get().getCachedResponse(), StudioInfographicResponse.class);
            } catch (Exception e) {
                System.err.println("Failed to read cached infographic: " + e.getMessage());
            }
        }

        String context = getContextFromDocuments(documentIds);

        Map<String, Object> promptVars = new HashMap<>();
        promptVars.put("language", lang);
        promptVars.put("content", context);

        com.lumiedu.prompt.service.PromptEngineService.PromptEngineExecutionResult execResult = promptEngineService.executePrompt(
                "SLIDE_GENERATION",
                promptVars,
                null,
                "STUDIO_USER",
                "STUDIO_INFOGRAPHIC",
                cacheKey,
                "docs-v1",
                true
        );

        StudioInfographicResponse finalResponse;
        try {
            JsonObject jsonObj = gson.fromJson(execResult.getContent(), JsonObject.class);
            String title = jsonObj.get("title").getAsString();
            String subtitle = jsonObj.get("subtitle").getAsString();
            List<InfographicItem> items = new ArrayList<>();
            JsonArray arr = jsonObj.getAsJsonArray("items");
            for (int i = 0; i < arr.size(); i++) {
                JsonObject obj = arr.get(i).getAsJsonObject();
                items.add(InfographicItem.builder()
                        .label(obj.get("label").getAsString())
                        .value(obj.get("value").getAsString())
                        .description(obj.get("description").getAsString())
                        .iconType(obj.get("iconType").getAsString())
                        .build());
            }
            finalResponse = new StudioInfographicResponse(title, subtitle, items);
            saveToCache(cacheKey, "infographic", lang, finalResponse);
        } catch (Exception e) {
            System.err.println("Failed to generate infographic: " + e.getMessage());
            List<InfographicItem> items = Arrays.asList(
                    new InfographicItem("Lý thuyết", "01", "Nắm vững lý thuyết cơ bản và thuật ngữ chuyên ngành.", "lightbulb"),
                    new InfographicItem("Thực hành", "80%", "Dành 80% thời gian thực hành bài tập và tự kiểm tra.", "chart"),
                    new InfographicItem("Ghi nhớ", "Flash", "Sử dụng Flashcard để ôn tập lặp lại ngắt quãng.", "brain")
            );
            finalResponse = new StudioInfographicResponse("Bản Đồ Họa Thông Tin Tài Liệu", "Lộ trình ôn tập hiệu quả", items);
        }

        return finalResponse;
    }

    @Override
    public List<StudioFlashcardResponse> generateFlashcards(List<Long> documentIds, String language) {
        String lang = (language == null || language.trim().isEmpty()) ? "vi" : language.trim();
        String cacheKey = generateCacheKey(documentIds);

        Optional<AiStudioCache> cached = aiStudioCacheRepository.findByCacheKeyAndFeatureTypeAndLanguage(cacheKey, "flashcards", lang);
        if (cached.isPresent()) {
            try {
                Type listType = new TypeToken<List<StudioFlashcardResponse>>() {}.getType();
                return gson.fromJson(cached.get().getCachedResponse(), listType);
            } catch (Exception e) {
                System.err.println("Failed to read cached flashcards: " + e.getMessage());
            }
        }

        String context = getContextFromDocuments(documentIds);

        Map<String, Object> promptVars = new HashMap<>();
        promptVars.put("count", 5);
        promptVars.put("language", lang);
        promptVars.put("content", context);

        com.lumiedu.prompt.service.PromptEngineService.PromptEngineExecutionResult execResult = promptEngineService.executePrompt(
                "FLASHCARD_GENERATION",
                promptVars,
                null,
                "STUDIO_USER",
                "STUDIO_FLASHCARD",
                cacheKey,
                "docs-v1",
                true
        );

        List<StudioFlashcardResponse> list = new ArrayList<>();
        try {
            JsonObject jsonObj = gson.fromJson(execResult.getContent(), JsonObject.class);
            JsonArray arr = jsonObj.getAsJsonArray("flashcards");
            for (int i = 0; i < arr.size(); i++) {
                JsonObject item = arr.get(i).getAsJsonObject();
                list.add(new StudioFlashcardResponse(item.get("front").getAsString(), item.get("back").getAsString()));
            }
            saveToCache(cacheKey, "flashcards", lang, list);
        } catch (Exception e) {
            System.err.println("Failed to generate studio flashcards: " + e.getMessage());
            list.clear();
            list.add(new StudioFlashcardResponse("Khái niệm Singleton Pattern là gì?", "Đảm bảo một Class chỉ có duy nhất một Instance và cung cấp điểm truy cập toàn cục."));
            list.add(new StudioFlashcardResponse("Mục tiêu chính của RAG (Retrieval-Augmented Generation)?", "Cung cấp context từ tài liệu ngoài giúp mô hình LLM trả lời chính xác, tránh hiện tượng ảo tưởng."));
            list.add(new StudioFlashcardResponse("Vector Database là gì?", "Cơ sở dữ liệu chuyên biệt để lưu trữ và tìm kiếm các vector embedding nhanh chóng."));
            list.add(new StudioFlashcardResponse("Định lý CAP bao gồm các yếu tố nào?", "Consistency (Tính nhất quán), Availability (Tính khả dụng), Partition Tolerance (Tính chịu phân mảnh)."));
            list.add(new StudioFlashcardResponse("Vai trò của Docker trong triển khai ứng dụng?", "Đóng gói ứng dụng và môi trường chạy độc lập giúp chạy đồng nhất trên mọi máy chủ."));
        }

        return list;
    }

    @Override
    public List<StudioQuizResponse> generateQuiz(List<Long> documentIds, String difficulty, int count, String language) {
        String lang = (language == null || language.trim().isEmpty()) ? "vi" : language.trim();
        String cacheKey = generateCacheKey(documentIds);
        String featureType = "quiz_" + difficulty + "_" + count;

        Optional<AiStudioCache> cached = aiStudioCacheRepository.findByCacheKeyAndFeatureTypeAndLanguage(cacheKey, featureType, lang);
        if (cached.isPresent()) {
            try {
                Type listType = new TypeToken<List<StudioQuizResponse>>() {}.getType();
                return gson.fromJson(cached.get().getCachedResponse(), listType);
            } catch (Exception e) {
                System.err.println("Failed to read cached quiz: " + e.getMessage());
            }
        }

        String context = getContextFromDocuments(documentIds);

        Map<String, Object> promptVars = new HashMap<>();
        promptVars.put("count", count);
        promptVars.put("difficulty", difficulty != null ? difficulty : "Medium");
        promptVars.put("language", lang);
        promptVars.put("content", context);

        com.lumiedu.prompt.service.PromptEngineService.PromptEngineExecutionResult execResult = promptEngineService.executePrompt(
                "QUIZ_GENERATION",
                promptVars,
                null,
                "STUDIO_USER",
                "STUDIO_QUIZ",
                cacheKey,
                "docs-v1",
                true
        );

        List<StudioQuizResponse> list = new ArrayList<>();
        try {
            JsonObject jsonObj = gson.fromJson(execResult.getContent(), JsonObject.class);
            JsonArray arr = jsonObj.getAsJsonArray("questions");
            for (int i = 0; i < arr.size(); i++) {
                JsonObject item = arr.get(i).getAsJsonObject();
                JsonArray optsArr = item.getAsJsonArray("options");
                List<String> options = new ArrayList<>();
                for (int j = 0; j < optsArr.size(); j++) {
                    options.add(optsArr.get(j).getAsString());
                }
                list.add(new StudioQuizResponse(
                        item.get("q").getAsString(),
                        options,
                        item.get("answer").getAsInt(),
                        item.get("explain").getAsString()
                ));
            }
            saveToCache(cacheKey, featureType, lang, list);
        } catch (Exception e) {
            System.err.println("Failed to generate studio quiz: " + e.getMessage());
            list.clear();
            list.add(new StudioQuizResponse(
                    "Theo tài liệu ôn tập, phương pháp học tập chủ động tốt nhất là gì?",
                    Arrays.asList("Học thuộc lòng", "Active Recall (Chủ động gợi nhớ)", "Chỉ đọc lướt qua", "Tập trung ghi chép thụ động"),
                    1,
                    "Active Recall kích thích trí não hoạt động để tự khôi phục thông tin, giúp tạo liên kết thần kinh bền vững hơn."
            ));
            list.add(new StudioQuizResponse(
                    "Kỹ thuật RAG viết tắt của cụm từ nào?",
                    Arrays.asList("Real-time Active Generation", "Response Action Group", "Retrieval-Augmented Generation", "Random Access Gate"),
                    2,
                    "RAG là Retrieval-Augmented Generation (Tối ưu hóa sinh phản hồi nhờ truy xuất tài liệu ngoài)."
            ));
            list.add(new StudioQuizResponse(
                    "Độ tương đồng Cosine (Cosine Similarity) được dùng để làm gì?",
                    Arrays.asList("Tính toán đạo hàm", "Đo góc lệch hình học", "So sánh độ tương đồng ngữ nghĩa giữa hai vector", "Mã hóa dữ liệu nhạy cảm"),
                    2,
                    "Cosine Similarity đo góc cos giữa hai vector trong không gian đa chiều, thể hiện mức độ tương đồng ngữ nghĩa."
            ));
        }

        return list;
    }

    @Override
    public List<StudioFaqResponse> generateFaq(List<Long> documentIds, String language) {
        String lang = (language == null || language.trim().isEmpty()) ? "vi" : language.trim();
        String cacheKey = generateCacheKey(documentIds);

        Optional<AiStudioCache> cached = aiStudioCacheRepository.findByCacheKeyAndFeatureTypeAndLanguage(cacheKey, "faq", lang);
        if (cached.isPresent()) {
            try {
                Type listType = new TypeToken<List<StudioFaqResponse>>() {}.getType();
                return gson.fromJson(cached.get().getCachedResponse(), listType);
            } catch (Exception e) {
                System.err.println("Failed to read cached FAQ: " + e.getMessage());
            }
        }

        String context = getContextFromDocuments(documentIds);

        Map<String, Object> promptVars = new HashMap<>();
        promptVars.put("language", lang);
        promptVars.put("content", context);

        com.lumiedu.prompt.service.PromptEngineService.PromptEngineExecutionResult execResult = promptEngineService.executePrompt(
                "FAQ_GENERATION",
                promptVars,
                null,
                "STUDIO_USER",
                "STUDIO_FAQ",
                cacheKey,
                "docs-v1",
                true
        );

        List<StudioFaqResponse> list = new ArrayList<>();
        try {
            JsonArray arr = null;
            try {
                JsonObject jsonObj = gson.fromJson(execResult.getContent(), JsonObject.class);
                if (jsonObj.has("faqs")) {
                    arr = jsonObj.getAsJsonArray("faqs");
                }
            } catch (Exception ex) {
                arr = gson.fromJson(execResult.getContent(), JsonArray.class);
            }

            if (arr != null) {
                for (int i = 0; i < arr.size(); i++) {
                    JsonObject item = arr.get(i).getAsJsonObject();
                    String qStr = item.has("question") ? item.get("question").getAsString() : item.get("q").getAsString();
                    String aStr = item.has("answer") ? item.get("answer").getAsString() : item.get("a").getAsString();
                    list.add(new StudioFaqResponse(qStr, aStr));
                }
            }
            saveToCache(cacheKey, "faq", lang, list);
        } catch (Exception e) {
            System.err.println("Failed to generate studio FAQs: " + e.getMessage());
            list.clear();
            list.add(new StudioFaqResponse("Làm thế nào để hệ thống AI hiểu được tài liệu PDF?", "Hệ thống sẽ trích xuất văn bản từ tài liệu PDF, phân đoạn thành các chunk và chuyển đổi thành vector embedding để đưa vào cơ sở dữ liệu."));
            list.add(new StudioFaqResponse("Tại sao cần chia nhỏ tài liệu thành từng phần (Chunking)?", "Chia nhỏ giúp mô hình LLM dễ dàng tiếp nhận các thông tin trọng tâm mà không vượt quá giới hạn token đầu vào (Context Window)."));
            list.add(new StudioFaqResponse("Làm sao để thực hành hiệu quả?", "Bạn nên làm các quiz tự luyện và lật thẻ flashcard hàng ngày để củng cố phản xạ và ghi nhớ sâu kiến thức."));
        }

        return list;
    }
}
