package com.lumiedu.ai.repository;

import com.lumiedu.ai.entity.AiSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiSummaryRepository extends JpaRepository<AiSummary, Long> {
    Optional<AiSummary> findByDocumentId(Long documentId);
}
