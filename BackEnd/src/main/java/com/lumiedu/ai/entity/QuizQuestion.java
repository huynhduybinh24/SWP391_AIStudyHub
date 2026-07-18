package com.lumiedu.ai.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.lumiedu.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "quiz_question")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizQuestion extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    @JsonIgnore
    private Quiz quiz;

    @Column(name = "question_text", columnDefinition = "TEXT", nullable = false)
    private String questionText;

    @Column(name = "options", columnDefinition = "TEXT", nullable = false)
    private String options; // JSON serialized string array, e.g. ["A", "B", "C", "D"]

    @Column(name = "answer_index", nullable = false)
    private Integer answerIndex;

    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation;
}
