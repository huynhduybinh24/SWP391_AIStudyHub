package com.lumiedu.common;

import com.lumiedu.ai.repository.DocumentChunkRepository;
import com.lumiedu.ai.service.DocumentChunkingService;
import com.lumiedu.document.entity.Document;
import com.lumiedu.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class AutoIndexingRunner implements CommandLineRunner {

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final DocumentChunkingService documentChunkingService;

    @Override
    public void run(String... args) throws Exception {
        log.info("Starting AutoIndexingRunner: Checking for documents needing AI text chunking...");
        List<Document> documents = documentRepository.findAll();
        int indexedCount = 0;

        for (Document doc : documents) {
            try {
                var chunks = documentChunkRepository.findByDocumentId(doc.getId());
                if (chunks.isEmpty()) {
                    log.info("Auto-indexing document ID={}: '{}' (FileName={})", doc.getId(), doc.getTitle(), doc.getFileName());
                    documentChunkingService.chunkAndIndexDocument(doc.getId());
                    indexedCount++;
                }
            } catch (Exception e) {
                log.warn("Failed auto-indexing for document ID={}: {}", doc.getId(), e.getMessage());
            }
        }

        if (indexedCount > 0) {
            log.info("AutoIndexingRunner completed: Successfully chunked & indexed {} documents for AI features.", indexedCount);
        } else {
            log.info("AutoIndexingRunner completed: All existing documents are already chunked & indexed.");
        }
    }
}
