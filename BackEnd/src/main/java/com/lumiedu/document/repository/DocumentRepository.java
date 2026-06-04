package com.lumiedu.document.repository;

import com.lumiedu.document.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
<<<<<<< HEAD
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findAllByDeletedFalse();

    List<Document> findAllByUserIdAndDeletedFalse(Long userId);

    Optional<Document> findByIdAndDeletedFalse(Long id);

    @Query("""
            SELECT d FROM Document d
            WHERE d.deleted = false
            AND (:userId IS NULL OR d.userId = :userId)
            AND (:keyword IS NULL OR LOWER(d.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(d.description) LIKE LOWER(CONCAT('%', :keyword, '%')))
            AND (:subject IS NULL OR LOWER(d.subject) = LOWER(:subject))
            AND (:fileType IS NULL OR d.fileType = :fileType)
            """)
    List<Document> searchDocuments(
            @Param("keyword") String keyword,
            @Param("subject") String subject,
            @Param("fileType") String fileType,
            @Param("userId") Long userId
    );
=======
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByUserId(Long userId);
>>>>>>> 7167afb331e078b4db90871ed7b1bca22f264d18
}
