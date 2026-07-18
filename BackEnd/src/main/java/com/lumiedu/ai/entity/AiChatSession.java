package com.lumiedu.ai.entity;

import com.lumiedu.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "ai_chat_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiChatSession extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "document_id")
    private Long documentId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "title", length = 255)
    private String title;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "ai_chat_session_documents",
        joinColumns = @JoinColumn(name = "session_id"),
        inverseJoinColumns = @JoinColumn(name = "document_id")
    )
    @Builder.Default
    private List<com.lumiedu.document.entity.Document> documents = new java.util.ArrayList<>();

    // Manual Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getDocumentId() { return documentId; }
    public void setDocumentId(Long documentId) { this.documentId = documentId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public List<com.lumiedu.document.entity.Document> getDocuments() { return documents; }
    public void setDocuments(List<com.lumiedu.document.entity.Document> documents) { this.documents = documents; }

    // Manual Builder
    public static AiChatSessionBuilder builder() {
        return new AiChatSessionBuilder();
    }

    public static class AiChatSessionBuilder {
        private Long id;
        private Long documentId;
        private Long userId;
        private String title;
        private List<com.lumiedu.document.entity.Document> documents = new java.util.ArrayList<>();

        public AiChatSessionBuilder id(Long id) { this.id = id; return this; }
        public AiChatSessionBuilder documentId(Long documentId) { this.documentId = documentId; return this; }
        public AiChatSessionBuilder userId(Long userId) { this.userId = userId; return this; }
        public AiChatSessionBuilder title(String title) { this.title = title; return this; }
        public AiChatSessionBuilder documents(List<com.lumiedu.document.entity.Document> documents) { this.documents = documents; return this; }

        public AiChatSession build() {
            return new AiChatSession(id, documentId, userId, title, documents);
        }
    }
}
// Force JDT LS revalidation 2
