package com.lumiedu.ai.service.impl;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.lumiedu.ai.service.OpenAiService.ChatMessageDto;
import com.lumiedu.ai.service.OpenAiService.OpenAiResponse;
import com.lumiedu.ai.service.GeminiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiServiceImpl {

    private final GeminiService geminiService;

    public String chat(String systemPrompt, String userMessage) {
        try {
            List<ChatMessageDto> messages = new ArrayList<>();
            if (systemPrompt != null && !systemPrompt.isEmpty()) {
                messages.add(new ChatMessageDto("system", systemPrompt));
            }
            messages.add(new ChatMessageDto("user", userMessage != null ? userMessage : ""));

            OpenAiResponse response = geminiService.chat(messages, true);
            if (response != null && response.getContent() != null) {
                return response.getContent();
            }
        } catch (Exception e) {
            log.warn("[GeminiServiceImpl] Gemini API query failed, utilizing fallback scan: {}", e.getMessage());
        }

        // Fallback moderation based on keywords
        log.info("[GeminiServiceImpl] Applying keyword-based content scan fallback...");
        String textLower = (userMessage != null ? userMessage : "").toLowerCase();

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
