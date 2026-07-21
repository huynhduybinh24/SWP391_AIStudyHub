package com.lumiedu.document.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "document_tags")
public class DocumentTag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Constructors
    public DocumentTag() {}

    public DocumentTag(Long id, String name, Document document, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.document = document;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Document getDocument() { return document; }
    public void setDocument(Document document) { this.document = document; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder
    public static DocumentTagBuilder builder() {
        return new DocumentTagBuilder();
    }

    public static class DocumentTagBuilder {
        private Long id;
        private String name;
        private Document document;
        private LocalDateTime createdAt;

        public DocumentTagBuilder id(Long id) { this.id = id; return this; }
        public DocumentTagBuilder name(String name) { this.name = name; return this; }
        public DocumentTagBuilder document(Document document) { this.document = document; return this; }
        public DocumentTagBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public DocumentTag build() {
            return new DocumentTag(id, name, document, createdAt);
        }
    }
}
