package com.lumiedu.prompt.repository;

import com.lumiedu.prompt.entity.PromptReviewHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PromptReviewHistoryRepository extends JpaRepository<PromptReviewHistory, Long> {
    List<PromptReviewHistory> findByPromptVersionIdOrderByPerformedAtAsc(Long promptVersionId);
}
