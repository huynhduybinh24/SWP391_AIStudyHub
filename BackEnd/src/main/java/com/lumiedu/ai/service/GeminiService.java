package com.lumiedu.ai.service;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.lumiedu.ai.service.OpenAiService.ChatMessageDto;
import com.lumiedu.ai.service.OpenAiService.OpenAiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private static final String MODEL_NAME = "gemini-2.5-flash";
    private static final int MAX_RETRIES = 3;
    private static final long RETRY_DELAY_MS = 3000;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();
    private final Gson gson = new Gson();

    public OpenAiResponse chat(List<ChatMessageDto> messages, boolean isJson) {
        if (apiKey == null || apiKey.trim().isEmpty() || "mock-key".equalsIgnoreCase(apiKey)) {
            return generateMockResponse(messages, isJson);
        }

        try {
            JsonObject requestBody = new JsonObject();
            
            String systemInstructionText = "";
            JsonArray contentsArray = new JsonArray();

            for (ChatMessageDto msg : messages) {
                if ("system".equalsIgnoreCase(msg.getRole())) {
                    systemInstructionText = msg.getContent();
                } else {
                    JsonObject contentObj = new JsonObject();
                    String role = "assistant".equalsIgnoreCase(msg.getRole()) ? "model" : "user";
                    contentObj.addProperty("role", role);
                    
                    JsonArray partsArray = new JsonArray();
                    JsonObject partObj = new JsonObject();
                    partObj.addProperty("text", msg.getContent());
                    partsArray.add(partObj);
                    contentObj.add("parts", partsArray);
                    
                    contentsArray.add(contentObj);
                }
            }

            if (!systemInstructionText.isEmpty()) {
                JsonObject systemInstructionObj = new JsonObject();
                JsonArray partsArray = new JsonArray();
                JsonObject partObj = new JsonObject();
                partObj.addProperty("text", systemInstructionText);
                partsArray.add(partObj);
                systemInstructionObj.add("parts", partsArray);
                requestBody.add("systemInstruction", systemInstructionObj);
            }

            requestBody.add("contents", contentsArray);

            JsonObject generationConfig = new JsonObject();
            generationConfig.addProperty("temperature", 0.7);
            if (isJson) {
                generationConfig.addProperty("responseMimeType", "application/json");
            }
            requestBody.add("generationConfig", generationConfig);

            String requestBodyJson = gson.toJson(requestBody);
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL_NAME + ":generateContent?key=" + apiKey;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBodyJson))
                    .timeout(Duration.ofSeconds(60))
                    .build();

            HttpResponse<String> response = null;
            for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() == 429) {
                    System.err.println("Gemini rate limited (429), attempt " + attempt + "/" + MAX_RETRIES + ". Retrying in " + RETRY_DELAY_MS + "ms...");
                    if (attempt < MAX_RETRIES) {
                        Thread.sleep(RETRY_DELAY_MS * attempt);
                    }
                } else {
                    break;
                }
            }

            if (response == null || response.statusCode() != 200) {
                System.err.println("Gemini API call failed with status code: " + (response != null ? response.statusCode() : "null") + ", body: " + (response != null ? response.body() : ""));
                return generateMockResponse(messages, isJson);
            }

            JsonObject responseJson = gson.fromJson(response.body(), JsonObject.class);
            JsonObject candidate = responseJson.getAsJsonArray("candidates").get(0).getAsJsonObject();
            JsonObject contentObject = candidate.getAsJsonObject("content");
            JsonObject partObject = contentObject.getAsJsonArray("parts").get(0).getAsJsonObject();
            String rawContent = partObject.get("text").getAsString();

            String thought = "";
            String cleanContent = rawContent;
            if (rawContent.contains("<thought>") && rawContent.contains("</thought>")) {
                int start = rawContent.indexOf("<thought>");
                int end = rawContent.indexOf("</thought>");
                thought = rawContent.substring(start + 9, end).trim();
                cleanContent = (rawContent.substring(0, start) + rawContent.substring(end + 10)).trim();
            }

            int promptTokens = 1500;
            int completionTokens = 500;
            if (responseJson.has("usageMetadata")) {
                JsonObject usageMetadata = responseJson.getAsJsonObject("usageMetadata");
                if (usageMetadata.has("promptTokenCount")) {
                    promptTokens = usageMetadata.get("promptTokenCount").getAsInt();
                }
                if (usageMetadata.has("candidatesTokenCount")) {
                    completionTokens = usageMetadata.get("candidatesTokenCount").getAsInt();
                }
            }

            BigDecimal promptCost = BigDecimal.valueOf(promptTokens).multiply(new BigDecimal("0.000000075"));
            BigDecimal completionCost = BigDecimal.valueOf(completionTokens).multiply(new BigDecimal("0.00000030"));
            BigDecimal totalCost = promptCost.add(completionCost);

            return OpenAiResponse.builder()
                    .content(cleanContent)
                    .thought(thought)
                    .promptTokens(promptTokens)
                    .completionTokens(completionTokens)
                    .costEstimate(totalCost)
                    .build();

        } catch (Exception e) {
            System.err.println("Exception occurred during Gemini API call: " + e.getMessage());
            return generateMockResponse(messages, isJson);
        }
    }

    private OpenAiResponse generateMockResponse(List<ChatMessageDto> messages, boolean isJson) {
        String systemInstruction = "";
        String userPrompt = "";
        for (ChatMessageDto msg : messages) {
            if ("system".equalsIgnoreCase(msg.getRole())) {
                systemInstruction = msg.getContent();
            } else if ("user".equalsIgnoreCase(msg.getRole())) {
                userPrompt = msg.getContent();
            }
        }

        String combined = (systemInstruction + " " + userPrompt).toLowerCase();
        String thought = "Simulated Gemini reasoning for prompt: \"" + userPrompt + "\"";
        String content;

        if (isJson) {
            if (combined.contains("summarytext") || combined.contains("keybullets")) {
                content = "{\n" +
                        "  \"summaryText\": \"Tài liệu tổng hợp các phương thức ôn tập khoa học và lộ trình tiếp cận kiến thức tối ưu cho sinh viên thông qua các công cụ học tập thông minh.\",\n" +
                        "  \"keyBullets\": [\n" +
                        "    \"Chủ động gợi nhớ (Active Recall) giúp cải thiện phản xạ và tăng khả năng ghi nhớ lâu dài.\",\n" +
                        "    \"Lặp lại ngắt quãng (Spaced Repetition) phân bổ thời gian ôn tập hợp lý.\",\n" +
                        "    \"Sử dụng sơ đồ tư duy (Mindmap) để trực quan hóa mối liên hệ giữa các khái niệm.\",\n" +
                        "    \"Thực hiện các bài test trắc nghiệm định kỳ để đánh giá lỗ hổng kiến thức.\",\n" +
                        "    \"Sử dụng thẻ flashcard để ôn tập nhanh mọi lúc mọi nơi.\"\n" +
                        "  ]\n" +
                        "}";
            } else if (combined.contains("mermaidcode")) {
                content = "{\n" +
                        "  \"mermaidCode\": \"mindmap\\n  root((AI Study Hub))\\n    \\\"Phuong phap\\\"\\n      \\\"Active Recall\\\"\\n      \\\"Spaced Repetition\\\"\\n    \\\"Cong cu\\\"\\n      Flashcards\\n      Quiz\\n      Mindmap\\n    \\\"Tai lieu\\\"\\n      PDF\\n      Video\\n      Audio\"\n" +
                        "}";
            } else if (combined.contains("infographic") || combined.contains("subtitle")) {
                content = "{\n" +
                        "  \"title\": \"Phương Pháp Học Tập Thông Minh\",\n" +
                        "  \"subtitle\": \"3 bước tối ưu hóa kết quả ôn tập hiệu quả với AI\",\n" +
                        "  \"items\": [\n" +
                        "    {\n" +
                        "      \"label\": \"Chuẩn bị\",\n" +
                        "      \"value\": \"Bước 1\",\n" +
                        "      \"description\": \"Tải lên tài liệu học tập của bạn dạng PDF, Audio hoặc Video để AI trích xuất nội dung cốt lõi.\",\n" +
                        "      \"iconType\": \"lightbulb\"\n" +
                        "    },\n" +
                        "    {\n" +
                        "      \"label\": \"Thực hành\",\n" +
                        "      \"value\": \"80%\",\n" +
                        "      \"description\": \"Thực hành ôn tập thông qua bộ Flashcard 3D và Quiz tự luận để nâng cao khả năng ghi nhớ.\",\n" +
                        "      \"iconType\": \"brain\"\n" +
                        "    },\n" +
                        "    {\n" +
                        "      \"label\": \"Đánh giá\",\n" +
                        "      \"value\": \"Sao vàng\",\n" +
                        "      \"description\": \"Theo dõi tiến trình học tập và xem sơ đồ tư duy để kết nối các chủ đề kiến thức lại với nhau.\",\n" +
                        "      \"iconType\": \"star\"\n" +
                        "    }\n" +
                        "  ]\n" +
                        "}";
            } else if (combined.contains("flashcard")) {
                content = "{\n" +
                        "  \"flashcards\": [\n" +
                        "    {\n" +
                        "      \"front\": \"Khái niệm Singleton Pattern là gì?\",\n" +
                        "      \"back\": \"Đảm bảo một Class chỉ có duy nhất một Instance và cung cấp điểm truy cập toàn cục.\"\n" +
                        "    },\n" +
                        "    {\n" +
                        "      \"front\": \"Mục tiêu chính của RAG (Retrieval-Augmented Generation)?\",\n" +
                        "      \"back\": \"Cung cấp context từ tài liệu ngoài giúp mô hình LLM trả lời chính xác, tránh hiện tượng ảo tưởng.\"\n" +
                        "    },\n" +
                        "    {\n" +
                        "      \"front\": \"Active Recall là gì?\",\n" +
                        "      \"back\": \"Phương pháp chủ động kích thích trí nhớ bằng cách tự đặt câu hỏi và trả lời.\"\n" +
                        "    },\n" +
                        "    {\n" +
                        "      \"front\": \"Spaced Repetition là gì?\",\n" +
                        "      \"back\": \"Kỹ thuật ôn tập ngắt quãng theo chu kỳ để giữ thông tin trong trí nhớ dài hạn.\"\n" +
                        "    },\n" +
                        "    {\n" +
                        "      \"front\": \"Phạm vi truy cập 'protected' trong Java là gì?\",\n" +
                        "      \"back\": \"Cho phép truy cập trong cùng package và các lớp con kế thừa từ nó ở package khác.\"\n" +
                        "    }\n" +
                        "  ]\n" +
                        "}";
            } else if (combined.contains("quiz") || combined.contains("questions")) {
                content = "{\n" +
                        "  \"questions\": [\n" +
                        "    {\n" +
                        "      \"q\": \"Thành phần nào trong Spring framework dùng để định nghĩa một REST controller?\",\n" +
                        "      \"options\": [\"@Controller\", \"@RestController\", \"@Service\", \"@Repository\"],\n" +
                        "      \"answer\": 1,\n" +
                        "      \"explain\": \"@RestController kết hợp @Controller và @ResponseBody để tự động chuyển đổi dữ liệu trả về thành JSON/XML.\"\n" +
                        "    },\n" +
                        "    {\n" +
                        "      \"q\": \"Phương pháp nào giúp ghi nhớ thông tin tốt nhất khi tự học?\",\n" +
                        "      \"options\": [\"Đọc đi đọc lại\", \"Tô đậm văn bản\", \"Active Recall (Chủ động gợi nhớ)\", \"Nghe thụ động\"],\n" +
                        "      \"answer\": 2,\n" +
                        "      \"explain\": \"Active Recall kích thích não bộ truy xuất thông tin tích cực, mang lại hiệu quả ghi nhớ vượt trội.\"\n" +
                        "    },\n" +
                        "    {\n" +
                        "      \"q\": \"Annotation nào dùng để cấu hình Dependency Injection tự động trong Spring?\",\n" +
                        "      \"options\": [\"@Inject\", \"@Autowired\", \"@Resource\", \"Cả 3 phương án trên đều đúng\"],\n" +
                        "      \"answer\": 3,\n" +
                        "      \"explain\": \"Cả @Autowired, @Inject (JSR-330) và @Resource (JSR-250) đều có thể được sử dụng để tiêm phụ thuộc trong Spring.\"\n" +
                        "    }\n" +
                        "  ]\n" +
                        "}";
            } else if (combined.contains("faq") || combined.contains("faqs")) {
                content = "{\n" +
                        "  \"faqs\": [\n" +
                        "    {\n" +
                        "      \"q\": \"Làm thế nào để sử dụng AI Chat hiệu quả?\",\n" +
                        "      \"a\": \"Đính kèm ít nhất một tài liệu nguồn và đặt câu hỏi cụ thể, AI sẽ trích dẫn thông tin trực tiếp từ nguồn đó.\"\n" +
                        "    },\n" +
                        "    {\n" +
                        "      \"q\": \"Mermaid.js dùng để làm gì?\",\n" +
                        "      \"a\": \"Là công cụ tạo sơ đồ, biểu đồ bằng mã text thô giúp render sơ đồ tư duy trực quan nhanh chóng.\"\n" +
                        "    },\n" +
                        "    {\n" +
                        "      \"q\": \"Lợi ích của việc đính kèm nhiều tài liệu nguồn?\",\n" +
                        "      \"a\": \"Cho phép so sánh đối chiếu kiến thức giữa nhiều chương trình học, sách giáo khoa hoặc ghi chú bài giảng khác nhau.\"\n" +
                        "    }\n" +
                        "  ]\n" +
                        "}";
            } else {
                content = "{\"reply\": \"Phản hồi giả lập từ Gemini cho: \" + userPrompt + \"\"}";
            }
        } else {
            content = "Đây là câu trả lời giả lập từ Gemini cho tài liệu của bạn. Câu hỏi: \"" + userPrompt + "\".";
        }

        return OpenAiResponse.builder()
                .content(content)
                .thought(thought)
                .promptTokens(200)
                .completionTokens(100)
                .costEstimate(new BigDecimal("0.0005"))
                .build();
    }

    public float[] getEmbedding(String text) {
        if (apiKey == null || apiKey.trim().isEmpty() || "mock-key".equalsIgnoreCase(apiKey)) {
            // Fallback: Generate a deterministic mock vector based on the text hash
            float[] mockVector = new float[768];
            int hash = text != null ? text.hashCode() : 0;
            for (int i = 0; i < mockVector.length; i++) {
                mockVector[i] = (float) Math.sin(hash + i);
            }
            return mockVector;
        }

        try {
            JsonObject requestBody = new JsonObject();
            JsonObject contentObj = new JsonObject();
            JsonArray partsArray = new JsonArray();
            JsonObject partObj = new JsonObject();
            partObj.addProperty("text", text);
            partsArray.add(partObj);
            contentObj.add("parts", partsArray);
            requestBody.add("content", contentObj);

            String requestBodyJson = gson.toJson(requestBody);
            String url = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=" + apiKey;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBodyJson))
                    .timeout(Duration.ofSeconds(30))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                System.err.println("Gemini Embedding API call failed: " + response.statusCode() + ", body: " + response.body());
                // Fallback
                float[] mockVector = new float[768];
                int hash = text != null ? text.hashCode() : 0;
                for (int i = 0; i < mockVector.length; i++) {
                    mockVector[i] = (float) Math.sin(hash + i);
                }
                return mockVector;
            }

            JsonObject responseJson = gson.fromJson(response.body(), JsonObject.class);
            JsonObject embeddingObj = responseJson.getAsJsonObject("embedding");
            JsonArray valuesArray = embeddingObj.getAsJsonArray("values");

            float[] vector = new float[valuesArray.size()];
            for (int i = 0; i < valuesArray.size(); i++) {
                vector[i] = valuesArray.get(i).getAsFloat();
            }
            return vector;
        } catch (Exception e) {
            System.err.println("Exception occurred during Gemini Embedding call: " + e.getMessage());
            // Fallback
            float[] mockVector = new float[768];
            int hash = text != null ? text.hashCode() : 0;
            for (int i = 0; i < mockVector.length; i++) {
                mockVector[i] = (float) Math.sin(hash + i);
            }
            return mockVector;
        }
    }
}
