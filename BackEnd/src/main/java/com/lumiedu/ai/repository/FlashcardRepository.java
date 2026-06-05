package com.lumiedu.ai.repository;

import com.lumiedu.ai.entity.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {
    List<Flashcard> findByDocumentId(Long documentId);
    void deleteByDocumentId(Long documentId);
}
