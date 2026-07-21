package com.lumiedu.ai.service.impl;

import com.google.gson.JsonObject;
import com.google.gson.JsonArray;
import com.google.gson.JsonParser;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

@Slf4j
@Service
public class GeminiServiceImpl {

    @Value("${gemini.api.key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public String chat(String systemPrompt, String userMessage) {
        if (apiKey != null && !apiKey.trim().isEmpty() && !"mock-gemini-key".equalsIgnoreCase(apiKey) && !"mock-key".equalsIgnoreCase(apiKey)) {
            try {
                log.info("Querying Google Gemini API for content moderation...");
                String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=" + apiKey;

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);

                // Build Request JSON structured according to Gemini API specs
                JsonObject requestBody = new JsonObject();
                
                JsonArray contentsArray = new JsonArray();
                JsonObject contentObj = new JsonObject();
                contentObj.addProperty("role", "user");
                
                JsonArray partsArray = new JsonArray();
                JsonObject partObj = new JsonObject();
                partObj.addProperty("text", systemPrompt + "\n\nUser Message / Text to evaluate:\n" + userMessage);
                partsArray.add(partObj);
                
                contentObj.add("parts", partsArray);
                contentsArray.add(contentObj);
                requestBody.add("contents", contentsArray);

                // Force response format as JSON
                JsonObject generationConfig = new JsonObject();
                generationConfig.addProperty("responseMimeType", "application/json");
                requestBody.add("generationConfig", generationConfig);

                HttpEntity<String> entity = new HttpEntity<>(requestBody.toString(), headers);
                String responseStr = restTemplate.postForObject(url, entity, String.class);

                JsonObject responseJson = JsonParser.parseString(responseStr).getAsJsonObject();
                JsonArray candidates = responseJson.getAsJsonArray("candidates");
                if (candidates != null && candidates.size() > 0) {
                    JsonObject firstCandidate = candidates.get(0).getAsJsonObject();
                    JsonObject content = firstCandidate.getAsJsonObject("content");
                    if (content != null) {
                        JsonArray parts = content.getAsJsonArray("parts");
                        if (parts != null && parts.size() > 0) {
                            return parts.get(0).getAsJsonObject().get("text").getAsString();
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Failed to query Gemini API, using keyword-based fallback. Error: " + e.getMessage(), e);
            }
        }

        // Fallback moderation based on keywords
        log.info("Applying keyword-based content scan fallback...");
        String textLower = userMessage.toLowerCase();
        
        boolean isSuspicious = textLower.contains("làm hộ bài thi") 
                || textLower.contains("thi hộ")
                || textLower.contains("quảng cáo cờ bạc")
                || textLower.contains("cá độ")
                || textLower.contains("hack tài khoản")
                || textLower.contains("crack phần mềm")
                || textLower.contains("lộ đề thi")
                || textLower.contains("phát tán vũ khí");

        if (isSuspicious) {
            String violationDetail = "Phát hiện từ khóa nghi vấn liên quan đến gian lận thi cử hoặc nội dung không lành mạnh.";
            String violationDetailEn = "Suspicious keyword detected related to academic dishonesty or inappropriate content.";
            if (textLower.contains("làm hộ bài thi") || textLower.contains("thi hộ")) {
                violationDetail = "Phát hiện dịch vụ thi hộ/làm hộ bài thi vi phạm quy chế học thuật.";
                violationDetailEn = "Cheating service / exam proxy service detected violating academic integrity.";
            } else if (textLower.contains("quảng cáo cờ bạc") || textLower.contains("cá độ")) {
                violationDetail = "Nội dung chứa quảng cáo cờ bạc hoặc cá độ trái phép.";
                violationDetailEn = "Content contains gambling or sports betting advertisement.";
            } else if (textLower.contains("lộ đề thi")) {
                violationDetail = "Phát hiện từ khóa liên quan đến rò rỉ đề thi.";
                violationDetailEn = "Detected keywords related to exam paper leaks.";
            }
            return String.format(
                "{\"riskLevel\": \"SUSPICIOUS\", \"reasonEn\": \"%s\", \"reasonVi\": \"%s\", \"confidenceScore\": 0.95}", 
                violationDetailEn, violationDetail
            );
        } else {
            return "{\"riskLevel\": \"SAFE\", \"reasonEn\": \"Approved automatically by keyword scan fallback.\", \"reasonVi\": \"Được duyệt tự động bằng bộ quét từ khóa dự phòng.\", \"confidenceScore\": 1.0}";
        }
    }
}
