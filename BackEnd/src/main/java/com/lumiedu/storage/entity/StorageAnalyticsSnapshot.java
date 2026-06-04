package com.lumiedu.storage.entity;

import com.lumiedu.common.entity.BaseEntity;
import com.lumiedu.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "storage_analytics_snapshots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StorageAnalyticsSnapshot extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "total_used_mb", nullable = false)
    private Double totalUsedMb;

    @Column(name = "limit_mb", nullable = false)
    private Double limitMb;

    @Column(name = "file_count", nullable = false)
    @Builder.Default
    private Integer fileCount = 0;

    @Column(name = "document_count")
    @Builder.Default
    private Integer documentCount = 0;

    @Column(name = "media_count")
    @Builder.Default
    private Integer mediaCount = 0;

    @Column(name = "other_count")
    @Builder.Default
    private Integer otherCount = 0;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;
}
