package com.lumiedu.document.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "document_downloads")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
}
