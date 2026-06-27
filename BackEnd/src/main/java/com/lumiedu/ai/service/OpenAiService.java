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
                System.err.println("OpenAI API call failed with status code: " + response.statusCode() + ", body: " + response.body() + ". Delegating to Gemini...");
                return geminiService.chat(messages, isJson);
            }

            JsonObject responseJson = gson.fromJson(response.body(), JsonObject.class);
            JsonObject choiceObj = responseJson.getAsJsonArray("choices").get(0).getAsJsonObject();
            JsonObject messageObj = choiceObj.getAsJsonObject("message");
            String rawContent = messageObj.get("content").getAsString();

            JsonObject usageObj = responseJson.getAsJsonObject("usage");
            int promptTokens = usageObj.get("prompt_tokens").getAsInt();
            int completionTokens = usageObj.get("completion_tokens").getAsInt();

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
            System.err.println("Exception occurred during OpenAI API call: " + e.getMessage() + ". Delegating to Gemini...");
            return geminiService.chat(messages, isJson);
        }
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
