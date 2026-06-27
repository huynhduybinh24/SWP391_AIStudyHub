package com.lumiedu.document.entity;

import com.lumiedu.document.enums.DocumentStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
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

    @Column(name = "status", length = 20)
    private String status = "PENDING";

    @Column(name = "moderation_reason", columnDefinition = "TEXT")
    private String moderationReason;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "checksum", length = 64)
    private String checksum;

    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "moderation_status", length = 20)
    private DocumentStatus moderationStatus = DocumentStatus.APPROVED;

    @Column(name = "moderation_note", columnDefinition = "TEXT")
    private String moderationNote;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "drive_sync_status", length = 20)
    private String driveSyncStatus = "SYNCED";

    @Column(name = "drive_sync_error", columnDefinition = "TEXT")
    private String driveSyncError;

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
        if (this.driveSyncStatus == null) {
            this.driveSyncStatus = "SYNCED";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // --- Constructors ---
    public Document() {
    }

    public Document(Long id, String title, String description, String fileName, String originalFileName,
                    String fileUrl, String googleDriveFileId, String storageProvider, String fileType,
                    String mimeType, Long fileSize, String subject, String visibility, String status,
                    String moderationReason, Long userId, String checksum, Boolean deleted,
                    DocumentStatus moderationStatus, String moderationNote, LocalDateTime createdAt,
                    LocalDateTime updatedAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.fileName = fileName;
        this.originalFileName = originalFileName;
        this.fileUrl = fileUrl;
        this.googleDriveFileId = googleDriveFileId;
        this.storageProvider = storageProvider;
        this.fileType = fileType;
        this.mimeType = mimeType;
        this.fileSize = fileSize;
        this.subject = subject;
        this.visibility = visibility;
        this.status = status;
        this.moderationReason = moderationReason;
        this.userId = userId;
        this.checksum = checksum;
        this.deleted = deleted;
        this.moderationStatus = moderationStatus;
        this.moderationNote = moderationNote;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // --- Getters and Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getOriginalFileName() { return originalFileName; }
    public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    public String getGoogleDriveFileId() { return googleDriveFileId; }
    public void setGoogleDriveFileId(String googleDriveFileId) { this.googleDriveFileId = googleDriveFileId; }

    public String getStorageProvider() { return storageProvider; }
    public void setStorageProvider(String storageProvider) { this.storageProvider = storageProvider; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getVisibility() { return visibility; }
    public void setVisibility(String visibility) { this.visibility = visibility; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getModerationReason() { return moderationReason; }
    public void setModerationReason(String moderationReason) { this.moderationReason = moderationReason; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getChecksum() { return checksum; }
    public void setChecksum(String checksum) { this.checksum = checksum; }

    public Boolean getDeleted() { return deleted; }
    public void setDeleted(Boolean deleted) { this.deleted = deleted; }

    public DocumentStatus getModerationStatus() { return moderationStatus; }
    public void setModerationStatus(DocumentStatus moderationStatus) { this.moderationStatus = moderationStatus; }

    public String getModerationNote() { return moderationNote; }
    public void setModerationNote(String moderationNote) { this.moderationNote = moderationNote; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public Long getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(Long reviewedBy) { this.reviewedBy = reviewedBy; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public String getDriveSyncStatus() { return driveSyncStatus; }
    public void setDriveSyncStatus(String driveSyncStatus) { this.driveSyncStatus = driveSyncStatus; }

    public String getDriveSyncError() { return driveSyncError; }
    public void setDriveSyncError(String driveSyncError) { this.driveSyncError = driveSyncError; }

    // --- Builder Pattern ---
    public static DocumentBuilder builder() {
        return new DocumentBuilder();
    }

    public static class DocumentBuilder {
        private Long id;
        private String title;
        private String description;
        private String fileName;
        private String originalFileName;
        private String fileUrl;
        private String googleDriveFileId;
        private String storageProvider = "LOCAL";
        private String fileType;
        private String mimeType;
        private Long fileSize;
        private String subject;
        private String visibility;
        private String status = "PENDING";
        private String moderationReason;
        private Long userId;
        private String checksum;
        private Boolean deleted = false;
        private DocumentStatus moderationStatus = DocumentStatus.APPROVED;
        private String moderationNote;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private String rejectionReason;
        private Long reviewedBy;
        private LocalDateTime reviewedAt;
        private String driveSyncStatus = "SYNCED";
        private String driveSyncError;

        public DocumentBuilder id(Long id) { this.id = id; return this; }
        public DocumentBuilder title(String title) { this.title = title; return this; }
        public DocumentBuilder description(String description) { this.description = description; return this; }
        public DocumentBuilder fileName(String fileName) { this.fileName = fileName; return this; }
        public DocumentBuilder originalFileName(String originalFileName) { this.originalFileName = originalFileName; return this; }
        public DocumentBuilder fileUrl(String fileUrl) { this.fileUrl = fileUrl; return this; }
        public DocumentBuilder googleDriveFileId(String googleDriveFileId) { this.googleDriveFileId = googleDriveFileId; return this; }
        public DocumentBuilder storageProvider(String storageProvider) { this.storageProvider = storageProvider; return this; }
        public DocumentBuilder fileType(String fileType) { this.fileType = fileType; return this; }
        public DocumentBuilder mimeType(String mimeType) { this.mimeType = mimeType; return this; }
        public DocumentBuilder fileSize(Long fileSize) { this.fileSize = fileSize; return this; }
        public DocumentBuilder subject(String subject) { this.subject = subject; return this; }
        public DocumentBuilder visibility(String visibility) { this.visibility = visibility; return this; }
        public DocumentBuilder status(String status) { this.status = status; return this; }
        public DocumentBuilder moderationReason(String moderationReason) { this.moderationReason = moderationReason; return this; }
        public DocumentBuilder userId(Long userId) { this.userId = userId; return this; }
        public DocumentBuilder checksum(String checksum) { this.checksum = checksum; return this; }
        public DocumentBuilder deleted(Boolean deleted) { this.deleted = deleted; return this; }
        public DocumentBuilder moderationStatus(DocumentStatus moderationStatus) { this.moderationStatus = moderationStatus; return this; }
        public DocumentBuilder moderationNote(String moderationNote) { this.moderationNote = moderationNote; return this; }
        public DocumentBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public DocumentBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public DocumentBuilder rejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; return this; }
        public DocumentBuilder reviewedBy(Long reviewedBy) { this.reviewedBy = reviewedBy; return this; }
        public DocumentBuilder reviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; return this; }
        public DocumentBuilder driveSyncStatus(String driveSyncStatus) { this.driveSyncStatus = driveSyncStatus; return this; }
        public DocumentBuilder driveSyncError(String driveSyncError) { this.driveSyncError = driveSyncError; return this; }

        public Document build() {
            Document doc = new Document();
            doc.setId(this.id);
            doc.setTitle(this.title);
            doc.setDescription(this.description);
            doc.setFileName(this.fileName);
            doc.setOriginalFileName(this.originalFileName);
            doc.setFileUrl(this.fileUrl);
            doc.setGoogleDriveFileId(this.googleDriveFileId);
            doc.setStorageProvider(this.storageProvider);
            doc.setFileType(this.fileType);
            doc.setMimeType(this.mimeType);
            doc.setFileSize(this.fileSize);
            doc.setSubject(this.subject);
            doc.setVisibility(this.visibility);
            doc.setStatus(this.status);
            doc.setModerationReason(this.moderationReason);
            doc.setUserId(this.userId);
            doc.setChecksum(this.checksum);
            doc.setDeleted(this.deleted);
            doc.setModerationStatus(this.moderationStatus);
            doc.setModerationNote(this.moderationNote);
            doc.setCreatedAt(this.createdAt);
            doc.setUpdatedAt(this.updatedAt);
            doc.setRejectionReason(this.rejectionReason);
            doc.setReviewedBy(this.reviewedBy);
            doc.setReviewedAt(this.reviewedAt);
            doc.setDriveSyncStatus(this.driveSyncStatus);
            doc.setDriveSyncError(this.driveSyncError);
            return doc;
        }
    }
}
