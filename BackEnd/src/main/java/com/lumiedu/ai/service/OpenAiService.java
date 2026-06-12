package com.lumiedu.ai.service;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
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
public class OpenAiService {

    @Value("${openai.api.key}")
    private String apiKey;

    private final GeminiService geminiService;

    public OpenAiService(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();
    private final Gson gson = new Gson();

    @Data
    @Builder
    public static class OpenAiResponse {
        private String content;
        private String thought;
        private int promptTokens;
        private int completionTokens;
        private BigDecimal costEstimate;
    }

    public OpenAiResponse chat(List<ChatMessageDto> messages, boolean isJson) {
        if (apiKey == null || apiKey.trim().isEmpty() || "mock-key".equalsIgnoreCase(apiKey)) {
            return geminiService.chat(messages, isJson);
        }

        try {
            JsonObject requestBody = new JsonObject();
            requestBody.addProperty("model", "gpt-4o-mini");

            JsonArray messagesArray = new JsonArray();
            for (ChatMessageDto msg : messages) {
                JsonObject msgObj = new JsonObject();
                msgObj.addProperty("role", msg.getRole());
                msgObj.addProperty("content", msg.getContent());
                messagesArray.add(msgObj);
            }
            requestBody.add("messages", messagesArray);
            requestBody.addProperty("temperature", 0.7);

            if (isJson) {
                JsonObject responseFormatObj = new JsonObject();
                responseFormatObj.addProperty("type", "json_object");
                requestBody.add("response_format", responseFormatObj);
            }

            String requestBodyJson = gson.toJson(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.openai.com/v1/chat/completions"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBodyJson))
                    .timeout(Duration.ofSeconds(60))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                System.err.println("OpenAI API call failed with status code: " + response.statusCode() + ", body: " + response.body());
                return generateMockResponse(messages, isJson);
            }

            JsonObject responseJson = gson.fromJson(response.body(), JsonObject.class);
            JsonObject choiceObj = responseJson.getAsJsonArray("choices").get(0).getAsJsonObject();
            JsonObject messageObj = choiceObj.getAsJsonObject("message");
            String rawContent = messageObj.get("content").getAsString();

            JsonObject usageObj = responseJson.getAsJsonObject("usage");
            int promptTokens = usageObj.get("prompt_tokens").getAsInt();
            int completionTokens = usageObj.get("completion_tokens").getAsInt();

            // Calculate cost for gpt-4o-mini:
            // Input: $0.150 / 1M tokens ($0.00000015 per token)
            // Output: $0.600 / 1M tokens ($0.00000060 per token)
            BigDecimal promptCost = BigDecimal.valueOf(promptTokens).multiply(new BigDecimal("0.00000015"));
            BigDecimal completionCost = BigDecimal.valueOf(completionTokens).multiply(new BigDecimal("0.00000060"));
            BigDecimal totalCost = promptCost.add(completionCost);

            // Parse reasoning steps/thought if wrapped inside <thought>...</thought>
            String thought = "";
            String cleanContent = rawContent;
            if (rawContent.contains("<thought>") && rawContent.contains("</thought>")) {
                int start = rawContent.indexOf("<thought>");
                int end = rawContent.indexOf("</thought>");
                thought = rawContent.substring(start + 9, end).trim();
                cleanContent = (rawContent.substring(0, start) + rawContent.substring(end + 10)).trim();
            }

            return OpenAiResponse.builder()
                    .content(cleanContent)
                    .thought(thought)
                    .promptTokens(promptTokens)
                    .completionTokens(completionTokens)
                    .costEstimate(totalCost)
                    .build();

        } catch (Exception e) {
            System.err.println("Exception occurred during OpenAI API call: " + e.getMessage());
            return generateMockResponse(messages, isJson);
        }
    }

    private OpenAiResponse generateMockResponse(List<ChatMessageDto> messages, boolean isJson) {
        // Fallback simulated response
        String userPrompt = "";
        for (int i = messages.size() - 1; i >= 0; i--) {
            if ("user".equalsIgnoreCase(messages.get(i).getRole())) {
                userPrompt = messages.get(i).getContent();
                break;
            }
        }

        String thought = "System is in Mock Mode. Simulating reasoning based on the prompt: \"" + userPrompt + "\"";
        String content;

        if (isJson) {
            if (userPrompt.toLowerCase().contains("quiz") || userPrompt.toLowerCase().contains("câu hỏi")) {
                content = "{\n" +
                        "  \"questions\": [\n" +
                        "    {\n" +
                        "      \"q\": \"Câu hỏi trắc nghiệm mô phỏng 1?\",\n" +
                        "      \"options\": [\"Đáp án A\", \"Đáp án B (Đúng)\", \"Đáp án C\", \"Đáp án D\"],\n" +
                        "      \"answer\": 1,\n" +
                        "      \"explain\": \"Giải thích chi tiết đáp án B là đúng vì đây là mock data.\"\n" +
                        "    },\n" +
                        "    {\n" +
                        "      \"q\": \"Câu hỏi trắc nghiệm mô phỏng 2?\",\n" +
                        "      \"options\": [\"Đáp án A (Đúng)\", \"Đáp án B\", \"Đáp án C\", \"Đáp án D\"],\n" +
                        "      \"answer\": 0,\n" +
                        "      \"explain\": \"Giải thích chi tiết đáp án A là đúng.\"\n" +
                        "    }\n" +
                        "  ]\n" +
                        "}";
            } else if (userPrompt.toLowerCase().contains("plan") || userPrompt.toLowerCase().contains("kế hoạch") || userPrompt.toLowerCase().contains("lộ trình")) {
                content = "{\n" +
                        "  \"title\": \"Lộ trình học tập thông minh (Mock AI)\",\n" +
                        "  \"subject\": \"General\",\n" +
                        "  \"planText\": \"### Tuần 1: Khởi động nền tảng\\n- Đọc chương 1 và làm quen thuật ngữ.\\n\\n### Tuần 2: Nâng cao kiến thức\\n- Thực hành các bài tập cơ bản và thảo luận nhóm.\\n\\n### Tuần 3: Ôn tập & Kiểm tra\\n- Làm bài thi thử và giải đáp thắc mắc.\"\n" +
                        "}";
            } else {
                content = "{\"reply\": \"Phản hồi mock dạng JSON cho: " + userPrompt + "\"}";
            }
        } else {
            if (userPrompt.toLowerCase().contains("tóm tắt") || userPrompt.toLowerCase().contains("summary")) {
                content = "### Bản Tóm Tắt Tài Liệu (Mock AI)\n\n" +
                        "Tài liệu này đề cập đến các khía cạnh cơ bản của chủ đề được yêu cầu. Dưới đây là các điểm chính:\n\n" +
                        "- **Nội dung 1:** Khái niệm cốt lõi của môn học.\n" +
                        "- **Nội dung 2:** Các biến số quan trọng và cách áp dụng thực tiễn.\n" +
                        "- **Nội dung 3:** Tổng kết và hướng phát triển tiếp theo.";
            } else {
                content = "Đây là phản hồi giả lập từ LumiEdu AI. Hiện tại hệ thống đang chạy ở chế độ Demo (Mock Mode) vì chưa có API Key OpenAI hợp lệ. Câu hỏi của bạn là: \"" + userPrompt + "\".";
            }
        }

        return OpenAiResponse.builder()
                .content(content)
                .thought(thought)
                .promptTokens(120)
                .completionTokens(250)
                .costEstimate(new BigDecimal("0.000168"))
                .build();
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class ChatMessageDto {
        private String role; // system, user, assistant
        private String content;
    }
}
