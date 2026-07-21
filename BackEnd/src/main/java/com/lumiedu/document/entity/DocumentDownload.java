package com.lumiedu.document.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "document_downloads")
public class DocumentDownload {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "downloaded_at")
    private LocalDateTime downloadedAt;

    @PrePersist
    protected void onCreate() {
        this.downloadedAt = LocalDateTime.now();
    }

    // Constructors
    public DocumentDownload() {}

    public DocumentDownload(Long id, Document document, Long userId, LocalDateTime downloadedAt) {
        this.id = id;
        this.document = document;
        this.userId = userId;
        this.downloadedAt = downloadedAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Document getDocument() { return document; }
    public void setDocument(Document document) { this.document = document; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public LocalDateTime getDownloadedAt() { return downloadedAt; }
    public void setDownloadedAt(LocalDateTime downloadedAt) { this.downloadedAt = downloadedAt; }

    // Builder
    public static DocumentDownloadBuilder builder() {
        return new DocumentDownloadBuilder();
    }

    public static class DocumentDownloadBuilder {
        private Long id;
        private Document document;
        private Long userId;
        private LocalDateTime downloadedAt;

        public DocumentDownloadBuilder id(Long id) { this.id = id; return this; }
        public DocumentDownloadBuilder document(Document document) { this.document = document; return this; }
        public DocumentDownloadBuilder userId(Long userId) { this.userId = userId; return this; }
        public DocumentDownloadBuilder downloadedAt(LocalDateTime downloadedAt) { this.downloadedAt = downloadedAt; return this; }

        public DocumentDownload build() {
            return new DocumentDownload(id, document, userId, downloadedAt);
        }
    }
}
