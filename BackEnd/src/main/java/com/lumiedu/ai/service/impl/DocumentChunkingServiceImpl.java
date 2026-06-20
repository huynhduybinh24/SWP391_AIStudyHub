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
    private final Gson gson = new Gson();

    @Override
    @Async
    public void chunkAndIndexDocument(Long documentId) {
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
}
