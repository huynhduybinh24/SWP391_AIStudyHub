package com.lumiedu.ai.service;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.lumiedu.ai.exception.AiApiException;
import com.lumiedu.ai.service.OpenAiService.ChatMessageDto;
import com.lumiedu.ai.service.OpenAiService.OpenAiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class GeminiService {

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.primary-model:gemini-3.1-flash-lite}")
    private String primaryModel;

    @Value("${gemini.fallback-model:gemini-3.5-flash-lite}")
    private String fallbackModel;

    @Value("${gemini.embedding-model:gemini-embedding-001}")
    private String embeddingModel;

    private static final int MAX_RETRIES = 3;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();
    private final Gson gson = new Gson();

    private final List<String> apiKeys = new ArrayList<>();
    private int currentKeyIndex = 0;

    private synchronized void initKeys() {
        if (apiKeys.isEmpty() && apiKey != null && !apiKey.trim().isEmpty()) {
            String[] parts = apiKey.split(",");
            for (String part : parts) {
                String trimmed = part.trim();
                if (!trimmed.isEmpty() && !"mock-key".equalsIgnoreCase(trimmed) && !"mock-gemini-key".equalsIgnoreCase(trimmed)) {
                    apiKeys.add(trimmed);
                }
            }
        }
    }

    private synchronized String getActiveKey() {
        initKeys();
        if (apiKeys.isEmpty()) {
            return null;
        }
        return apiKeys.get(currentKeyIndex % apiKeys.size());
    }

    private synchronized void rotateKey() {
        initKeys();
        if (apiKeys.size() > 1) {
            currentKeyIndex = (currentKeyIndex + 1) % apiKeys.size();
            log.info("[Gemini Key Rotation] Rotated key index to {}", currentKeyIndex);
        }
    }

    private String maskKey(String key) {
        if (key == null || key.length() < 6) return "key-***";
        return key.substring(0, 3) + "***" + key.substring(key.length() - 3);
    }

    public String generateContent(String prompt) {
        List<ChatMessageDto> messages = new ArrayList<>();
        messages.add(new ChatMessageDto("user", prompt != null ? prompt : ""));
        OpenAiResponse response = chat(messages, false);
        return response != null ? response.getContent() : "";
    }

    public OpenAiResponse chat(List<ChatMessageDto> messages, boolean isJson) {
        String activeKey = getActiveKey();
        if (activeKey == null) {
            throw AiApiException.unauthorized("Gemini API key is not configured on the backend server.");
        }

        JsonObject requestBody = new JsonObject();
        String systemInstructionText = "";
        JsonArray contentsArray = new JsonArray();

        if (messages != null) {
            for (ChatMessageDto msg : messages) {
                if ("system".equalsIgnoreCase(msg.getRole())) {
                    systemInstructionText = msg.getContent();
                } else {
                    JsonObject contentObj = new JsonObject();
                    String role = "assistant".equalsIgnoreCase(msg.getRole()) ? "model" : "user";
                    contentObj.addProperty("role", role);

                    JsonArray partsArray = new JsonArray();
                    JsonObject partObj = new JsonObject();
                    partObj.addProperty("text", msg.getContent() != null ? msg.getContent() : "");
                    partsArray.add(partObj);
                    contentObj.add("parts", partsArray);

                    contentsArray.add(contentObj);
                }
            }
        }

        if (systemInstructionText != null && !systemInstructionText.isEmpty()) {
            JsonObject systemInstructionObj = new JsonObject();
            JsonArray partsArray = new JsonArray();
            JsonObject partObj = new JsonObject();
            partObj.addProperty("text", systemInstructionText);
            partsArray.add(partObj);
            systemInstructionObj.add("parts", partsArray);
            requestBody.add("systemInstruction", systemInstructionObj);
        }

        if (contentsArray.size() == 0) {
            JsonObject contentObj = new JsonObject();
            contentObj.addProperty("role", "user");
            JsonArray partsArray = new JsonArray();
            JsonObject partObj = new JsonObject();
            partObj.addProperty("text", "Please process request.");
            partsArray.add(partObj);
            contentObj.add("parts", partsArray);
            contentsArray.add(contentObj);
        }

        requestBody.add("contents", contentsArray);

        JsonObject generationConfig = new JsonObject();
        generationConfig.addProperty("temperature", 0.7);
        if (isJson) {
            generationConfig.addProperty("responseMimeType", "application/json");
        }
        requestBody.add("generationConfig", generationConfig);

        String requestBodyJson = gson.toJson(requestBody);

        // First attempt using primary model, fallback to secondary model if temporary error occurs
        try {
            return callGenerateContentApi(primaryModel, requestBodyJson);
        } catch (AiApiException e) {
            if (e.getStatus().is5xxServerError() || e.getStatus().value() == 429 || e.getStatus().value() == 504) {
                log.warn("[Gemini Primary Model Fallback] Primary model {} failed with status {}. Attempting fallback model {}",
                        primaryModel, e.getStatus().value(), fallbackModel);
                return callGenerateContentApi(fallbackModel, requestBodyJson);
            }
            throw e;
        }
    }

    private OpenAiResponse callGenerateContentApi(String selectedModel, String requestBodyJson) {
        String requestId = UUID.randomUUID().toString().substring(0, 8);
        long startTime = System.currentTimeMillis();

        initKeys();
        int keysAttemptedCount = 0;
        int maxKeyAttempts = Math.max(1, apiKeys.size());

        while (keysAttemptedCount < maxKeyAttempts) {
            String activeKey = getActiveKey();
            if (activeKey == null) {
                throw AiApiException.unauthorized("Gemini API key is not configured.");
            }

            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + selectedModel + ":generateContent?key=" + activeKey;
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBodyJson))
                    .timeout(Duration.ofSeconds(60))
                    .build();

            for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                try {
                    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                    int status = response.statusCode();
                    long duration = System.currentTimeMillis() - startTime;

                    if (status == 200) {
                        log.info("[Gemini Success] reqId={} key={} model={} status=200 duration={}ms",
                                requestId, maskKey(activeKey), selectedModel, duration);
                        return parseGenerateContentResponse(response.body());
                    }

                    log.warn("[Gemini Response Error] reqId={} key={} model={} status={} attempt={}/{}",
                            requestId, maskKey(activeKey), selectedModel, status, attempt, MAX_RETRIES);

                    if (status == 400) {
                        throw AiApiException.badRequest("AI_INVALID_REQUEST", "Gemini API rejected request format.");
                    }

                    if (status == 401 || status == 403) {
                        log.warn("[Gemini Auth Error] reqId={} status={}. Rotating API key.", requestId, status);
                        rotateKey();
                        break; // Try next key
                    }

                    if (status == 429) {
                        if (attempt < MAX_RETRIES) {
                            Thread.sleep(1000L * attempt);
                            continue;
                        } else {
                            throw AiApiException.rateLimited("Gemini API rate limit exceeded. Please try again shortly.");
                        }
                    }

                    if (status >= 500) {
                        if (attempt < MAX_RETRIES) {
                            Thread.sleep(2000L * attempt);
                            continue;
                        } else {
                            throw AiApiException.serviceUnavailable("AI_MODEL_UNAVAILABLE", "Gemini AI service is temporarily unavailable.");
                        }
                    }

                    throw AiApiException.badGateway("AI_RESPONSE_INVALID", "Gemini API returned unexpected status: " + status);

                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw AiApiException.gatewayTimeout("Gemini API execution was interrupted.");
                } catch (java.io.IOException ioe) {
                    log.warn("[Gemini Network Error] reqId={} attempt={}/{} error={}", requestId, attempt, MAX_RETRIES, ioe.getMessage());
                    if (attempt == MAX_RETRIES) {
                        throw AiApiException.gatewayTimeout("Gemini API connection timed out.");
                    }
                    try {
                        Thread.sleep(2000L * attempt);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw AiApiException.gatewayTimeout("Gemini API execution interrupted during retry.");
                    }
                }
            }

            keysAttemptedCount++;
        }

        throw AiApiException.unauthorized("All configured Gemini API keys failed authentication or rate limits.");
    }

    private OpenAiResponse parseGenerateContentResponse(String responseBody) {
        try {
            JsonObject responseJson = gson.fromJson(responseBody, JsonObject.class);
            JsonArray candidates = responseJson.getAsJsonArray("candidates");
            if (candidates == null || candidates.size() == 0) {
                throw AiApiException.badGateway("AI_RESPONSE_INVALID", "Gemini API response contained no candidates.");
            }

            JsonObject firstCandidate = candidates.get(0).getAsJsonObject();
            JsonObject contentObject = firstCandidate.getAsJsonObject("content");
            JsonArray parts = contentObject.getAsJsonArray("parts");
            if (parts == null || parts.size() == 0) {
                throw AiApiException.badGateway("AI_RESPONSE_INVALID", "Gemini API candidate contained no text parts.");
            }

            String rawContent = parts.get(0).getAsJsonObject().get("text").getAsString();

            // Sanitize raw text: remove internal <thought> tags to prevent leaking private reasoning
            String cleanContent = rawContent;
            if (rawContent.contains("<thought>") && rawContent.contains("</thought>")) {
                int start = rawContent.indexOf("<thought>");
                int end = rawContent.indexOf("</thought>");
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
                    .thought("Answer generated using the selected document context.")
                    .promptTokens(promptTokens)
                    .completionTokens(completionTokens)
                    .costEstimate(totalCost)
                    .build();

        } catch (AiApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("[Gemini Parsing Error] Failed to parse response", e);
            throw AiApiException.badGateway("AI_RESPONSE_INVALID", "Failed to parse AI provider response.");
        }
    }

    public float[] getEmbedding(String text) {
        String activeKey = getActiveKey();
        if (activeKey == null) {
            throw AiApiException.unauthorized("Gemini API key is not configured.");
        }

        JsonObject requestBody = new JsonObject();
        JsonObject contentObj = new JsonObject();
        JsonArray partsArray = new JsonArray();
        JsonObject partObj = new JsonObject();
        partObj.addProperty("text", text != null ? text : "");
        partsArray.add(partObj);
        contentObj.add("parts", partsArray);
        requestBody.add("content", contentObj);

        String requestBodyJson = gson.toJson(requestBody);
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + embeddingModel + ":embedContent?key=" + activeKey;

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBodyJson))
                .timeout(Duration.ofSeconds(30))
                .build();

        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                int status = response.statusCode();

                if (status == 200) {
                    JsonObject responseJson = gson.fromJson(response.body(), JsonObject.class);
                    JsonObject embeddingObj = responseJson.getAsJsonObject("embedding");
                    JsonArray valuesArray = embeddingObj.getAsJsonArray("values");

                    float[] vector = new float[valuesArray.size()];
                    for (int i = 0; i < valuesArray.size(); i++) {
                        vector[i] = valuesArray.get(i).getAsFloat();
                    }
                    return vector;
                }

                if (status == 400) {
                    throw AiApiException.badRequest("AI_INVALID_REQUEST", "Gemini embedding request invalid.");
                }

                if (status == 401 || status == 403) {
                    rotateKey();
                    activeKey = getActiveKey();
                    url = "https://generativelanguage.googleapis.com/v1beta/models/" + embeddingModel + ":embedContent?key=" + activeKey;
                    request = HttpRequest.newBuilder()
                            .uri(URI.create(url))
                            .header("Content-Type", "application/json")
                            .POST(HttpRequest.BodyPublishers.ofString(requestBodyJson))
                            .timeout(Duration.ofSeconds(30))
                            .build();
                    continue;
                }

                if (attempt < MAX_RETRIES) {
                    Thread.sleep(1000L * attempt);
                }

            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                throw AiApiException.gatewayTimeout("Gemini embedding execution interrupted.");
            } catch (java.io.IOException ioe) {
                if (attempt == MAX_RETRIES) {
                    throw AiApiException.gatewayTimeout("Gemini embedding network timeout.");
                }
            }
        }

        throw AiApiException.serviceUnavailable("AI_MODEL_UNAVAILABLE", "Failed to generate text embeddings from Gemini.");
    }
}
