package com.lumiedu.ai.entity;

import com.lumiedu.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "quiz_attempt")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAttempt extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "document_id", nullable = false)
    private Long documentId;

    @Column(name = "quiz_id")
    private Long quizId;

    @Column(name = "score", nullable = false)
    private Integer score; // Score percentage (0 to 100)

    @Column(name = "submitted_answers", columnDefinition = "TEXT")
    private String submittedAnswers; // JSON string format: {"questionId": selectedIndex}
}
