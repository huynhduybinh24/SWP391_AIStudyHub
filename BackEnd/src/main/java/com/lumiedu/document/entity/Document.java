package com.lumiedu.document.entity;

import com.lumiedu.document.enums.DocumentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "original_file_name")
    private String originalFileName;

    @Column(name = "file_url")
    private String fileUrl;

    @Column(name = "google_drive_file_id", length = 100)
    private String googleDriveFileId;

    @Column(name = "storage_provider", length = 50)
    @Builder.Default
    private String storageProvider = "LOCAL";

    @Column(name = "file_type", length = 50)
    private String fileType;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "subject", length = 100)
    private String subject;

    @Column(name = "visibility", length = 20)
    private String visibility;

    @Builder.Default
    @Column(name = "status", length = 20)
    private String status = "PENDING";

    @Column(name = "moderation_reason", columnDefinition = "TEXT")
    private String moderationReason;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "checksum", length = 64)
    private String checksum;

    @Builder.Default
    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "moderation_status", length = 20)
    @Builder.Default
    private DocumentStatus moderationStatus = DocumentStatus.APPROVED;

    @Column(name = "moderation_note", columnDefinition = "TEXT")
    private String moderationNote;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.deleted == null) {
            this.deleted = false;
        }
        if (this.status == null) {
            this.status = "PENDING";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
