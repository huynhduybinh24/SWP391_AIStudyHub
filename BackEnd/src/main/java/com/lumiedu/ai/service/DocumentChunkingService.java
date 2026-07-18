package com.lumiedu.ai.service;

import com.lumiedu.document.entity.Document;

public interface DocumentChunkingService {
    void chunkAndIndexDocument(Document doc);
}
