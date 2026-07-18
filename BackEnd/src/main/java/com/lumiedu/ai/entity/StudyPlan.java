package com.lumiedu.ai.entity;

import com.lumiedu.common.entity.BaseEntity;
import com.lumiedu.document.entity.Document;
import jakarta.persistence.*;
import lombok.*;
import java.util.Set;

@Entity
@Table(name = "study_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyPlan extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "subject", nullable = false, length = 100)
    private String subject;

    @Column(name = "plan_text", columnDefinition = "LONGTEXT", nullable = false)
    private String planText;

    @Column(name = "curriculum_json", columnDefinition = "LONGTEXT")
    private String curriculumJson;

    @Column(name = "completed_lessons_json", columnDefinition = "LONGTEXT")
    private String completedLessonsJson;

    @Column(name = "document_id")
    private Long documentId;

    @ManyToMany
    @JoinTable(
        name = "study_plan_documents",
        joinColumns = @JoinColumn(name = "study_plan_id"),
        inverseJoinColumns = @JoinColumn(name = "document_id")
    )
    private Set<Document> sourceDocuments;
}

