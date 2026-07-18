package com.lumiedu.ai.repository;

import com.lumiedu.ai.entity.AiChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface AiChatSessionRepository extends JpaRepository<AiChatSession, Long> {
    List<AiChatSession> findByDocumentIdAndUserId(Long documentId, Long userId);
    // Find sessions by user ID ordered by updated_at descending
    List<AiChatSession> findByUserIdOrderByUpdatedAtDesc(Long userId);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM ai_chat_session_documents WHERE document_id = :documentId", nativeQuery = true)
    void deleteSessionDocumentsByDocumentId(@Param("documentId") Long documentId);

    @Modifying
    @Transactional
    @Query("UPDATE AiChatSession s SET s.documentId = null WHERE s.documentId = :documentId")
    void nullifyDocumentId(@Param("documentId") Long documentId);
}
