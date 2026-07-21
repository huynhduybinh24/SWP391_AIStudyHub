package com.lumiedu.ai.repository;

import com.lumiedu.ai.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    List<QuizAttempt> findByUserId(Long userId);
    List<QuizAttempt> findByDocumentId(Long documentId);
    boolean existsByUserIdAndDocumentId(Long userId, Long documentId);

    @Query("""
            SELECT qa FROM QuizAttempt qa
            JOIN Document d ON qa.documentId = d.id
            WHERE d.deleted = false
            AND LOWER(d.subject) = LOWER(:subject)
            """)
    List<QuizAttempt> findAllBySubject(@Param("subject") String subject);

    @Query("""
            SELECT qa FROM QuizAttempt qa
            JOIN Document d ON qa.documentId = d.id
            WHERE d.deleted = false
            AND qa.userId = :userId
            AND LOWER(d.subject) = LOWER(:subject)
            """)
    List<QuizAttempt> findAllByUserIdAndSubject(@Param("userId") Long userId, @Param("subject") String subject);
}
