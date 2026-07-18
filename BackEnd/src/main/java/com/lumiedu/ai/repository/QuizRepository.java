package com.lumiedu.ai.repository;

import com.lumiedu.ai.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByDocumentId(Long documentId);
    Optional<Quiz> findFirstByDocumentIdOrderByCreatedAtDesc(Long documentId);
}
