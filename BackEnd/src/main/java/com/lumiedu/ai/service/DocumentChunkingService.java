package com.lumiedu.ai.service;

public interface DocumentChunkingService {
    void chunkAndIndexDocument(Long documentId);
    boolean isProcessing(Long documentId);
}
