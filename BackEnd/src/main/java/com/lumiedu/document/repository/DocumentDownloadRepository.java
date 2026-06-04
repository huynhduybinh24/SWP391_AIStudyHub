package com.lumiedu.document.repository;

import com.lumiedu.document.entity.DocumentDownload;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentDownloadRepository extends JpaRepository<DocumentDownload, Long> {

    List<DocumentDownload> findAllByDocumentId(Long documentId);

    List<DocumentDownload> findAllByUserId(Long userId);
}
