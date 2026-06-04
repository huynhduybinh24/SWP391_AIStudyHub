package com.lumiedu.document.repository;

import com.lumiedu.document.entity.DocumentTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentTagRepository extends JpaRepository<DocumentTag, Long> {

    List<DocumentTag> findAllByDocumentId(Long documentId);

    Optional<DocumentTag> findByDocumentIdAndName(Long documentId, String name);

    void deleteByDocumentIdAndName(Long documentId, String name);

    List<DocumentTag> findAllByName(String name);
}
