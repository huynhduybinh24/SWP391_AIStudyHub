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
        if (apiKey == null || apiKey.trim().isEmpty() || "mock-key".equalsIgnoreCase(apiKey) || "mock-gemini-key".equalsIgnoreCase(apiKey)) {
            throw new RuntimeException("Gemini API key is not configured.");
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
            Exception lastException = null;
            for (int attempt = 1; attempt <= 3; attempt++) {
                try {
                    response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                    int status = response.statusCode();
                    if (status == 429 || (status >= 500 && status < 600)) {
                        String msg = status == 429 ? "rate limited (429)" : "server error (" + status + ")";
                        System.err.println("Gemini API call failed with " + msg + ", attempt " + attempt + "/3. Retrying...");
                        if (attempt < 3) {
                            Thread.sleep(3000L * attempt);
                            continue;
                        }
                    }
                    break;
                } catch (java.io.IOException | InterruptedException e) {
                    lastException = e;
                    System.err.println("Gemini network/timeout error, attempt " + attempt + "/3. Error: " + e.getMessage());
                    if (e instanceof InterruptedException) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Gemini call interrupted", e);
                    }
                    if (attempt < 3) {
                        try {
                            Thread.sleep(3000L * attempt);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            throw new RuntimeException("Gemini call interrupted during retry delay", ie);
                        }
                    }
                }
            }

            if (response == null || response.statusCode() != 200) {
                String errMsg = "Gemini API call failed. Status: " + (response != null ? response.statusCode() : "unknown");
                if (response != null && response.body() != null) {
                    errMsg += ", Body: " + response.body();
                }
                if (lastException != null) {
                    errMsg += ", Cause: " + lastException.getMessage();
                }
                throw new RuntimeException(errMsg);
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
            if (e instanceof RuntimeException) {
                throw (RuntimeException) e;
            }
            throw new RuntimeException("Exception occurred during Gemini API call: " + e.getMessage(), e);
        }
    }

    public float[] getEmbedding(String text) {
        if (apiKey == null || apiKey.trim().isEmpty() || "mock-key".equalsIgnoreCase(apiKey) || "mock-gemini-key".equalsIgnoreCase(apiKey)) {
            throw new RuntimeException("Gemini API key is not configured.");
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
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=" + apiKey;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBodyJson))
                    .timeout(Duration.ofSeconds(30))
                    .build();

            HttpResponse<String> response = null;
            Exception lastException = null;
            for (int attempt = 1; attempt <= 3; attempt++) {
                try {
                    response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                    int status = response.statusCode();
                    if (status == 429 || (status >= 500 && status < 600)) {
                        String msg = status == 429 ? "rate limited (429)" : "server error (" + status + ")";
                        System.err.println("Gemini Embedding API call failed with " + msg + ", attempt " + attempt + "/3. Retrying...");
                        if (attempt < 3) {
                            Thread.sleep(3000L * attempt);
                            continue;
                        }
                    }
                    break;
                } catch (java.io.IOException | InterruptedException e) {
                    lastException = e;
                    System.err.println("Gemini Embedding network/timeout error, attempt " + attempt + "/3. Error: " + e.getMessage());
                    if (e instanceof InterruptedException) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Gemini Embedding call interrupted", e);
                    }
                    if (attempt < 3) {
                        try {
                            Thread.sleep(3000L * attempt);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            throw new RuntimeException("Gemini Embedding call interrupted during retry delay", ie);
                        }
                    }
                }
            }

            if (response == null || response.statusCode() != 200) {
                String errMsg = "Gemini Embedding API call failed. Status: " + (response != null ? response.statusCode() : "unknown");
                if (response != null && response.body() != null) {
                    errMsg += ", Body: " + response.body();
                }
                if (lastException != null) {
                    errMsg += ", Cause: " + lastException.getMessage();
                }
                throw new RuntimeException(errMsg);
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
            if (e instanceof RuntimeException) {
                throw (RuntimeException) e;
            }
            throw new RuntimeException("Exception occurred during Gemini Embedding call: " + e.getMessage(), e);
        }
    }
}
