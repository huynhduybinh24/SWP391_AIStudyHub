package com.lumiedu.document.repository;

import com.lumiedu.document.entity.DocumentShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentShareRepository extends JpaRepository<DocumentShare, Long> {
    List<DocumentShare> findByDocumentId(Long documentId);
    Optional<DocumentShare> findByDocumentIdAndShareeEmail(Long documentId, String shareeEmail);
    void deleteByDocumentIdAndShareeEmail(Long documentId, String shareeEmail);
    List<DocumentShare> findByShareeEmail(String shareeEmail);
}
