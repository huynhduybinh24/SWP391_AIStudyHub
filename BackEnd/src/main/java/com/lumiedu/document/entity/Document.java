package com.lumiedu.document.entity;

<<<<<<< HEAD
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

=======
import com.lumiedu.common.entity.BaseEntity;
import com.lumiedu.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

>>>>>>> 7167afb331e078b4db90871ed7b1bca22f264d18
@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
<<<<<<< HEAD
public class Document {
=======
public class Document extends BaseEntity {
>>>>>>> 7167afb331e078b4db90871ed7b1bca22f264d18

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

<<<<<<< HEAD
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

    @Column(name = "user_id")
    private Long userId;

    @Builder.Default
    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;

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
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
=======
    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "file_size", nullable = false)
    private Long fileSize; // size in bytes

    @Column(name = "file_url", columnDefinition = "LONGTEXT")
    private String fileUrl;

    @Column(name = "file_type", nullable = false, length = 50)
    private String fileType; // PDF, IMAGE, AUDIO, VIDEO, OTHER

    @Column(name = "checksum", nullable = false, length = 64)
    private String checksum; // hash/checksum to find duplicates

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
>>>>>>> 7167afb331e078b4db90871ed7b1bca22f264d18
}
