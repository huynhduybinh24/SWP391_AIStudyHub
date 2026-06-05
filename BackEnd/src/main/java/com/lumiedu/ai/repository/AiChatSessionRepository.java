package com.lumiedu.ai.repository;

import com.lumiedu.ai.entity.AiChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiChatSessionRepository extends JpaRepository<AiChatSession, Long> {
    Optional<AiChatSession> findByDocumentIdAndUserId(Long documentId, Long userId);
    List<AiChatSession> findByUserId(Long userId);
}
