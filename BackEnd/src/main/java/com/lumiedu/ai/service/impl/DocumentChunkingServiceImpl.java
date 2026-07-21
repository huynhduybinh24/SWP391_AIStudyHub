package com.lumiedu.ai.service.impl;

import com.google.gson.Gson;
import com.lumiedu.ai.entity.DocumentChunk;
import com.lumiedu.ai.repository.DocumentChunkRepository;
import com.lumiedu.ai.service.DocumentChunkingService;
import com.lumiedu.ai.service.GeminiService;
import com.lumiedu.document.entity.Document;
import com.lumiedu.document.repository.DocumentRepository;
import com.lumiedu.document.service.GoogleDriveService;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.Set;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import com.lumiedu.user.repository.UserRepository;
import com.lumiedu.user.entity.User;
import com.lumiedu.notification.service.NotificationService;
import com.lumiedu.notification.dto.request.NotificationRequest;
import com.lumiedu.document.enums.DocumentStatus;

@Service
@RequiredArgsConstructor
@Transactional
public class DocumentChunkingServiceImpl implements DocumentChunkingService {

    @Value("${app.upload.dir}")
    private String uploadDir;

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final GoogleDriveService googleDriveService;
    private final GeminiService geminiService;
    private final GeminiServiceImpl geminiServiceImpl;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final Gson gson = new Gson();

    private final Set<Long> processingDocs = ConcurrentHashMap.newKeySet();

    @Override
    public boolean isProcessing(Long documentId) {
        return processingDocs.contains(documentId);
    }

    @Override
    @Async
    public void chunkAndIndexDocument(Long documentId) {
        if (!documentChunkRepository.findByDocumentId(documentId).isEmpty()) {
            System.out.println("Document " + documentId + " is already chunked and indexed. Skipping task.");
            return;
        }
        if (!processingDocs.add(documentId)) {
            System.out.println("Document " + documentId + " is already being processed. Skipping duplicate task.");
            return;
        }
        try {
            Document doc = documentRepository.findById(documentId).orElse(null);
            if (doc == null || doc.getDeleted()) {
                return;
            }

            // Delete existing chunks first
            documentChunkRepository.deleteByDocumentId(documentId);

            String fullText = "";
            try {
                if ("GOOGLE_DRIVE".equals(doc.getStorageProvider()) && doc.getGoogleDriveFileId() != null) {
                    // Tải file từ Google Drive để trích xuất text
                    fullText = extractTextFromGoogleDrive(doc);
                } else if (doc.getFileName() != null && !doc.getFileName().isEmpty()) {
                    Path filePath = Paths.get(uploadDir, "documents", doc.getFileName()).toAbsolutePath().normalize();
                    File file = filePath.toFile();
                    String ext = getExtension(doc.getFileName()).toLowerCase();
                    if (file.exists()) {
                        if ("pdf".equals(ext)) {
                            fullText = extractTextFromPdf(file);
                        } else if ("txt".equals(ext)) {
                            fullText = Files.readString(filePath);
                        }
                    } else {
                        System.err.println("File not found locally for chunking: " + filePath);
                    }
                }
            } catch (Exception e) {
                System.err.println("Failed to extract text from file: " + e.getMessage());
            }

            // Fallback: use document metadata when file is unavailable
            if (fullText == null || fullText.trim().isEmpty()) {
                StringBuilder fallback = new StringBuilder();
                if (doc.getTitle() != null) fallback.append("Tên tài liệu: ").append(doc.getTitle()).append("\n");
                if (doc.getSubject() != null) fallback.append("Môn học: ").append(doc.getSubject()).append("\n");
                if (doc.getDescription() != null && !doc.getDescription().isEmpty()) {
                    fallback.append("Mô tả: ").append(doc.getDescription()).append("\n");
                }
                fullText = fallback.toString().trim();
                System.out.println("Using metadata fallback for document: " + doc.getTitle());
            }

            // Perform Automated AI Moderation check
            performAutoModeration(doc, fullText);

            List<String> chunks = splitIntoChunks(fullText, 1000, 200);
            List<DocumentChunk> documentChunks = new ArrayList<>();
            for (int i = 0; i < chunks.size(); i++) {
                String chunkContent = chunks.get(i);
                float[] embeddingVector = geminiService.getEmbedding(chunkContent);
                String embeddingJson = gson.toJson(embeddingVector);

                documentChunks.add(DocumentChunk.builder()
                        .documentId(documentId)
                        .chunkIndex(i)
                        .content(chunkContent)
                        .embedding(embeddingJson)
                        .build());
            }

            documentChunkRepository.saveAll(documentChunks);
            System.out.println("Successfully chunked, embedded, and saved " + documentChunks.size() + " chunks for document: " + doc.getTitle());
        } finally {
            processingDocs.remove(documentId);
        }
    }

    private String extractTextFromGoogleDrive(Document doc) throws IOException {
        // Tải file tạm thời về local để trích xuất text
        String ext = getExtension(doc.getOriginalFileName() != null ? doc.getOriginalFileName() : "file.pdf").toLowerCase();
        Path tempFile = Paths.get(System.getProperty("java.io.tmpdir"), "lumiedu_chunk_" + UUID.randomUUID() + "." + ext);

        try {
            org.springframework.core.io.Resource resource = googleDriveService.downloadFile(doc.getGoogleDriveFileId());
            try (InputStream inputStream = resource.getInputStream()) {
                Files.copy(inputStream, tempFile, StandardCopyOption.REPLACE_EXISTING);
            }

            if ("pdf".equals(ext)) {
                return extractTextFromPdf(tempFile.toFile());
            } else if ("txt".equals(ext)) {
                return Files.readString(tempFile);
            } else {
                System.err.println("Unsupported file type for text extraction: " + ext);
                return "";
            }
        } finally {
            // Xóa file tạm
            Files.deleteIfExists(tempFile);
        }
    }

    private String extractTextFromPdf(File file) throws IOException {
        try (PDDocument document = PDDocument.load(file)) {
            if (document.isEncrypted()) {
                System.err.println("Warning: PDF is encrypted. Text extraction might fail.");
            }
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private List<String> splitIntoChunks(String text, int chunkSize, int overlap) {
        List<String> chunks = new ArrayList<>();
        if (text == null || text.trim().isEmpty()) {
            return chunks;
        }

        int textLength = text.length();
        if (textLength <= chunkSize) {
            chunks.add(text);
            return chunks;
        }

        int start = 0;
        while (start < textLength) {
            int end = Math.min(start + chunkSize, textLength);
            chunks.add(text.substring(start, end));
            start += (chunkSize - overlap);
            if (start >= textLength || chunkSize <= overlap) {
                break;
            }
        }
        return chunks;
    }

    private String getExtension(String filename) {
        if (filename == null) return "";
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex < 0) return "";
        return filename.substring(dotIndex + 1);
    }

    private void performAutoModeration(Document doc, String fullText) {
        if (doc.getModerationStatus() != null && doc.getModerationStatus() != com.lumiedu.document.enums.DocumentStatus.PENDING) {
            System.out.println("Document " + doc.getTitle() + " is already moderated (" + doc.getModerationStatus() + "). Skipping auto-moderation.");
            return;
        }
        try {
            System.out.println("Starting auto-moderation for document: " + doc.getTitle());
            String textToScan = fullText;
            if (textToScan.length() > 15000) {
                textToScan = textToScan.substring(0, 15000);
            }

            String systemPrompt = "You are an expert AI content moderator for an academic platform called LumiEdu. "
                    + "Review the content of the uploaded document for safety, academic integrity, and appropriateness. "
                    + "Check if the content violates policies: specifically check for "
                    + "1. Academic dishonesty or cheating services (e.g., 'thi hộ', 'làm hộ bài thi', 'dịch vụ giải bài kiểm tra'). "
                    + "2. Gambling, betting, casinos, or related promotions ('cờ bạc', 'cá độ', 'casino', 'lô đề'). "
                    + "3. Extremism, violence, illicit materials, weapons, severe harassment, or pornography. "
                    + "4. Leaked exam papers distributed illegally ('lộ đề thi'). "
                    + "You must respond ONLY with a JSON object containing: "
                    + "\"riskLevel\" (either \"SAFE\" or \"SUSPICIOUS\"), "
                    + "\"reasonEn\" (detailed explanation in English if SUSPICIOUS, or empty/brief safe note in English if SAFE), "
                    + "\"reasonVi\" (detailed explanation in Vietnamese if SUSPICIOUS, or empty/brief safe note in Vietnamese if SAFE), "
                    + "and \"confidenceScore\" (decimal between 0.0 and 1.0).";

            String rawJson = geminiServiceImpl.chat(systemPrompt, textToScan);
            
            String riskLevel = "SAFE";
            String reasonEn = "";
            String reasonVi = "";
            try {
                com.google.gson.JsonObject jsonObj = gson.fromJson(rawJson, com.google.gson.JsonObject.class);
                if (jsonObj.has("riskLevel")) {
                    riskLevel = jsonObj.get("riskLevel").getAsString();
                }
                if (jsonObj.has("reasonEn")) {
                    reasonEn = jsonObj.get("reasonEn").getAsString();
                } else if (jsonObj.has("reason")) {
                    reasonEn = jsonObj.get("reason").getAsString();
                }
                if (jsonObj.has("reasonVi")) {
                    reasonVi = jsonObj.get("reasonVi").getAsString();
                } else if (jsonObj.has("reason")) {
                    reasonVi = jsonObj.get("reason").getAsString();
                }
            } catch (Exception e) {
                System.err.println("Failed to parse moderation JSON: " + e.getMessage() + ". Raw output was: " + rawJson);
            }

            com.google.gson.JsonObject reasonObj = new com.google.gson.JsonObject();
            reasonObj.addProperty("en", reasonEn.isEmpty() ? "No issues flagged" : reasonEn);
            reasonObj.addProperty("vi", reasonVi.isEmpty() ? "Không phát hiện bất thường" : reasonVi);
            String combinedReason = gson.toJson(reasonObj);

            if ("SAFE".equalsIgnoreCase(riskLevel)) {
                doc.setModerationStatus(com.lumiedu.document.enums.DocumentStatus.APPROVED);
                doc.setModerationNote(combinedReason);
                doc.setRejectionReason(null);
                documentRepository.save(doc);
                
                sendNotification(doc, "Tài liệu hợp lệ", "Tài liệu '" + doc.getTitle() + "' của bạn đã được kiểm duyệt tự động thành công bằng AI và hiển thị công khai.");
                System.out.println("Document approved automatically by AI: " + doc.getTitle());
            } else {
                doc.setModerationStatus(com.lumiedu.document.enums.DocumentStatus.PENDING_REVIEW);
                doc.setModerationNote(combinedReason);
                doc.setRejectionReason(combinedReason);
                documentRepository.save(doc);
                
                sendNotification(doc, "Tài liệu cần xem xét lại", "Tài liệu '" + doc.getTitle() + "' chứa nội dung nghi vấn và đang chờ Admin duyệt thủ công.");
                System.out.println("Document flagged as SUSPICIOUS: " + doc.getTitle() + ". Reason: " + combinedReason);
            }
        } catch (Exception e) {
            System.err.println("Error during performAutoModeration: " + e.getMessage());
            // Fallback to PENDING_REVIEW on error to be safe
            doc.setModerationStatus(com.lumiedu.document.enums.DocumentStatus.PENDING_REVIEW);
            doc.setModerationNote("Lỗi hệ thống kiểm duyệt tự động: " + e.getMessage());
            doc.setRejectionReason("Lỗi hệ thống kiểm duyệt tự động.");
            documentRepository.save(doc);
        }
    }

    private void sendNotification(Document doc, String title, String content) {
        if (doc.getUserId() == null) return;
        try {
            User owner = userRepository.findById(doc.getUserId()).orElse(null);
            if (owner != null) {
                NotificationRequest req = NotificationRequest.builder()
                        .targetUserEmail(owner.getEmail())
                        .type("SYSTEM")
                        .title(title)
                        .message(content)
                        .documentId(doc.getId())
                        .documentName(doc.getTitle())
                        .build();
                notificationService.createNotification(req);
            }
        } catch (Exception e) {
            System.err.println("Failed to send notification for document moderation: " + e.getMessage());
        }
    }
}
