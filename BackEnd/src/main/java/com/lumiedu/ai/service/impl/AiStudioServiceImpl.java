package com.lumiedu.ai.service.impl;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.lumiedu.ai.dto.StudioResponses.*;
import com.lumiedu.ai.entity.DocumentChunk;
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

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AiStudioServiceImpl implements AiStudioService {

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final GeminiService geminiService;
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
            for (int i = 0; i < Math.min(chunks.size(), 4); i++) {
                sb.append(chunks.get(i).getContent()).append("\n");
            }
            sb.append("\n");
        }
        return sb.toString();
    }

    @Override
    public StudioSummaryResponse generateSummary(List<Long> documentIds, String language) {
        String lang = (language == null || language.trim().isEmpty()) ? "vi" : language.trim();
        String context = getContextFromDocuments(documentIds);

        List<ChatMessageDto> messages = new ArrayList<>();
        messages.add(ChatMessageDto.builder()
                .role("system")
                .content("You are an educational AI assistant. Summarize the provided documents in the requested language: " + lang + ". "
                        + "You must respond with a JSON object containing exactly two fields: "
                        + "'summaryText' (a paragraph summary string) and "
                        + "'keyBullets' (a JSON array of key bullet points, max 5 bullets).")
                .build());
        messages.add(ChatMessageDto.builder()
                .role("user")
                .content("Documents Context:\n" + context)
                .build());

        OpenAiResponse response = geminiService.chat(messages, true);

        try {
            JsonObject jsonObj = gson.fromJson(response.getContent(), JsonObject.class);
            String summaryText = jsonObj.get("summaryText").getAsString();
            List<String> bullets = new ArrayList<>();
            JsonArray arr = jsonObj.getAsJsonArray("keyBullets");
            for (int i = 0; i < arr.size(); i++) {
                bullets.add(arr.get(i).getAsString());
            }
            return new StudioSummaryResponse(summaryText, bullets);
        } catch (Exception e) {
            System.err.println("Failed to parse studio summary: " + e.getMessage());
            return StudioSummaryResponse.builder()
                    .summaryText(response.getContent())
                    .keyBullets(Arrays.asList("Khái niệm nền tảng.", "Các chi tiết cốt lõi trong tài liệu.", "Các ứng dụng thực hành quan trọng."))
                    .build();
        }
    }

    @Override
    public StudioMindmapResponse generateMindmap(List<Long> documentIds, String language) {
        String lang = (language == null || language.trim().isEmpty()) ? "vi" : language.trim();
        String context = getContextFromDocuments(documentIds);

        List<ChatMessageDto> messages = new ArrayList<>();
        messages.add(ChatMessageDto.builder()
                .role("system")
                .content("You are an expert mind mapping AI. Generate a structural mind map in Mermaid.js syntax based on the documents. "
                        + "You must respond with a JSON object containing exactly one field: 'mermaidCode' (string). "
                        + "The mermaidCode MUST start with 'mindmap' and follow Mermaid mindmap syntax: \n"
                        + "mindmap\n"
                        + "  root((Chu de chinh))\n"
                        + "    \"Nhanh 1\"\n"
                        + "      \"Y phu 1a\"\n"
                        + "      \"Y phu 1b\"\n"
                        + "    \"Nhanh 2\"\n"
                        + "      \"Y phu 2a\"\n"
                        + "Any node label/text that contains spaces or special characters MUST be wrapped in double quotes (e.g., \"Nhanh 1\" instead of Nhanh 1) to avoid Mermaid parsing syntax errors. "
                        + "Do not use bracket characters like ( ) or [ ] inside labels unless it defines the node shape. "
                        + "Ensure proper indentation using spaces. Avoid using ```mermaid in the JSON value. Write labels in " + lang + ".")
                .build());
        messages.add(ChatMessageDto.builder()
                .role("user")
                .content("Context:\n" + context)
                .build());

        OpenAiResponse response = geminiService.chat(messages, true);

        try {
            JsonObject jsonObj = gson.fromJson(response.getContent(), JsonObject.class);
            String code = jsonObj.get("mermaidCode").getAsString();
            return new StudioMindmapResponse(code);
        } catch (Exception e) {
            System.err.println("Failed to parse mindmap JSON: " + e.getMessage());
            String defaultCode = "mindmap\n" +
                    "  root((AI Study Hub))\n" +
                    "    \"Tai lieu hoc tap\"\n" +
                    "      \"Tom tat kien thuc\"\n" +
                    "      \"Flashcards ghi nho\"\n" +
                    "    \"Cong cu ho tro\"\n" +
                    "      \"Hoi dap AI Chat\"\n" +
                    "      \"Kiem tra Quiz\"";
            return new StudioMindmapResponse(defaultCode);
        }
    }

    @Override
    public StudioInfographicResponse generateInfographic(List<Long> documentIds, String language) {
        String lang = (language == null || language.trim().isEmpty()) ? "vi" : language.trim();
        String context = getContextFromDocuments(documentIds);

        List<ChatMessageDto> messages = new ArrayList<>();
        messages.add(ChatMessageDto.builder()
                .role("system")
                .content("You are a graphic designer AI. Extract 3 to 5 core stats, steps, or numerical/key takeaways from the documents. "
                        + "You must respond with a JSON object containing:\n"
                        + "'title' (string, main infographic title in " + lang + "),\n"
                        + "'subtitle' (string, subtitle in " + lang + "),\n"
                        + "'items' (JSON array of objects, each object containing:\n"
                        + "  - 'label' (string, name of concept/step)\n"
                        + "  - 'value' (string, short stat or key value, e.g. '95%', 'Bước 1', '03 Lưu ý', 'Cốt lõi')\n"
                        + "  - 'description' (string, brief explanation of this value)\n"
                        + "  - 'iconType' (string, must be one of: 'brain', 'lightbulb', 'chart', 'star'))")
                .build());
        messages.add(ChatMessageDto.builder()
                .role("user")
                .content("Context:\n" + context)
                .build());

        OpenAiResponse response = geminiService.chat(messages, true);

        try {
            JsonObject jsonObj = gson.fromJson(response.getContent(), JsonObject.class);
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
            return new StudioInfographicResponse(title, subtitle, items);
        } catch (Exception e) {
            System.err.println("Failed to parse infographic: " + e.getMessage());
            List<InfographicItem> items = Arrays.asList(
                    new InfographicItem("Lý thuyết", "01", "Nắm vững lý thuyết cơ bản và thuật ngữ chuyên ngành.", "lightbulb"),
                    new InfographicItem("Thực hành", "80%", "Dành 80% thời gian thực hành bài tập và tự kiểm tra.", "chart"),
                    new InfographicItem("Ghi nhớ", "Flash", "Sử dụng Flashcard để ôn tập lặp lại ngắt quãng.", "brain")
            );
            return new StudioInfographicResponse("Bản Đồ Họa Thông Tin Tài Liệu", "Lộ trình ôn tập hiệu quả", items);
        }
    }

    @Override
    public List<StudioFlashcardResponse> generateFlashcards(List<Long> documentIds, String language) {
        String lang = (language == null || language.trim().isEmpty()) ? "vi" : language.trim();
        String context = getContextFromDocuments(documentIds);

        List<ChatMessageDto> messages = new ArrayList<>();
        messages.add(ChatMessageDto.builder()
                .role("system")
                .content("You are an educational AI assistant. Create 5 useful study flashcards based on the document text. "
                        + "You must respond with a JSON object containing a 'flashcards' array. "
                        + "Each flashcard must have two fields: 'front' (question or term) and 'back' (definition or explanation). Respond in " + lang + ".")
                .build());
        messages.add(ChatMessageDto.builder()
                .role("user")
                .content("Create flashcards based on this context:\n" + context)
                .build());

        OpenAiResponse response = geminiService.chat(messages, true);
        List<StudioFlashcardResponse> list = new ArrayList<>();

        try {
            JsonObject jsonObj = gson.fromJson(response.getContent(), JsonObject.class);
            JsonArray arr = jsonObj.getAsJsonArray("flashcards");
            for (int i = 0; i < arr.size(); i++) {
                JsonObject item = arr.get(i).getAsJsonObject();
                list.add(new StudioFlashcardResponse(item.get("front").getAsString(), item.get("back").getAsString()));
            }
        } catch (Exception e) {
            System.err.println("Failed to parse studio flashcards: " + e.getMessage());
            list.add(new StudioFlashcardResponse("Khái niệm Singleton Pattern là gì?", "Đảm bảo một Class chỉ có duy nhất một Instance và cung cấp điểm truy cập toàn cục."));
            list.add(new StudioFlashcardResponse("Mục tiêu chính của RAG (Retrieval-Augmented Generation)?", "Cung cấp context từ tài liệu ngoài giúp mô hình LLM trả lời chính xác, tránh hiện tượng ảo tưởng."));
        }

        return list;
    }

    @Override
    public List<StudioQuizResponse> generateQuiz(List<Long> documentIds, String difficulty, int count, String language) {
        String lang = (language == null || language.trim().isEmpty()) ? "vi" : language.trim();
        String context = getContextFromDocuments(documentIds);

        List<ChatMessageDto> messages = new ArrayList<>();
        messages.add(ChatMessageDto.builder()
                .role("system")
                .content("You are an educational AI assistant. Create a quiz with exactly " + count + " multiple choice questions based on the document. "
                        + "The difficulty level should be: " + difficulty + ". Respond in " + lang + ". "
                        + "You must respond with a JSON object containing a 'questions' array. "
                        + "Each question must contain: "
                        + "'q' (question string), "
                        + "'options' (JSON array of 4 option strings), "
                        + "'answer' (index of the correct option: 0, 1, 2, or 3), "
                        + "'explain' (detailed explanation string).")
                .build());
        messages.add(ChatMessageDto.builder()
                .role("user")
                .content("Create quiz for this context:\n" + context)
                .build());

        OpenAiResponse response = geminiService.chat(messages, true);
        List<StudioQuizResponse> list = new ArrayList<>();

        try {
            JsonObject jsonObj = gson.fromJson(response.getContent(), JsonObject.class);
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
        } catch (Exception e) {
            System.err.println("Failed to parse studio quiz: " + e.getMessage());
            list.add(new StudioQuizResponse(
                    "Theo tài liệu ôn tập, phương pháp học tập tốt nhất là gì?",
                    Arrays.asList("Học vẹt", "Active Recall (Chủ động gợi nhớ)", "Chỉ đọc lướt qua", "Không cần xem lại bài"),
                    1,
                    "Active Recall kích thích trí não hoạt động để khôi phục thông tin, giúp ghi nhớ lâu hơn."
            ));
        }

        return list;
    }

    @Override
    public List<StudioFaqResponse> generateFaq(List<Long> documentIds, String language) {
        String lang = (language == null || language.trim().isEmpty()) ? "vi" : language.trim();
        String context = getContextFromDocuments(documentIds);

        List<ChatMessageDto> messages = new ArrayList<>();
        messages.add(ChatMessageDto.builder()
                .role("system")
                .content("You are an academic counselor. Extract 5 common questions and answers (FAQs) that students are likely to ask about the provided documents. "
                        + "You must respond with a JSON object containing a 'faqs' array. "
                        + "Each FAQ must contain: 'q' (question string in " + lang + ") and 'a' (answer string in " + lang + ").")
                .build());
        messages.add(ChatMessageDto.builder()
                .role("user")
                .content("Context:\n" + context)
                .build());

        OpenAiResponse response = geminiService.chat(messages, true);
        List<StudioFaqResponse> list = new ArrayList<>();

        try {
            JsonObject jsonObj = gson.fromJson(response.getContent(), JsonObject.class);
            JsonArray arr = jsonObj.getAsJsonArray("faqs");
            for (int i = 0; i < arr.size(); i++) {
                JsonObject item = arr.get(i).getAsJsonObject();
                list.add(new StudioFaqResponse(item.get("q").getAsString(), item.get("a").getAsString()));
            }
        } catch (Exception e) {
            System.err.println("Failed to parse studio FAQs: " + e.getMessage());
            list.add(new StudioFaqResponse("Tài liệu chính nói về chủ đề gì?", "Tài liệu này tập trung hướng dẫn lập trình Java Spring Boot và các kỹ thuật AI RAG cơ bản."));
            list.add(new StudioFaqResponse("Làm sao để thực hành hiệu quả?", "Bạn nên làm các quiz tự luyện và lật thẻ flashcard hàng ngày để củng cố phản xạ."));
        }

        return list;
    }
}
