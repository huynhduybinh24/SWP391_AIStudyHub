package com.lumiedu.ai.service.impl;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.lumiedu.ai.service.DocumentChunkingService;
import com.lumiedu.ai.service.GeminiService;
import com.lumiedu.document.entity.Document;
import com.lumiedu.document.enums.DocumentStatus;
import com.lumiedu.document.repository.DocumentRepository;
import com.lumiedu.notification.service.EmailService;
import com.lumiedu.notification.service.NotificationService;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentChunkingServiceImpl implements DocumentChunkingService {

    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final GeminiService geminiService;
    private final DocumentRepository documentRepository;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Async
    @Override
    public void chunkAndIndexDocument(Document doc) {
        log.info("Starting asynchronous chunking, indexing and moderation for document: {}", doc.getId());

        // Introduce a small artificial delay of 5 seconds to allow the user to see the "🔍 Scanning..." state in the UI!
        try {
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        String fullText = extractText(doc);
        performAutoModeration(doc, fullText);

        // Perform other chunking and indexing logic if needed...
        log.info("Finished chunking and indexing for document: {}", doc.getId());
    }

    private String extractText(Document doc) {
        Path filePath = Paths.get(uploadDir, doc.getFileType().toLowerCase() + "s", doc.getFileName()).toAbsolutePath().normalize();
        File file = filePath.toFile();
        if (!file.exists()) {
            log.warn("File does not exist: {}", file.getAbsolutePath());
            return doc.getTitle() + " " + (doc.getDescription() != null ? doc.getDescription() : "");
        }

        String ext = getExtension(doc.getFileName()).toLowerCase();
        if ("txt".equals(ext)) {
            try {
                return Files.readString(filePath);
            } catch (IOException e) {
                log.error("Failed to read text file", e);
            }
        } else if ("pdf".equals(ext)) {
            try (PDDocument pdDoc = Loader.loadPDF(file)) {
                PDFTextStripper stripper = new PDFTextStripper();
                return stripper.getText(pdDoc);
            } catch (IOException e) {
                log.error("Failed to extract text from PDF", e);
            }
        }

        // Fallback
        return doc.getTitle() + " " + (doc.getDescription() != null ? doc.getDescription() : "");
    }

    private String getExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == filename.length() - 1) {
            return "";
        }
        return filename.substring(dotIndex + 1);
    }

    private void performAutoModeration(Document doc, String fullText) {
        log.info("Performing auto-moderation on document: {}", doc.getId());

        // Truncate to max 15,000 characters as requested
        String textToAnalyze = fullText;
        if (textToAnalyze.length() > 15000) {
            textToAnalyze = textToAnalyze.substring(0, 15000);
        }

        String systemPrompt = "Bạn là một AI kiểm duyệt nội dung tài liệu học tập của LumiEdu. "
                + "Nhiệm vụ của bạn là phân tích nội dung văn bản và phát hiện các vi phạm quy định học thuật hoặc nội dung không lành mạnh "
                + "(ví dụ: dịch vụ làm hộ bài thi, thi hộ, lộ đề thi, quảng cáo cờ bạc, cá độ, bạo lực, v.v.).\n"
                + "Hãy trả về kết quả dưới định dạng JSON duy nhất như sau:\n"
                + "{\n"
                + "  \"riskLevel\": \"SAFE\" | \"SUSPICIOUS\",\n"
                + "  \"reason\": \"Giải thích lý do chi tiết bằng tiếng Việt nếu phát hiện vi phạm\",\n"
                + "  \"confidenceScore\": 0.0 đến 1.0\n"
                + "}";

        try {
            String response = geminiService.chat(systemPrompt, textToAnalyze);
            log.info("AI Moderation response for doc {}: {}", doc.getId(), response);

            JsonObject json = JsonParser.parseString(response).getAsJsonObject();
            String riskLevel = json.get("riskLevel").getAsString();
            String reason = json.has("reason") ? json.get("reason").getAsString() : "";
            double confidenceScore = json.has("confidenceScore") ? json.get("confidenceScore").getAsDouble() : 1.0;

            // Fetch user info for notifications/emails
            User user = userRepository.findById(doc.getUserId()).orElse(null);
            String userEmail = user != null ? user.getEmail() : "user@example.com";

            if ("SAFE".equalsIgnoreCase(riskLevel)) {
                doc.setModerationStatus(DocumentStatus.APPROVED);
                doc.setModerationReason("Duyệt tự động bởi AI");
                documentRepository.save(doc);

                // Send notification & email
                notificationService.sendNotification(
                        doc.getUserId(),
                        "Tài liệu đã được duyệt tự động",
                        "Tài liệu '" + doc.getTitle() + "' của bạn đã vượt qua bộ quét bảo mật AI và sẵn sàng hoạt động công khai."
                );
                emailService.sendEmail(
                        userEmail,
                        "Tài liệu học tập được duyệt thành công - LumiEdu",
                        "Chào " + (user != null ? user.getFullName() : "bạn") + ",\n\n"
                                + "Tài liệu học tập '" + doc.getTitle() + "' của bạn đã vượt qua bộ quét bảo mật AI tự động thành công.\n"
                                + "Trạng thái: ĐÃ DUYỆT (APPROVED).\n\n"
                                + "Trân trọng,\nĐội ngũ LumiEdu."
                );
            } else {
                doc.setModerationStatus(DocumentStatus.PENDING_REVIEW);
                doc.setModerationReason("AI Content Warning: " + reason + " (Confidence: " + confidenceScore + ")");
                documentRepository.save(doc);

                // Send notification
                notificationService.sendNotification(
                        doc.getUserId(),
                        "Cảnh báo tài liệu nghi vấn",
                        "Tài liệu '" + doc.getTitle() + "' đang được giữ lại để kiểm duyệt thủ công do phát hiện nghi vấn: " + reason
                );
            }

        } catch (Exception e) {
            log.error("Error performing auto moderation on doc " + doc.getId(), e);
            // Technical failure: set to PENDING_REVIEW for manual check
            doc.setModerationStatus(DocumentStatus.PENDING_REVIEW);
            doc.setModerationReason("AI Moderation Technical Error: " + e.getMessage() + ". Đã chuyển sang duyệt thủ công.");
            documentRepository.save(doc);
        }
    }
}
