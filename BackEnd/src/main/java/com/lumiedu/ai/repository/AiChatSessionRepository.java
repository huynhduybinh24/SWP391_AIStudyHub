package com.lumiedu.ai.repository;

import com.lumiedu.ai.entity.AiChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiChatSessionRepository extends JpaRepository<AiChatSession, Long> {
    List<AiChatSession> findByDocumentIdAndUserId(Long documentId, Long userId);
    // Find sessions by user ID ordered by updated_at descending
    List<AiChatSession> findByUserIdOrderByUpdatedAtDesc(Long userId);
}
