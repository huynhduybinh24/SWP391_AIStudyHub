package com.lumiedu.ai.service;

import com.lumiedu.ai.entity.DocumentChunk;
import com.lumiedu.ai.repository.DocumentChunkRepository;
import com.lumiedu.document.entity.Document;
import com.lumiedu.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class DocumentChunkingService {

    @Value("${app.upload.dir}")
    private String uploadDir;

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;

    public void chunkAndIndexDocument(Long documentId) {
        Document doc = documentRepository.findById(documentId).orElse(null);
        if (doc == null || doc.getDeleted()) {
            return;
        }

        // Delete existing chunks first
        documentChunkRepository.deleteByDocumentId(documentId);

        String fullText = "";
        try {
            if (doc.getFileName() != null && !doc.getFileName().isEmpty()) {
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
                    System.err.println("File not found locally for chunking: " + filePath + ". Using document metadata as fallback.");
                }
            } else {
                System.err.println("Document has no local fileName (may be external URL). Using metadata as fallback for: " + doc.getTitle());
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
            documentChunks.add(DocumentChunk.builder()
                    .documentId(documentId)
                    .chunkIndex(i)
                    .content(chunks.get(i))
                    .build());
        }

        documentChunkRepository.saveAll(documentChunks);
        System.out.println("Successfully chunked and saved " + documentChunks.size() + " chunks for document: " + doc.getTitle());
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
