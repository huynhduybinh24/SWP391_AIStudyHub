package com.lumiedu.document.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audio_records")
public class AudioRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Column(name = "audio_file_name")
    private String audioFileName;

    @Column(name = "audio_url")
    private String audioUrl;

    @Column(name = "duration")
    private Long duration;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Constructors
    public AudioRecord() {}

    public AudioRecord(Long id, Document document, String audioFileName, String audioUrl, Long duration, String mimeType, Long fileSize, LocalDateTime createdAt) {
        this.id = id;
        this.document = document;
        this.audioFileName = audioFileName;
        this.audioUrl = audioUrl;
        this.duration = duration;
        this.mimeType = mimeType;
        this.fileSize = fileSize;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Document getDocument() { return document; }
    public void setDocument(Document document) { this.document = document; }

    public String getAudioFileName() { return audioFileName; }
    public void setAudioFileName(String audioFileName) { this.audioFileName = audioFileName; }

    public String getAudioUrl() { return audioUrl; }
    public void setAudioUrl(String audioUrl) { this.audioUrl = audioUrl; }

    public Long getDuration() { return duration; }
    public void setDuration(Long duration) { this.duration = duration; }

    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder
    public static AudioRecordBuilder builder() {
        return new AudioRecordBuilder();
    }

    public static class AudioRecordBuilder {
        private Long id;
        private Document document;
        private String audioFileName;
        private String audioUrl;
        private Long duration;
        private String mimeType;
        private Long fileSize;
        private LocalDateTime createdAt;

        public AudioRecordBuilder id(Long id) { this.id = id; return this; }
        public AudioRecordBuilder document(Document document) { this.document = document; return this; }
        public AudioRecordBuilder audioFileName(String audioFileName) { this.audioFileName = audioFileName; return this; }
        public AudioRecordBuilder audioUrl(String audioUrl) { this.audioUrl = audioUrl; return this; }
        public AudioRecordBuilder duration(Long duration) { this.duration = duration; return this; }
        public AudioRecordBuilder mimeType(String mimeType) { this.mimeType = mimeType; return this; }
        public AudioRecordBuilder fileSize(Long fileSize) { this.fileSize = fileSize; return this; }
        public AudioRecordBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public AudioRecord build() {
            return new AudioRecord(id, document, audioFileName, audioUrl, duration, mimeType, fileSize, createdAt);
        }
    }
}
