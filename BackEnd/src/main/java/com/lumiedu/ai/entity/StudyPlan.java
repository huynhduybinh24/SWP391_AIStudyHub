package com.lumiedu.ai.entity;

import com.lumiedu.common.entity.BaseEntity;
import com.lumiedu.document.entity.Document;
import jakarta.persistence.*;
import java.util.Set;

@Entity
@Table(name = "study_plans")
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

    // Constructors
    public StudyPlan() {}

    public StudyPlan(Long id, Long userId, String title, String subject, String planText, String curriculumJson, String completedLessonsJson, Long documentId, Set<Document> sourceDocuments) {
        this.id = id;
        this.userId = userId;
        this.title = title;
        this.subject = subject;
        this.planText = planText;
        this.curriculumJson = curriculumJson;
        this.completedLessonsJson = completedLessonsJson;
        this.documentId = documentId;
        this.sourceDocuments = sourceDocuments;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getPlanText() { return planText; }
    public void setPlanText(String planText) { this.planText = planText; }

    public String getCurriculumJson() { return curriculumJson; }
    public void setCurriculumJson(String curriculumJson) { this.curriculumJson = curriculumJson; }

    public String getCompletedLessonsJson() { return completedLessonsJson; }
    public void setCompletedLessonsJson(String completedLessonsJson) { this.completedLessonsJson = completedLessonsJson; }

    public Long getDocumentId() { return documentId; }
    public void setDocumentId(Long documentId) { this.documentId = documentId; }

    public Set<Document> getSourceDocuments() { return sourceDocuments; }
    public void setSourceDocuments(Set<Document> sourceDocuments) { this.sourceDocuments = sourceDocuments; }

    // Builder
    public static StudyPlanBuilder builder() {
        return new StudyPlanBuilder();
    }

    public static class StudyPlanBuilder {
        private Long id;
        private Long userId;
        private String title;
        private String subject;
        private String planText;
        private String curriculumJson;
        private String completedLessonsJson;
        private Long documentId;
        private Set<Document> sourceDocuments;

        public StudyPlanBuilder id(Long id) { this.id = id; return this; }
        public StudyPlanBuilder userId(Long userId) { this.userId = userId; return this; }
        public StudyPlanBuilder title(String title) { this.title = title; return this; }
        public StudyPlanBuilder subject(String subject) { this.subject = subject; return this; }
        public StudyPlanBuilder planText(String planText) { this.planText = planText; return this; }
        public StudyPlanBuilder curriculumJson(String curriculumJson) { this.curriculumJson = curriculumJson; return this; }
        public StudyPlanBuilder completedLessonsJson(String completedLessonsJson) { this.completedLessonsJson = completedLessonsJson; return this; }
        public StudyPlanBuilder documentId(Long documentId) { this.documentId = documentId; return this; }
        public StudyPlanBuilder sourceDocuments(Set<Document> sourceDocuments) { this.sourceDocuments = sourceDocuments; return this; }

        public StudyPlan build() {
            return new StudyPlan(id, userId, title, subject, planText, curriculumJson, completedLessonsJson, documentId, sourceDocuments);
        }
    }
}
