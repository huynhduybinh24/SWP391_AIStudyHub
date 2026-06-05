package com.lumiedu.ai.entity;

import com.lumiedu.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "quiz_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizQuestion extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "document_id", nullable = false)
    private Long documentId;

    @Column(name = "q", columnDefinition = "TEXT")
    private String q;

    @Column(name = "options", columnDefinition = "TEXT")
    private String options;

    @Column(name = "answer")
    private Integer answer;

    @Column(name = "explain_text", columnDefinition = "TEXT")
    private String explain;
}
